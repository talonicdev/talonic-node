#!/usr/bin/env tsx
/**
 * Check that every API path the SDK calls exists in Talonic's official
 * OpenAPI spec (shipped via the `@talonic/docs` npm package).
 *
 * This is the only safety net we have against drift like the one we hit
 * during v0.1 development, where the published markdown reference doc
 * disagreed with production on several paths (`/search` vs `/v1/search`,
 * `/filter/documents` vs `/v1/documents/filter`, a non-existent
 * `/fields/autocomplete`, etc).
 *
 * Strategy: scan `src/**\/*.ts` for `path: "..."` literals, normalise
 * `${id}` style placeholders to OpenAPI `{id}` form, then verify every
 * path appears in the spec. Exits 1 on drift.
 *
 * Run with `npm run check:spec`.
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { execSync } from "node:child_process"

interface OpenApiSpec {
  paths: Record<string, unknown>
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, "..")

const specPath = resolve(repoRoot, "node_modules/@talonic/docs/openapi.json")
const spec = JSON.parse(readFileSync(specPath, "utf8")) as OpenApiSpec
const validPaths = new Set(Object.keys(spec.paths))

function listSourceFiles(): string[] {
  const out = execSync('find src -type f -name "*.ts"', {
    cwd: repoRoot,
    encoding: "utf8",
  })
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => resolve(repoRoot, p))
}

/**
 * Convert a JavaScript template-literal-ish path into the OpenAPI
 * `{name}` placeholder form. Handles `${id}`, `${encodeURIComponent(id)}`,
 * `${a.b.c}`, `${runId}`, and similar.
 *
 * Strategy: replace each `${...}` block with `{<lastWord>}` where
 * `lastWord` is the rightmost identifier inside the braces. That is
 * usually the variable name we care about (e.g. `id` for
 * `encodeURIComponent(id)`, `c` for `a.b.c`).
 */
function normalisePath(raw: string): string {
  return raw.replace(/\$\{[^}]*\}/g, (match) => {
    const inner = match.slice(2, -1)
    const words = inner.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? []
    const last = words[words.length - 1] ?? "var"
    return `{${last}}`
  })
}

/**
 * Map well-known SDK names to the OpenAPI placeholder names.
 * Keeps the SDK code idiomatic without having to rename our local vars
 * just to match the spec.
 */
const PARAM_ALIASES: Record<string, string> = {
  // SDK uses :id consistently, OpenAPI uses {id}, {key}, etc.
  // Add entries here if a path-template name diverges from spec.
}

function applyAliases(path: string): string {
  let out = path
  for (const [from, to] of Object.entries(PARAM_ALIASES)) {
    out = out.replace(new RegExp(`\\{${from}\\}`, "g"), `{${to}}`)
  }
  return out
}

interface CallSite {
  file: string
  line: number
  rawPath: string
  normalisedPath: string
}

const PATH_REGEX = /path:\s*[`"]([^`"]*?)[`"]/g

function extractCallSites(filePath: string): CallSite[] {
  const content = readFileSync(filePath, "utf8")
  const lines = content.split("\n")
  const sites: CallSite[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    if (!line.includes("path:")) continue
    const matches = line.matchAll(PATH_REGEX)
    for (const m of matches) {
      const raw = m[1]
      if (raw === undefined) continue
      if (!raw.startsWith("/")) continue
      const normalised = applyAliases(normalisePath(raw))
      sites.push({
        file: filePath.replace(repoRoot + "/", ""),
        line: i + 1,
        rawPath: raw,
        normalisedPath: normalised,
      })
    }
  }
  return sites
}

function main(): void {
  const files = listSourceFiles()
  const allSites: CallSite[] = []
  for (const f of files) allSites.push(...extractCallSites(f))

  if (allSites.length === 0) {
    console.error("No `path:` literals found in src/. Did the layout change?")
    process.exit(1)
  }

  const drifted: CallSite[] = []
  for (const site of allSites) {
    if (!validPaths.has(site.normalisedPath)) {
      drifted.push(site)
    }
  }

  if (drifted.length > 0) {
    console.error(`✗ API spec drift detected: ${drifted.length} path(s) not in OpenAPI spec.`)
    console.error("")
    for (const d of drifted) {
      console.error(`  ${d.file}:${d.line}`)
      console.error(`    raw:        ${d.rawPath}`)
      console.error(`    normalised: ${d.normalisedPath}`)
    }
    console.error("")
    console.error(
      `Spec source: @talonic/docs ${specVersion()} (${Object.keys(spec.paths).length} paths).`,
    )
    console.error("Either fix the SDK to match the spec, or update @talonic/docs.")
    process.exit(1)
  }

  console.log(
    `✓ All ${allSites.length} SDK call site(s) match the OpenAPI spec ` +
      `(@talonic/docs ${specVersion()}, ${Object.keys(spec.paths).length} paths).`,
  )
}

function specVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(repoRoot, "node_modules/@talonic/docs/package.json"), "utf8"),
    ) as { version: string }
    return pkg.version
  } catch {
    return "unknown"
  }
}

main()
