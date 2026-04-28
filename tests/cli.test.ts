import { describe, expect, it, vi } from "vitest"
import { Talonic } from "../src/client"
import { dispatch, parseArgs, run } from "../src/cli"

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}

function makeTalonic(responseBody: unknown = { data: [] }) {
  const fetchFn = vi.fn().mockResolvedValue(jsonResponse(responseBody))
  const talonic = new Talonic({
    apiKey: "tlnc_test",
    fetch: fetchFn as unknown as typeof fetch,
    maxRetries: 0,
  })
  return { talonic, fetchFn }
}

describe("parseArgs", () => {
  it("collects positional arguments", () => {
    const { positional, flags } = parseArgs(["schemas", "list"])
    expect(positional).toEqual(["schemas", "list"])
    expect(flags).toEqual({})
  })

  it("parses --flag=value", () => {
    const { flags } = parseArgs(["documents", "list", "--per-page=20"])
    expect(flags["per-page"]).toBe("20")
  })

  it("parses --flag value (space-separated)", () => {
    const { flags } = parseArgs(["documents", "list", "--per-page", "20"])
    expect(flags["per-page"]).toBe("20")
  })

  it("parses --flag as boolean when no value follows", () => {
    const { flags } = parseArgs(["extract", "f.pdf", "--include-markdown"])
    expect(flags["include-markdown"]).toBe(true)
  })

  it("parses short -h and -v flags", () => {
    expect(parseArgs(["-h"]).flags["h"]).toBe(true)
    expect(parseArgs(["-v"]).flags["v"]).toBe(true)
  })

  it("handles a complex extract invocation", () => {
    const { positional, flags } = parseArgs([
      "extract",
      "./invoice.pdf",
      "--schema",
      '{"vendor_name":"string"}',
      "--instructions=Focus on totals",
    ])
    expect(positional).toEqual(["extract", "./invoice.pdf"])
    expect(flags["schema"]).toBe('{"vendor_name":"string"}')
    expect(flags["instructions"]).toBe("Focus on totals")
  })

  it("does not consume the next token as a value if it starts with -", () => {
    const { flags } = parseArgs(["--include-markdown", "--schema-id=sch_1"])
    expect(flags["include-markdown"]).toBe(true)
    expect(flags["schema-id"]).toBe("sch_1")
  })
})

describe("dispatch", () => {
  it("schemas list calls GET /v1/schemas and prints JSON", async () => {
    const { talonic, fetchFn } = makeTalonic({ data: [{ id: "sch_1", name: "X" }] })
    const out = vi.fn()
    await dispatch(talonic, parseArgs(["schemas", "list"]), out)
    expect(fetchFn.mock.calls[0][0]).toContain("/v1/schemas")
    expect(out).toHaveBeenCalledOnce()
    expect(out.mock.calls[0][0]).toContain("sch_1")
  })

  it("schemas get requires an id", async () => {
    const { talonic } = makeTalonic()
    await expect(dispatch(talonic, parseArgs(["schemas", "get"]), () => {})).rejects.toThrow(
      /Usage:/,
    )
  })

  it("documents list forwards --per-page and --status", async () => {
    const { talonic, fetchFn } = makeTalonic({ data: [], pagination: {} })
    await dispatch(
      talonic,
      parseArgs(["documents", "list", "--per-page=25", "--status=completed"]),
      () => {},
    )
    const url = fetchFn.mock.calls[0][0] as string
    expect(url).toContain("per_page=25")
    expect(url).toContain("status=completed")
  })

  it("extract requires a file path", async () => {
    const { talonic } = makeTalonic()
    await expect(dispatch(talonic, parseArgs(["extract"]), () => {})).rejects.toThrow(/Usage:/)
  })

  it("extract parses --schema as JSON", async () => {
    // We do not actually want to read a file; the dispatch will throw
    // when it tries to read the path, but the schema flag should parse
    // first. We assert the JSON parse error path with a malformed value
    // rather than a missing file.
    const { talonic } = makeTalonic()
    await expect(
      dispatch(talonic, parseArgs(["extract", "no-such-file", "--schema=not-json"]), () => {}),
    ).rejects.toThrow(/--schema is not valid JSON/)
  })

  it("unknown command throws a clear error", async () => {
    const { talonic } = makeTalonic()
    await expect(dispatch(talonic, parseArgs(["wat"]), () => {})).rejects.toThrow(/Unknown command/)
  })
})

describe("run (full glue)", () => {
  it("--version prints VERSION and exits 0", async () => {
    const out = vi.fn()
    const code = await run(["--version"], {}, out)
    expect(code).toBe(0)
    expect(out).toHaveBeenCalledOnce()
    expect(out.mock.calls[0][0]).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it("--help prints help and exits 0", async () => {
    const out = vi.fn()
    const code = await run(["--help"], {}, out)
    expect(code).toBe(0)
    expect(out.mock.calls[0][0]).toContain("USAGE")
  })

  it("with no args prints help and exits 0", async () => {
    const out = vi.fn()
    const code = await run([], {}, out)
    expect(code).toBe(0)
    expect(out.mock.calls[0][0]).toContain("USAGE")
  })

  it("missing TALONIC_API_KEY exits 1 with a clear message", async () => {
    const err = vi.fn()
    const code = await run(["schemas", "list"], {}, () => {}, err)
    expect(code).toBe(1)
    expect(err.mock.calls[0][0]).toMatch(/TALONIC_API_KEY/)
  })
})
