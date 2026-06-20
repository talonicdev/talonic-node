import { describe, expect, it, vi } from "vitest"
import type { Talonic } from "@talonic/node"
import { talonicExtractTool, type TalonicExtractToolResult } from "../src/index"

function mockClient(): { client: Talonic; extract: ReturnType<typeof vi.fn> } {
  const extract = vi.fn(() => ({
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
  }))
  return { client: { extract } as unknown as Talonic, extract }
}

describe("talonicExtractTool (LangChain)", () => {
  it("builds a structured tool with name, description, and schema", () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    expect(t.name).toBe("talonic_extract_document")
    expect(typeof t.description).toBe("string")
    expect(t.description.length).toBeGreaterThan(0)
    expect(t.schema).toBeDefined()
  })

  it("respects custom name and description", () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client, name: "extract_doc", description: "d" })
    expect(t.name).toBe("extract_doc")
    expect(t.description).toBe("d")
  })

  it("invoke() maps file_url + schema and returns trimmed JSON", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })

    const raw = await t.invoke({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string", total_amount: "number" },
    })

    expect(extract).toHaveBeenCalledWith({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string", total_amount: "number" },
    })

    const parsed = JSON.parse(raw as string) as TalonicExtractToolResult
    expect(parsed.extraction_id).toBe("ext_123")
    expect(parsed.data).toEqual({ vendor_name: "ACME", total_amount: 42 })
    expect(parsed.confidence?.overall).toBe(0.97)
    expect(parsed.schema).toEqual({ vendor_name: "string", total_amount: "number" })
    expect(parsed.document.id).toBe("doc_1")
  })

  it("supports auto-schema (no schema provided)", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })
    await t.invoke({ document_id: "doc_99" })
    expect(extract).toHaveBeenCalledWith({ document_id: "doc_99" })
  })

  it("decodes base64 into a Uint8Array file", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })
    const b64 = Buffer.from("hello").toString("base64")
    await t.invoke({ file_base64: b64, filename: "note.txt" })
    const call = extract.mock.calls[0]![0] as { file: Uint8Array; filename: string }
    expect(call.filename).toBe("note.txt")
    expect(Buffer.from(call.file).toString()).toBe("hello")
  })

  it("rejects when no document source is provided", async () => {
    const { client, extract } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(t.invoke({ schema: { a: "string" } })).rejects.toThrow(/document source/)
    expect(extract).not.toHaveBeenCalled()
  })

  it("rejects multiple document sources", async () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(
      t.invoke({ file_url: "https://x/y.pdf", document_id: "doc_1" }),
    ).rejects.toThrow(/only one document source/)
  })

  it("rejects base64 without filename", async () => {
    const { client } = mockClient()
    const t = talonicExtractTool({ client })
    await expect(t.invoke({ file_base64: "aGk=" })).rejects.toThrow(/filename/)
  })
})
