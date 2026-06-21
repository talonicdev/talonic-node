const { assertValidInput, toExtractParams, toToolResult } = require("../src/extract")

describe("assertValidInput", () => {
  it("accepts exactly one document source", () => {
    expect(() => assertValidInput({ file_url: "https://x/y.pdf" })).not.toThrow()
    expect(() => assertValidInput({ document_id: "doc_1" })).not.toThrow()
    expect(() => assertValidInput({ file_base64: "aGk=", filename: "a.txt" })).not.toThrow()
  })

  it("rejects when no document source is provided", () => {
    expect(() => assertValidInput({})).toThrow(/document source/)
  })

  it("rejects multiple document sources", () => {
    expect(() => assertValidInput({ file_url: "https://x/y.pdf", document_id: "doc_1" })).toThrow(
      /only one document source/,
    )
  })

  it("rejects base64 without filename", () => {
    expect(() => assertValidInput({ file_base64: "aGk=" })).toThrow(/Filename/)
  })

  it("rejects inline schema together with schema_id", () => {
    expect(() =>
      assertValidInput({ document_id: "doc_1", schema: '{"a":"string"}', schema_id: "sch_1" }),
    ).toThrow(/either an inline schema or a schema_id/)
  })
})

describe("toExtractParams", () => {
  it("maps file_url + inline JSON-string schema", () => {
    expect(
      toExtractParams({ file_url: "https://x/y.pdf", schema: '{"total":"number"}' }),
    ).toEqual({ file_url: "https://x/y.pdf", schema: { total: "number" } })
  })

  it("supports auto-schema", () => {
    expect(toExtractParams({ document_id: "doc_99" })).toEqual({ document_id: "doc_99" })
  })

  it("decodes base64 into a Uint8Array file", () => {
    const b64 = Buffer.from("hello").toString("base64")
    const params = toExtractParams({ file_base64: b64, filename: "note.txt" })
    expect(params.filename).toBe("note.txt")
    expect(Buffer.from(params.file).toString()).toBe("hello")
  })

  it("throws on invalid JSON schema", () => {
    expect(() => toExtractParams({ document_id: "d", schema: "{nope" })).toThrow(/valid JSON/)
  })
})

describe("toToolResult", () => {
  it("trims a full ExtractResult", () => {
    const trimmed = toToolResult({
      extraction_id: "ext_123",
      document: { id: "doc_1", filename: "invoice.pdf", type_detected: "invoice", pages: 2, mime_type: "application/pdf" },
      data: { vendor_name: "ACME" },
      schema: { source: "auto", definition: { vendor_name: "string" } },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99 } },
    })
    expect(trimmed).toEqual({
      extraction_id: "ext_123",
      data: { vendor_name: "ACME" },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99 } },
      schema: { vendor_name: "string" },
      document: { id: "doc_1", filename: "invoice.pdf", type_detected: "invoice", language_detected: undefined, pages: 2 },
    })
  })
})
