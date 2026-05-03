import { TalonicError } from "../errors.js"
import type { Transport } from "../transport.js"
import type { WithRateLimit } from "../types.js"
import type { Pagination } from "./pagination.js"

/**
 * A document uploaded to Talonic.
 *
 * Mirrors the production API response shape. Many fields are optional
 * because the API includes more detail on single-document fetches than
 * on list pages, and because document metadata grows over time as the
 * processing pipeline completes.
 *
 * @public
 */
export interface Document {
  id: string
  filename: string
  status: string
  pages?: number
  size_bytes?: number
  mime_type?: string
  /** Detected document type (e.g. "Certificate of Insurance"). */
  type_detected?: string
  /** Detected language code (e.g. "en"). */
  language_detected?: string
  source?: {
    id: string
    type?: string
  }
  triage?: Record<string, unknown>
  original_path?: string | null
  extraction_count?: number
  latest_extraction_id?: string
  processing_log?: Array<{
    step: string
    status: string
    detail?: string
    started_at?: string
    completed_at?: string
    duration_ms?: number
  }>
  created_at: string
  updated_at?: string
  links?: Record<string, string>
}

/**
 * Paginated list of documents.
 *
 * @public
 */
export interface DocumentList {
  data: Document[]
  pagination: Pagination
}

/**
 * Filter and pagination options for listing documents.
 *
 * The API uses cursor-based pagination: pass `limit` to set page size,
 * and pass the `next_cursor` from a previous response as `cursor` to
 * fetch the next page. Legacy `page` / `per_page` are accepted as
 * aliases for compatibility but cursor-based is the canonical form.
 *
 * @public
 */
export interface ListDocumentsParams {
  source_id?: string
  status?: "pending" | "processing" | "completed" | "error"
  /** ISO 8601. Only documents created after this timestamp. */
  after?: string
  /** ISO 8601. Only documents created before this timestamp. */
  before?: string
  /** Full-text search across filename and extracted content. */
  search?: string
  /** Cursor token from a previous response's `pagination.next_cursor`. */
  cursor?: string
  /** Page size. */
  limit?: number
  /** Sort order, e.g. `"created_at:desc"`. */
  order?: string
  /** @deprecated Use `cursor` + `limit` instead. */
  page?: number
  /** @deprecated Use `limit` instead. */
  per_page?: number
}

/**
 * OCR-converted markdown of a document.
 *
 * @public
 */
export interface DocumentMarkdown {
  document_id: string
  markdown: string
}

/**
 * Result of triggering a re-extraction.
 *
 * @public
 */
export interface ReExtractResult {
  id: string
  status: string
  message: string
}

/**
 * A document as returned by the filter endpoint. The shape differs from
 * the list/get response: id is present, plus optional name/filename,
 * sourceId, uploadedAt, and the matched fieldValues.
 *
 * @public
 */
export interface FilterDocumentHit {
  id: string
  name?: string
  filename?: string
  sourceId?: string
  uploadedAt?: string
  fieldValues?: Record<string, unknown>
}

/**
 * Result of `talonic.documents.filter()`.
 *
 * @public
 */
export interface FilterDocumentsResult {
  documents: FilterDocumentHit[]
  total: number
  page?: number
  limit?: number
}

/**
 * Operators supported by the `/filter/documents` endpoint.
 *
 * @public
 */
export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "contains"
  | "is_empty"
  | "is_not_empty"

/**
 * A single filter condition. Provide either `field` (a canonical name
 * like `"vendor.name"` or `"policy.0_coverage_type"`, resolved by the
 * Talonic API server-side) or `fieldId` (a Talonic field UUID, used
 * as-is). The two are interchangeable: the API accepts either form in
 * its `fieldId` slot.
 *
 * @public
 */
export interface FilterCondition {
  /**
   * Canonical field name (e.g. `"vendor.name"`, `"policy.0_term_end"`).
   * The Talonic API resolves names to ids server-side. Mutually
   * exclusive with `fieldId`.
   */
  field?: string
  /**
   * Talonic field UUID. Mutually exclusive with `field`.
   */
  fieldId?: string
  operator: FilterOperator
  value?: unknown
  /** Used by the `between` operator. */
  valueTo?: unknown
}

/**
 * Sort spec. Same field/fieldId rules as conditions.
 *
 * @public
 */
export interface FilterSort {
  field?: string
  fieldId?: string
  direction: "asc" | "desc"
}

/**
 * Body for `talonic.documents.filter()`.
 *
 * @public
 */
export interface FilterDocumentsParams {
  conditions: FilterCondition[]
  /** Free-text search across document content. */
  search?: string
  sort?: FilterSort
  page?: number
  limit?: number
  /** Scope to a specific source connection. */
  source_connection_id?: string
}

/**
 * Documents resource. Accessed via `talonic.documents`.
 *
 * @public
 */
