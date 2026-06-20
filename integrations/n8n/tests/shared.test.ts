import { describe, expect, it } from "vitest"
import type { ExtractResult } from "@talonic/node"
import {
  assertValidInput,
  toExtractParams,
  toToolResult,
  type TalonicExtractInput,
} from "../shared"

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
    expect(() =>
      assertValidInput({ file_url: "https://x/y.pdf", document_id: "doc_1" }),
    ).toThrow(/only one document source/)
  })

  it("rejects base64 without filename", () => {
    expect(() => assertValidInput({ file_base64: "aGk=" })).toThrow(/filename/)
  })

  it("rejects inline schema together with schema_id", () => {
    expect(() =>
      assertValidInput({ document_id: "doc_1", schema: { a: "string" }, schema_id: "sch_1" }),
    ).toThrow(/either an inline schema or a schema_id/)
  })
})

describe("toExtractParams", () => {
  it("maps file_url + inline schema", () => {
    const input: TalonicExtractInput = {
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string" },
      instructions: "EUR",
    }
    expect(toExtractParams(input)).toEqual({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string" },
      instructions: "EUR",
    })
  })

  it("parses a JSON-string schema", () => {
    const params = toExtractParams({
      document_id: "doc_1",
      schema: '{"total":"number"}',
    })
    expect(params.schema).toEqual({ total: "number" })
  })

  it("throws on invalid JSON schema string", () => {
    expect(() => toExtractParams({ document_id: "doc_1", schema: "{not json" })).toThrow(
      /valid JSON/,
    )
  })

  it("supports auto-schema (no schema provided)", () => {
    expect(toExtractParams({ document_id: "doc_99" })).toEqual({ document_id: "doc_99" })
  })

  it("decodes base64 into a Uint8Array file", () => {
    const b64 = Buffer.from("hello").toString("base64")
    const params = toExtractParams({ file_base64: b64, filename: "note.txt" })
    expect(params.filename).toBe("note.txt")
    expect(Buffer.from(params.file as Uint8Array).toString()).toBe("hello")
  })

  it("maps schema_id when no inline schema", () => {
    expect(toExtractParams({ document_id: "doc_1", schema_id: "sch_42" })).toEqual({
      document_id: "doc_1",
      schema_id: "sch_42",
    })
  })
})

describe("toToolResult", () => {
  it("trims a full ExtractResult to the shared shape", () => {
    const result = {
      extraction_id: "ext_123",
      status: "completed",
      document: {
        id: "doc_1",
        filename: "invoice.pdf",
        type_detected: "invoice",
        language_detected: "en",
        pages: 2,
        size_bytes: 1234,
        mime_type: "application/pdf",
      },
      data: { vendor_name: "ACME", total_amount: 42 },
      schema: { source: "auto", definition: { vendor_name: "string", total_amount: "number" } },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99, total_amount: 0.95 } },
    } as ExtractResult

    expect(toToolResult(result)).toEqual({
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

  it("returns null schema when none discovered", () => {
    const result = {
      extraction_id: "ext_1",
      status: "completed",
      document: { id: "doc_1", filename: "a.pdf" },
      data: {},
    } as ExtractResult
    expect(toToolResult(result).schema).toBeNull()
  })
})
