import { TalonicError } from "../errors.js"
import type { Transport } from "../transport.js"
import type { Fields } from "./fields.js"
import type { Pagination } from "./pagination.js"

/**
 * Quick UUID detector for "looks like a Talonic field UUID" so we can
 * skip the `/v1/fields?search=` resolution roundtrip when the user
 * already has an id.
 *
 * @internal
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
 * A single filter condition. Provide either `field` (a name, which the
 * SDK resolves to a field ID via `/fields/autocomplete`) or `fieldId`
 * (a Talonic field ID, used as-is).
 *
 * @public
 */
export interface FilterCondition {
  /** Human-readable field name. SDK resolves to fieldId automatically. */
  field?: string
  /** Talonic field ID. Use this if you already have it. */
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
  readonly #fields: Fields

  /** @internal */
  constructor(transport: Transport, fields: Fields) {
    this.#transport = transport
    this.#fields = fields
  }

  /** List all documents with filtering and pagination. */
  async list(params?: ListDocumentsParams): Promise<DocumentList> {
    const result = await this.#transport.request<DocumentList>({
      method: "GET",
      path: "/v1/documents",
      query: params as Record<string, string | number | boolean | undefined> | undefined,
    })
    return result.data
  }

  /** Retrieve a single document with full metadata. */
  async get(id: string): Promise<Document> {
    const result = await this.#transport.request<Document>({
      method: "GET",
      path: `/v1/documents/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /** Get the OCR-converted markdown of a document. */
  async getMarkdown(id: string): Promise<DocumentMarkdown> {
    const result = await this.#transport.request<DocumentMarkdown>({
      method: "GET",
      path: `/v1/documents/${encodeURIComponent(id)}/markdown`,
    })
    return result.data
  }

  /** Re-run extraction on an existing document. */
  async reExtract(id: string): Promise<ReExtractResult> {
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
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.#transport.request<{ deleted: boolean }>({
      method: "DELETE",
      path: `/v1/documents/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /**
   * Filter documents by extracted field values using composable conditions.
   *
   * Conditions accept either `field` (a human-readable name like
   * `"vendor_name"`, which the SDK resolves to a Talonic field UUID via
   * `/v1/fields?search=`) or `fieldId` (a UUID, used as-is). The same
   * applies to `sort.field` / `sort.fieldId`.
   *
   * Production rejects requests that pass field names directly in the
   * `fieldId` slot, so this resolution step is required for ergonomic
   * usage from agents.
   *
   * @example
   * ```ts
   * const result = await talonic.documents.filter({
   *   conditions: [{ field: "vendor_name", operator: "eq", value: "Acme" }],
   *   sort: { field: "invoice_date", direction: "desc" },
   *   limit: 25,
   * })
   * ```
   */
  async filter(params: FilterDocumentsParams): Promise<FilterDocumentsResult> {
    // Promise cache: when two conditions reference the same field name
    // we want exactly one /v1/fields lookup, even though shapeCondition
    // calls run in parallel. Storing the in-flight promise dedupes them.
    const cache = new Map<string, Promise<string>>()

    const conditions = await Promise.all(
      params.conditions.map((c) => this.#shapeCondition(c, cache)),
    )

    let sort: { fieldId: string; direction: "asc" | "desc" } | undefined
    if (params.sort !== undefined) {
      const fieldId = await this.#resolveFieldRef(
        { field: params.sort.field, fieldId: params.sort.fieldId },
        "filter sort",
        cache,
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
   * Shape one filter condition for the wire, resolving a field name to
   * a UUID via `/v1/fields?search=` when needed. Per-call cache avoids
   * duplicate lookups for the same name.
   *
   * @internal
   */
  async #shapeCondition(
    cond: FilterCondition,
    cache: Map<string, Promise<string>>,
  ): Promise<{
    fieldId: string
    operator: FilterOperator
    value?: unknown
    valueTo?: unknown
  }> {
    const fieldId = await this.#resolveFieldRef(cond, "filter condition", cache)
    return {
      fieldId,
      operator: cond.operator,
      ...(cond.value !== undefined ? { value: cond.value } : {}),
      ...(cond.valueTo !== undefined ? { valueTo: cond.valueTo } : {}),
    }
  }

  /**
   * Resolve `{ field?, fieldId? }` into a UUID string suitable for the
   * `fieldId` slot in the wire body.
   *
   * Resolution rules, in order:
   *   1. `fieldId` set: pass through.
   *   2. `field` looks like a UUID: pass through (caller used the wrong
   *      field name but is technically passing an id).
   *   3. `field` is a name: search `/v1/fields?search=<name>`, pick the
   *      result whose `canonical_name` matches exactly, else the top
   *      result. Throw `field_not_found` if nothing matches.
   *
   * @internal
   */
  async #resolveFieldRef(
    ref: { field?: string; fieldId?: string },
    context: string,
    cache: Map<string, Promise<string>>,
  ): Promise<string> {
    if (ref.fieldId) return ref.fieldId
    if (!ref.field) {
      throw new TalonicError({
        code: "missing_field_reference",
        message: `Each ${context} needs either \`field\` (name) or \`fieldId\`.`,
        status: 0,
        retryable: false,
      })
    }
    if (UUID_REGEX.test(ref.field)) return ref.field

    const cached = cache.get(ref.field)
    if (cached) return cached

    const fieldName = ref.field
    const lookup = (async (): Promise<string> => {
      const result = await this.#fields.list({ search: fieldName, limit: 5 })
      const exact = result.data.find((f) => f.canonical_name === fieldName)
      const chosen = exact ?? result.data[0]
      if (!chosen) {
        throw new TalonicError({
          code: "field_not_found",
          message: `No field matches name: ${fieldName}`,
          status: 0,
          retryable: false,
        })
      }
      return chosen.id
    })()

    cache.set(fieldName, lookup)
    return lookup
  }
}
