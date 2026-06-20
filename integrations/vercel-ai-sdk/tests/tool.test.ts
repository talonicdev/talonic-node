import { describe, expect, it, vi } from "vitest"
import type { Talonic } from "@talonic/node"
import { talonicExtractTool } from "../src/index"

/** Build a fake @talonic/node client with a mocked `extract`. */
function mockClient(impl?: (params: unknown) => unknown): {
  client: Talonic
  extract: ReturnType<typeof vi.fn>
} {
  const extract = vi.fn(
    impl ??
      (() => ({
        extraction_id: "ext_123",
        status: "completed",
        document: {
          id: "doc_1",
          filename: "invoice.pdf",
          type_detected: "invoice",
          language_detected: "en",
          pages: 2,
        },
        data: { vendor_name: "ACME", total_amount: 42 },
        schema: { definition: { vendor_name: "string", total_amount: "number" } },
        confidence: { overall: 0.97, fields: { vendor_name: 0.99, total_amount: 0.95 } },
        rateLimit: null,
        cost: null,
      })),
  )
  return { client: { extract } as unknown as Talonic, extract }
}

/** Invoke a tool's execute() the way the AI SDK runtime does. */
async function run(tool: ReturnType<typeof talonicExtractTool>, input: unknown) {
  // execute is always defined for this tool.
  return tool.execute!(input as never, {
    toolCallId: "call_1",
    messages: [],
  } as never)
}

describe("talonicExtractTool", () => {
  it("builds a tool with a description and input schema", () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    expect(typeof t.description).toBe("string")
    expect(t.description!.length).toBeGreaterThan(0)
    expect(t.inputSchema).toBeDefined()
    expect(typeof t.execute).toBe("function")
  })

  it("respects a custom description", () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client, description: "custom desc" })
    expect(t.description).toBe("custom desc")
  })

  it("maps file_url + schema into ExtractParams and trims the result", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })

    const out = await run(t, {
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string", total_amount: "number" },
      instructions: "amounts in EUR",
    })

    expect(extract).toHaveBeenCalledTimes(1)
    expect(extract).toHaveBeenCalledWith({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string", total_amount: "number" },
      instructions: "amounts in EUR",
    })
    expect(out).toEqual({
      extraction_id: "ext_123",
      data: { vendor_name: "ACME", total_amount: 42 },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99, total_amount: 0.95 } },
      schema: { vendor_name: "string", total_amount: "number" },
      document: {
        id: "doc_1",
        filename: "invoice.pdf",
        type_detected: "invoice",
        language_detected: "en",
        pages: 2,
      },
    })
  })

  it("supports auto-schema (no schema provided)", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })

    await run(t, { document_id: "doc_99" })

    expect(extract).toHaveBeenCalledWith({ document_id: "doc_99" })
  })

  it("decodes base64 into a Uint8Array file with filename", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })

    const bytes = "hello talonic"
    const b64 = Buffer.from(bytes).toString("base64")
    await run(t, { file_base64: b64, filename: "note.txt" })

    const call = extract.mock.calls[0]![0] as { file: Uint8Array; filename: string }
    expect(call.filename).toBe("note.txt")
    expect(Buffer.from(call.file).toString()).toBe(bytes)
  })

  it("strips a data-URL prefix from base64 payloads", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })

    const b64 = Buffer.from("pdfbytes").toString("base64")
    await run(t, { file_base64: `data:application/pdf;base64,${b64}`, filename: "a.pdf" })

    const call = extract.mock.calls[0]![0] as { file: Uint8Array }
    expect(Buffer.from(call.file).toString()).toBe("pdfbytes")
  })

  it("rejects when no document source is provided", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(run(t, { schema: { a: "string" } })).rejects.toThrow(/document source/)
    expect(extract).not.toHaveBeenCalled()
  })

  it("rejects when multiple document sources are provided", async () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(
      run(t, { file_url: "https://x/y.pdf", document_id: "doc_1" }),
    ).rejects.toThrow(/only one document source/)
  })

  it("rejects base64 without a filename", async () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(run(t, { file_base64: "aGk=" })).rejects.toThrow(/filename/)
  })

  it("rejects schema + schema_id together", async () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(
      run(t, { file_url: "https://x/y.pdf", schema: { a: "string" }, schema_id: "s_1" }),
    ).rejects.toThrow(/schema_id/)
  })
})
