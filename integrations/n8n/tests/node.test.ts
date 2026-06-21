import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the SDK so no live key is needed. The mock captures the params
// passed to client.extract and returns a canned ExtractResult.
const extractMock = vi.fn()
vi.mock("@talonic/node", () => ({
  Talonic: class {
    extract = extractMock
  },
}))

import { TalonicNode } from "../nodes/Talonic/Talonic.node"

function cannedResult() {
  return {
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
    confidence: { overall: 0.97, fields: { vendor_name: 0.99 } },
  }
}

/** Build a minimal IExecuteFunctions stand-in for a single item. */
function fakeExecuteContext(params: Record<string, unknown>, binary?: Buffer) {
  return {
    getInputData: () => [{ json: {} }],
    getCredentials: vi.fn(async () => ({ apiKey: "tlnc_test" })),
    getNodeParameter: (name: string, _i: number, fallback?: unknown) =>
      name in params ? params[name] : fallback,
    continueOnFail: () => false,
    getNode: () => ({ name: "Talonic" }),
    helpers: {
      assertBinaryData: () => ({ fileName: "note.txt" }),
      getBinaryDataBuffer: async () => binary ?? Buffer.from(""),
    },
  } as never
}

describe("Talonic n8n node execute()", () => {
  beforeEach(() => {
    extractMock.mockReset()
    extractMock.mockResolvedValue(cannedResult())
  })

  it("maps file_url + schema to the SDK and returns trimmed output", async () => {
    const ctx = fakeExecuteContext({
      documentSource: "file_url",
      fileUrl: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string" },
      schemaId: "",
      instructions: "",
    })

    const out = await TalonicNode.prototype.execute.call(ctx)

    expect(extractMock).toHaveBeenCalledWith({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string" },
    })
    expect(out[0]![0]!.json).toMatchObject({
      extraction_id: "ext_123",
      data: { vendor_name: "ACME", total_amount: 42 },
      schema: { vendor_name: "string", total_amount: "number" },
    })
  })

  it("supports auto-schema (empty schema string)", async () => {
    const ctx = fakeExecuteContext({
      documentSource: "document_id",
      documentId: "doc_99",
      schema: "",
      schemaId: "",
      instructions: "",
    })
    await TalonicNode.prototype.execute.call(ctx)
    expect(extractMock).toHaveBeenCalledWith({ document_id: "doc_99" })
  })

  it("uploads binary as base64 file", async () => {
    const ctx = fakeExecuteContext(
      {
        documentSource: "binary",
        binaryPropertyName: "data",
        schema: "",
        schemaId: "",
        instructions: "",
      },
      Buffer.from("hello"),
    )
    await TalonicNode.prototype.execute.call(ctx)
    const call = extractMock.mock.calls[0]![0] as { file: Uint8Array; filename: string }
    expect(call.filename).toBe("note.txt")
    expect(Buffer.from(call.file).toString()).toBe("hello")
  })

  it("throws when no document source value is provided", async () => {
    const ctx = fakeExecuteContext({
      documentSource: "file_url",
      fileUrl: "",
      schema: "",
      schemaId: "",
      instructions: "",
    })
    await expect(TalonicNode.prototype.execute.call(ctx)).rejects.toThrow(/document source/)
    expect(extractMock).not.toHaveBeenCalled()
  })
})
