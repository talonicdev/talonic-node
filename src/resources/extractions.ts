import type { Transport } from "../transport.js"
import type { Pagination } from "./pagination.js"

/**
 * The result of applying a schema to a document.
 *
 * Different fields are populated depending on whether the extraction
 * is returned in a list (compact) or fetched individually (full).
 * All non-essential fields are optional.
 *
 * @public
 */
export interface Extraction {
  id: string
  document_id: string
  document_filename?: string
  schema_id?: string
  status: string
  /** Compact list responses include a flat `confidence_overall` number. */
  confidence_overall?: number
  /** Full extraction responses include the per-field confidence shape. */
  confidence?: {
    overall: number
    fields: Record<string, number>
  }
  data?: Record<string, unknown>
  metadata?: {
    pages?: number
    language?: string
    document_type?: string
    processing_time_ms?: number
  }
  created_at: string
  links?: Record<string, string>
}

/**
 * Paginated list of extractions.
 *
 * @public
 */
export interface ExtractionList {
  data: Extraction[]
  pagination: Pagination
}

/**
 * Filter and pagination options for listing extractions.
 *
 * @public
 */
export interface ListExtractionsParams {
  document_id?: string
  schema_id?: string
  status?: "complete" | "processing" | "failed"
  page?: number
  per_page?: number
}

/**
 * Body for patching extracted field values.
 *
 * @public
 */
export interface PatchExtractionParams {
  corrections: Array<{
    field: string
    value: unknown
    reason?: string
  }>
  /** Default: `"this_document_only"`. */
  propagate?: "this_document_only" | "all_similar"
}

/**
 * Permissive shape for the patch response, since the API documentation
 * does not lock down the full structure.
 *
 * @public
 */
export interface PatchExtractionResult {
  id?: string
  [key: string]: unknown
}

/**
 * Extractions resource. Accessed via `talonic.extractions`.
 *
 * @public
 */
export class Extractions {
  /** @internal */
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /** List extractions with optional filters. */
  async list(params?: ListExtractionsParams): Promise<ExtractionList> {
    const result = await this.#transport.request<ExtractionList>({
      method: "GET",
      path: "/v1/extractions",
      query: params as Record<string, string | number | boolean | undefined> | undefined,
    })
    return result.data
  }

  /** Get the full extraction result including data, confidence, and metadata. */
  async get(id: string): Promise<Extraction> {
    const result = await this.#transport.request<Extraction>({
      method: "GET",
      path: `/v1/extractions/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /**
   * Get just the extracted data, without metadata. Returns parsed JSON
   * by default, or a CSV string when `{ format: "csv" }` is passed.
   */
  async getData(id: string, options?: { format?: "json" }): Promise<Record<string, unknown>>
  async getData(id: string, options: { format: "csv" }): Promise<string>
  async getData(
    id: string,
    options?: { format?: "json" | "csv" },
  ): Promise<Record<string, unknown> | string> {
    const result = await this.#transport.request<Record<string, unknown> | string>({
      method: "GET",
      path: `/v1/extractions/${encodeURIComponent(id)}/data`,
      query: options as Record<string, string | number | boolean | undefined> | undefined,
    })
    return result.data
  }

  /**
   * Submit corrections for specific fields in an extraction. Corrections
   * are logged and can be propagated to similar extractions.
   */
  async patch(id: string, params: PatchExtractionParams): Promise<PatchExtractionResult> {
    const result = await this.#transport.request<PatchExtractionResult>({
      method: "PATCH",
      path: `/v1/extractions/${encodeURIComponent(id)}/data`,
      body: params,
    })
    return result.data
  }
}
