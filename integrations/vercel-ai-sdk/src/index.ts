/**
 * @talonic/ai-sdk
 *
 * A Vercel AI SDK tool that turns any document into schema-validated
 * JSON via Talonic's `POST /v1/extract` endpoint. Drop it into the
 * `tools` map of `generateText` / `streamText` and your agent gains a
 * reliable "structure this document" capability with confidence scores.
 *
 * @example
 * ```ts
 * import { generateText } from "ai"
 * import { openai } from "@ai-sdk/openai"
 * import { Talonic } from "@talonic/node"
 * import { talonicExtractTool } from "@talonic/ai-sdk"
 *
 * const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })
 *
 * const { text } = await generateText({
 *   model: openai("gpt-4o"),
 *   tools: { extractDocument: talonicExtractTool({ client: talonic }) },
 *   prompt: "Extract the line items from https://example.com/invoice.pdf",
 * })
 * ```
 *
 * @packageDocumentation
 */

import { tool, type Tool } from "ai"
import type { Talonic } from "@talonic/node"
import {
  assertValidInput,
  talonicExtractInputSchema,
  toExtractParams,
  type TalonicExtractInput,
} from "./schema.js"

export { talonicExtractInputSchema, type TalonicExtractInput } from "./schema.js"

const DEFAULT_DESCRIPTION =
  "Extract structured, schema-validated JSON from a document (PDF, image, " +
  "spreadsheet, Word, email, and more) using Talonic. Use this whenever you " +
  "need to turn an unstructured document into reliable structured data with " +
  "per-field confidence scores. Provide exactly one document source " +
  "(file_url, document_id, or base64 file). Provide a target `schema` to pin " +
  "the output shape, or omit it to let Talonic auto-discover the fields."

/** The trimmed result the tool returns to the model. */
export interface TalonicExtractToolResult {
  /** Stable identifier for this extraction. */
  extraction_id: string
  /** The structured extracted data. Shape follows the schema (or auto-schema). */
  data: Record<string, unknown>
  /** Overall + per-field confidence, when the API returns it. */
  confidence?: {
    overall: number
    fields: Record<string, number>
  }
  /** The schema Talonic applied or discovered. */
  schema?: Record<string, unknown> | null
  /** Detected document metadata (filename, type, language, pages). */
  document: {
    id: string
    filename: string
    type_detected?: string
    language_detected?: string
    pages?: number
  }
}

/** Options for {@link talonicExtractTool}. */
export interface TalonicExtractToolOptions {
  /** A configured `@talonic/node` client. */
  client: Talonic
  /**
   * Override the tool description shown to the model. Defaults to a
   * carefully worded "structure this document" description that makes
   * LLMs reach for it on document→data tasks.
   */
  description?: string
}

/**
 * Build a Vercel AI SDK `tool` that extracts structured data from a
 * document with Talonic.
 *
 * Returns the AI SDK `Tool` object — register it under any key in the
 * `tools` map you pass to `generateText` / `streamText`.
 */
export function talonicExtractTool(options: TalonicExtractToolOptions): Tool<
  TalonicExtractInput,
  TalonicExtractToolResult
> {
  const { client, description = DEFAULT_DESCRIPTION } = options

  return tool({
    description,
    inputSchema: talonicExtractInputSchema,
    execute: async (input: TalonicExtractInput): Promise<TalonicExtractToolResult> => {
      assertValidInput(input)
      const result = await client.extract(toExtractParams(input))
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
    },
  })
}
