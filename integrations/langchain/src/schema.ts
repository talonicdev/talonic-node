import { z } from "zod"
import type { ExtractParams } from "@talonic/node"

/**
 * Zod input schema for the Talonic extract tool, shared shape with the
 * other Talonic framework adapters.
 *
 * Exactly one document source must be provided (`file_url`,
 * `document_id`, or `file_base64` + `filename`). Schema is optional:
 * provide `schema` / `schema_id` to pin the output, or omit both for
 * auto-discovery (auto-schema).
 */
export const talonicExtractInputSchema = z.object({
  file_url: z
    .string()
    .url()
    .optional()
    .describe("Public or signed URL of the document to extract. The Talonic API fetches it."),
  document_id: z
    .string()
    .optional()
    .describe("ID of a document already uploaded to Talonic, to (re-)extract."),
  file_base64: z
    .string()
    .optional()
    .describe("Base64-encoded document bytes. Provide `filename` alongside this."),
  filename: z
    .string()
    .optional()
    .describe("Filename for the document, used to infer the MIME type. Required with `file_base64`."),

  schema: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Optional target schema describing the fields to extract, e.g. " +
        '{ "vendor_name": "string", "total_amount": "number", "due_date": "date" }. ' +
        "Omit to let Talonic auto-discover the structure (auto-schema).",
    ),
  schema_id: z
    .string()
    .optional()
    .describe("Optional ID of a saved Talonic schema to apply instead of an inline `schema`."),

  instructions: z
    .string()
    .optional()
    .describe('Optional natural-language guidance for the extraction, e.g. "amounts are in EUR".'),
})

/** Inferred input type for the Talonic extract tool. */
export type TalonicExtractInput = z.infer<typeof talonicExtractInputSchema>

/**
 * Validate that exactly one document source was supplied. Throws a plain
 * `Error` with an LLM-readable message so the agent can self-correct.
 */
export function assertValidInput(input: TalonicExtractInput): void {
  const sources = [input.file_url, input.document_id, input.file_base64].filter(
    (v) => v !== undefined,
  )
  if (sources.length === 0) {
    throw new Error("Provide exactly one document source: file_url, document_id, or file_base64.")
  }
  if (sources.length > 1) {
    throw new Error(
      "Provide only one document source (file_url, document_id, or file_base64), not several.",
    )
  }
  if (input.file_base64 !== undefined && input.filename === undefined) {
    throw new Error("When using file_base64, also provide filename so the MIME type can be inferred.")
  }
  if (input.schema !== undefined && input.schema_id !== undefined) {
    throw new Error("Provide either an inline schema or a schema_id, not both.")
  }
}

/** Map the tool input into the SDK's `ExtractParams`. */
export function toExtractParams(input: TalonicExtractInput): ExtractParams {
  const params: ExtractParams = {}

  if (input.file_url !== undefined) {
    params.file_url = input.file_url
  } else if (input.document_id !== undefined) {
    params.document_id = input.document_id
  } else if (input.file_base64 !== undefined) {
    params.file = base64ToBytes(input.file_base64)
    params.filename = input.filename
  }

  if (input.schema !== undefined) {
    params.schema = input.schema
  } else if (input.schema_id !== undefined) {
    params.schema_id = input.schema_id
  }

  if (input.instructions !== undefined) {
    params.instructions = input.instructions
  }

  return params
}

function base64ToBytes(b64: string): Uint8Array {
  const comma = b64.indexOf(",")
  const payload = b64.startsWith("data:") && comma !== -1 ? b64.slice(comma + 1) : b64
  return new Uint8Array(Buffer.from(payload, "base64"))
}