export class Documents {
  /** @internal */
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /** List all documents with filtering and pagination. */
  async list(params?: ListDocumentsParams): Promise<WithRateLimit<DocumentList>> {
    const result = await this.#transport.request<DocumentList>({
      method: "GET",
      path: "/v1/documents",
      query: params as Record<string, string | number | boolean | undefined> | undefined,
    })
    return result.data
  }

  /** Retrieve a single document with full metadata. */
  async get(id: string): Promise<WithRateLimit<Document>> {
    const result = await this.#transport.request<Document>({
      method: "GET",
      path: `/v1/documents/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /** Get the OCR-converted markdown of a document. */
  async getMarkdown(id: string): Promise<WithRateLimit<DocumentMarkdown>> {
    const result = await this.#transport.request<DocumentMarkdown>({
      method: "GET",
      path: `/v1/documents/${encodeURIComponent(id)}/markdown`,
    })
    return result.data
  }

  /** Re-run extraction on an existing document. */
  async reExtract(id: string): Promise<WithRateLimit<ReExtractResult>> {
    const result = await this.#transport.request<ReExtractResult>({
      method: "POST",
      path: `/v1/documents/${encodeURIComponent(id)}/re-extract`,
    })
    return result.data
  }

  /**
   * Delete a document and all associated extractions. This action is
   * irreversible.
   */
  async delete(id: string): Promise<WithRateLimit<{ deleted: boolean }>> {
    const result = await this.#transport.request<{ deleted: boolean }>({
      method: "DELETE",
      path: `/v1/documents/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /**
   * Filter documents by extracted field values using composable conditions.
   *
   * Each condition (and `sort`) accepts either:
   * - `field`: a canonical field name like `"vendor.name"` or
   *   `"policy.0_coverage_type"`. The Talonic API resolves names to ids
   *   server-side.
   * - `fieldId`: a Talonic field UUID, passed through as-is.
   *
   * Both are sent in the wire-level `fieldId` slot; the API accepts
   * either form.
   *
   * @example
   * ```ts
   * const result = await talonic.documents.filter({
   *   conditions: [{ field: "vendor.name", operator: "eq", value: "Acme" }],
   *   sort: { field: "invoice_date", direction: "desc" },
   *   limit: 25,
   * })
   * ```
   */
  async filter(params: FilterDocumentsParams): Promise<WithRateLimit<FilterDocumentsResult>> {
    const conditions = params.conditions.map((c) => this.#shapeCondition(c))

    let sort: { fieldId: string; direction: "asc" | "desc" } | undefined
    if (params.sort !== undefined) {
      const fieldId = this.#resolveFieldRef(
        { field: params.sort.field, fieldId: params.sort.fieldId },
        "filter sort",
      )
      sort = { fieldId, direction: params.sort.direction }
    }

    const body: Record<string, unknown> = { conditions }
    if (params.search !== undefined) body["search"] = params.search
    if (sort !== undefined) body["sort"] = sort
    if (params.page !== undefined) body["page"] = params.page
    if (params.limit !== undefined) body["limit"] = params.limit
    if (params.source_connection_id !== undefined) {
      body["source_id"] = params.source_connection_id
    }

    const result = await this.#transport.request<FilterDocumentsResult>({
      method: "POST",
      path: "/v1/documents/filter",
      body,
    })
    return result.data
  }

  /**
   * Shape one filter condition for the wire. Resolves the
   * `field` / `fieldId` pair into a single `fieldId` string and copies
   * operator/value/valueTo through.
   *
   * @internal
   */
  #shapeCondition(cond: FilterCondition): {
    fieldId: string
    operator: FilterOperator
    value?: unknown
    valueTo?: unknown
  } {
    const fieldId = this.#resolveFieldRef(cond, "filter condition")
    return {
      fieldId,
      operator: cond.operator,
      ...(cond.value !== undefined ? { value: cond.value } : {}),
      ...(cond.valueTo !== undefined ? { valueTo: cond.valueTo } : {}),
    }
  }

  /**
   * Reduce `{ field?, fieldId? }` to a single string for the wire-level
   * `fieldId` slot. Either form is accepted by the API: UUIDs are used
   * directly, canonical names like `"vendor.name"` are resolved
   * server-side.
   *
   * If neither is provided, throws `missing_field_reference` locally.
   * Any other resolution failure (unknown name, malformed id) is
   * surfaced by the API as a `VALIDATION_ERROR` with a meaningful
   * `request_id` and `message`.
   *
   * @internal
   */
  #resolveFieldRef(ref: { field?: string; fieldId?: string }, context: string): string {
    if (ref.fieldId) return ref.fieldId
    if (ref.field) return ref.field
    throw new TalonicError({
      code: "missing_field_reference",
      message: `Each ${context} needs either \`field\` (name) or \`fieldId\`.`,
      status: 0,
      retryable: false,
    })
  }
}
