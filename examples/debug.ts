/**
 * Diagnostic script for the Talonic SDK against the live production API.
 *
 * Usage:
 *   TALONIC_API_KEY=tlnc_... \
 *   TALONIC_TEST_FILE="../Test files/Structured Market Analysis.pdf" \
 *   npx tsx examples/debug.ts
 *
 * Prints raw HTTP details for every call, including the full response
 * body on errors. Use this to figure out what the API is actually
 * returning when something does not behave as expected.
 */

import { existsSync, readFileSync } from "node:fs"
import { basename } from "node:path"

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  csv: "text/csv",
}

function mimeFromName(name: string): string {
  const dot = name.lastIndexOf(".")
  if (dot === -1) return "application/octet-stream"
  return EXT_TO_MIME[name.slice(dot + 1).toLowerCase()] ?? "application/octet-stream"
}

const apiKey = process.env["TALONIC_API_KEY"]
if (!apiKey) {
  console.error("Set TALONIC_API_KEY before running.")
  process.exit(1)
}

const baseUrl = process.env["TALONIC_BASE_URL"] ?? "https://api.talonic.com"
const testFile = process.env["TALONIC_TEST_FILE"]

async function rawCall(
  label: string,
  method: string,
  path: string,
  body?: BodyInit,
  extraHeaders: Record<string, string> = {},
): Promise<void> {
  console.log(`\n=== ${label} ===`)
  console.log(`${method} ${baseUrl}${path}`)
  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${apiKey}`,
        accept: "application/json",
        "user-agent": "talonic-debug/0.1",
        ...extraHeaders,
      },
      body,
      signal: controller.signal,
    })
    const elapsed = Date.now() - start
    console.log(`status: ${res.status} ${res.statusText}`)
    console.log(`elapsed: ${elapsed}ms`)
    console.log("rate-limit headers:", {
      limit: res.headers.get("x-ratelimit-limit"),
      remaining: res.headers.get("x-ratelimit-remaining"),
      reset: res.headers.get("x-ratelimit-reset"),
    })
    console.log(`request-id: ${res.headers.get("x-request-id") ?? "(none)"}`)
    console.log(`content-type: ${res.headers.get("content-type")}`)
    const text = await res.text()
    if (text.length > 2000) {
      console.log(`body (${text.length} bytes, first 2000):`, text.slice(0, 2000))
    } else {
      console.log("body:", text)
    }
  } catch (err) {
    const elapsed = Date.now() - start
    console.log(`elapsed: ${elapsed}ms`)
    console.log("FAILED:", err instanceof Error ? `${err.name}: ${err.message}` : String(err))
  } finally {
    clearTimeout(timeout)
  }
}

async function main(): Promise<void> {
  console.log(`base URL: ${baseUrl}`)
  console.log(`api key prefix: ${apiKey!.slice(0, 12)}...`)

  // 1. List schemas (the one that timed out).
  await rawCall("LIST SCHEMAS", "GET", "/v1/schemas")

  // 2. List documents (the one that worked).
  await rawCall("LIST DOCUMENTS", "GET", "/v1/documents?per_page=5")

  // 3. Try a few alternate schema paths in case the docs and prod diverged.
  await rawCall("LIST SCHEMAS (no v1)", "GET", "/schemas")
  await rawCall("LIST EXTRACTIONS", "GET", "/v1/extractions?per_page=5")

  // 4. Try extract with no schema (auto-discover).
  if (testFile && existsSync(testFile)) {
    const buffer = readFileSync(testFile)
    const filename = basename(testFile)
    console.log(`\nTest file: ${testFile} (${buffer.length} bytes)`)

    const fd1 = new FormData()
    fd1.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: mimeFromName(filename) }),
      filename,
    )
    await rawCall("EXTRACT (no schema)", "POST", "/v1/extract", fd1)

    // 5. Try extract with an inline schema in the simplified-fields format.
    const fd2 = new FormData()
    fd2.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: mimeFromName(filename) }),
      filename,
    )
    fd2.append(
      "schema",
      JSON.stringify({
        fields: [
          { name: "title", type: "string" },
          { name: "summary", type: "string" },
        ],
      }),
    )
    await rawCall("EXTRACT (simplified-fields schema)", "POST", "/v1/extract", fd2)

    // 6. Try extract with a flat-map schema.
    const fd3 = new FormData()
    fd3.append(
      "file",
      new Blob([new Uint8Array(buffer)], { type: mimeFromName(filename) }),
      filename,
    )
    fd3.append(
      "schema",
      JSON.stringify({
        title: "string",
        summary: "string",
      }),
    )
    await rawCall("EXTRACT (flat-map schema)", "POST", "/v1/extract", fd3)
  } else {
    console.log("\nSkipping extract probes (TALONIC_TEST_FILE not set or file missing).")
  }
}

await main()
