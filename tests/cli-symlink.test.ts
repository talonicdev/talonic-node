/**
 * Regression test for the silent-no-output bug introduced by a brittle
 * `import.meta.url === \`file://${process.argv[1]}\`` guard.
 *
 * When the CLI is invoked via the npm-managed bin symlink (which is how
 * end users always invoke it), `process.argv[1]` is the symlink path
 * while `import.meta.url` is the resolved file URL. String comparison
 * fails, the auto-run guard short-circuits, `run()` never executes, and
 * the process exits silently with code 0.
 *
 * This test reproduces that exact invocation shape against the actual
 * built bundle, so a future regression of the guard would be caught
 * before publish rather than after.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { VERSION } from "../src/version"

const distCliPath = resolve(fileURLToPath(import.meta.url), "..", "..", "dist", "cli.js")
const distExists = existsSync(distCliPath)

describe("CLI bin via symlink (regression: import.meta.url guard)", () => {
  let workDir: string
  let symlinkPath: string

  beforeAll(() => {
    if (!distExists) return
    workDir = mkdtempSync(join(tmpdir(), "talonic-cli-symlink-"))
    symlinkPath = join(workDir, "talonic")
    symlinkSync(distCliPath, symlinkPath)
  })

  afterAll(() => {
    if (workDir) rmSync(workDir, { recursive: true, force: true })
  })

  it.skipIf(!distExists)(
    "prints VERSION when the bundled CLI is invoked through a symlink",
    () => {
      const result = spawnSync(process.execPath, [symlinkPath, "--version"], {
        encoding: "utf8",
      })
      expect(result.status).toBe(0)
      expect(result.stdout.trim()).toBe(VERSION)
    },
  )

  it.skipIf(!distExists)("prints help when the symlinked CLI is invoked with --help", () => {
    const result = spawnSync(process.execPath, [symlinkPath, "--help"], {
      encoding: "utf8",
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain("USAGE")
  })
})
