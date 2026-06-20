/**
 * @talonic/langchain
 *
 * A LangChain (JS/TS) tool that turns any document into schema-validated
 * JSON via Talonic's `POST /v1/extract` endpoint. Add it to a LangChain
 * agent's tool list and the LLM gains a reliable "structure this
 * document" capability with per-field confidence scores.
 *
 * @example
 * ```ts
 * import { ChatOpenAI } from "@langchain/openai"
 * import { createReactAgent } from "langchain"
 * import { Talonic } from "@talonic/node"
 * import { talonicExtractTool } from "@talonic/langchain"
 *
 * const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })
 *
 * const agent = createReactAgent({
 *   llm: new ChatOpenAI({ model: "gpt-4o" }),
 *   tools: [talonicExtractTool({ client: talonic })],
 * })
 * ```
 *
 * @packageDocumentation
 */

import { tool } from "@langchain/core/tools"
import type { Talonic } from "@talonic/node"
import {
  assertValidInput,
  talonicExtractInputSchema,
  toExtractParams,
  type TalonicExtractInput,
} from "./schema.js"

export { talonicExtractInputSchema, type TalonicExtractInput } from "./schema.js"

const DEFAULT_NAME = "talonic_extract_document"

const DEFAULT_DESCRIPTION =
  "Extract structured, schema-validated JSON from a document (PDF, image, " +
  "spreadsheet, Word, email, and more) using Talonic. Use this whenever you " +
  "need to turn an unstructured document into reliable structured data with " +
  "per-field confidence scores. Provide exactly one document source " +
  "(file_url, document_id, or base64 file). Provide a target `schema` to pin " +
  "the output shape, or omit it to let Talonic auto-discover the fields."

/** The trimmed result the tool returns to the model (JSON-serialised). */
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

/** Options for {@link talonicExtractTool}. */
export interface TalonicExtractToolOptions {
  /** A configured `@talonic/node` client. */
  client: Talonic
  /** Override the tool name shown to the model. Defaults to `talonic_extract_document`. */
  name?: string
  /** Override the tool description shown to the model. */
  description?: string
}

/**
 * Build a LangChain `DynamicStructuredTool` that extracts structured data
 * from a document with Talonic. Add the returned tool to your agent's
 * tool list.
 *
 * The tool returns a JSON string (LangChain tool outputs are strings),
 * containing the {@link TalonicExtractToolResult} shape.
 */
export function talonicExtractTool(options: TalonicExtractToolOptions) {
  const { client, name = DEFAULT_NAME, description = DEFAULT_DESCRIPTION } = options

  return tool(
    async (input: TalonicExtractInput): Promise<string> => {
      assertValidInput(input)
      const result = await client.extract(toExtractParams(input))
      const trimmed: TalonicExtractToolResult = {
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
      return JSON.stringify(trimmed)
    },
    {
      name,
      description,
      schema: talonicExtractInputSchema,
    },
  )
}
