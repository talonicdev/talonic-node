/**
 * Shared extract-contract helpers for the Talonic n8n node.
 *
 * These mirror the validation + SDK-param mapping used by the other
 * Talonic framework adapters (`@talonic/ai-sdk`, `@talonic/langchain`)
 * so an agent learns Talonic once and reuses it everywhere.
 *
 * The functions are framework-agnostic and unit-testable without n8n.
 */
import type { ExtractParams, ExtractResult } from "@talonic/node"

/**
 * Flat input shape shared across every Talonic adapter. Provide exactly
 * one document source; schema is optional (omit for auto-discovery).
 */
export interface TalonicExtractInput {
  file_url?: string
  document_id?: string
  /** Base64-encoded document bytes. Requires `filename`. */
  file_base64?: string
  /** Filename for MIME inference. Required with `file_base64`. */
  filename?: string
  /** Inline target schema (object or JSON string). Mutually exclusive with `schema_id`. */
  schema?: Record<string, unknown> | string
  /** Saved-schema ID. Mutually exclusive with `schema`. */
  schema_id?: string
  /** Natural-language extraction guidance. */
  instructions?: string
}

/** Trimmed result returned by the node, identical in shape across adapters. */
export interface TalonicExtractToolResult {
  extraction_id: string
  data: Record<string, unknown>
  confidence?: {
    overall: number
    fields: Record<string, number>
  }
  schema?: Record<string, unknown> | null
  document: {
    id: string
    filename: string
    type_detected?: string
    language_detected?: string
    pages?: number
  }
}

/**
 * Validate that exactly one document source was supplied, with
 * human/LLM-readable error messages. Throws a plain `Error`.
 */
export function assertValidInput(input: TalonicExtractInput): void {
  const sources = [input.file_url, input.document_id, input.file_base64].filter(
    (v) => v !== undefined && v !== "",
  )
  if (sources.length === 0) {
    throw new Error("Provide exactly one document source: file_url, document_id, or file_base64.")
  }
  if (sources.length > 1) {
    throw new Error(
      "Provide only one document source (file_url, document_id, or file_base64), not several.",
    )
  }
  if ((input.file_base64 ?? "") !== "" && (input.filename ?? "") === "") {
    throw new Error(
      "When using file_base64, also provide filename so the MIME type can be inferred.",
    )
  }
  if (input.schema !== undefined && input.schema !== "" && (input.schema_id ?? "") !== "") {
    throw new Error("Provide either an inline schema or a schema_id, not both.")
  }
}

/** Map the flat tool input into the SDK's `ExtractParams`. */
export function toExtractParams(input: TalonicExtractInput): ExtractParams {
  const params: ExtractParams = {}

  if (input.file_url !== undefined && input.file_url !== "") {
    params.file_url = input.file_url
  } else if (input.document_id !== undefined && input.document_id !== "") {
    params.document_id = input.document_id
  } else if (input.file_base64 !== undefined && input.file_base64 !== "") {
    params.file = base64ToBytes(input.file_base64)
    params.filename = input.filename
  }

  if (input.schema !== undefined && input.schema !== "") {
    params.schema = typeof input.schema === "string" ? parseSchema(input.schema) : input.schema
  } else if (input.schema_id !== undefined && input.schema_id !== "") {
    params.schema_id = input.schema_id
  }

  if (input.instructions !== undefined && input.instructions !== "") {
    params.instructions = input.instructions
  }

  return params
}

/** Trim a full SDK `ExtractResult` into the shared output shape. */
export function toToolResult(result: ExtractResult): TalonicExtractToolResult {
  return {
    extraction_id: result.extraction_id,
    data: result.data,
    confidence: result.confidence,
    schema: result.schema?.definition ?? null,
    document: {
      id: result.document.id,
      filename: result.document.filename,
      type_detected: result.document.type_detected,
      language_detected: result.document.language_detected,
      pages: result.document.pages,
    },
  }
}

function parseSchema(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    throw new Error("Schema must be valid JSON. Leave it empty to auto-discover the fields.")
  }
}

function base64ToBytes(b64: string): Uint8Array {
  const comma = b64.indexOf(",")
  const payload = b64.startsWith("data:") && comma !== -1 ? b64.slice(comma + 1) : b64
  return new Uint8Array(Buffer.from(payload, "base64"))
}
