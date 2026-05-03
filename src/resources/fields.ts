import type { Transport } from "../transport.js"
import type { WithRateLimit } from "../types.js"
import type { Pagination } from "./pagination.js"

/**
 * A field discovered by the Talonic field registry.
 *
 * Mirrors the production `/v1/fields` response shape (snake_case
 * throughout) per the official OpenAPI spec.
 *
 * @public
 */
export interface Field {
  id: string
  canonical_name: string
  display_name?: string | null
  data_type: string
  tier?: number
  cluster_name?: string | null
  occurrence_count?: number
  master_instruction?: string | null
  created_at?: string
  updated_at?: string
  links?: {
    self?: string
    similar?: string
  }
}

/**
 * Paginated list of fields.
 *
 * @public
 */
export interface FieldList {
  data: Field[]
  pagination?: Pagination
}

/**
 * Filter, search, and pagination options for `talonic.fields.list()`.
 *
 * @public
 */
export interface ListFieldsParams {
  /** Case-insensitive search on canonical_name or display_name. */
  search?: string
  /** Filter by tier. */
  tier?: number
  /** Filter by cluster id (UUID). */
  cluster_id?: string
  /** Page size. */
  limit?: number
  /** Cursor for the next page. */
  cursor?: string
  /** Sort order. */
  order?: string
}

/**
 * Fields resource. Exposes the Talonic field registry: every field
 * discovered across the user's documents, with semantic clusters and
 * occurrence counts.
 *
 * Accessed via `talonic.fields`.
 *
 * @public
 */
export class Fields {
  /** @internal */
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /**
   * List fields, optionally filtered by name (`search`), tier, or cluster.
   *
   * @example
   * ```ts
   * const result = await talonic.fields.list({ search: "vendor" })
   * for (const field of result.data) {
   *   console.log(field.canonical_name, field.id)
   * }
   * ```
   */
  async list(params: ListFieldsParams = {}): Promise<WithRateLimit<FieldList>> {
    const result = await this.#transport.request<FieldList>({
      method: "GET",
      path: "/v1/fields",
      query: {
        ...(params.search !== undefined ? { search: params.search } : {}),
        ...(params.tier !== undefined ? { tier: params.tier } : {}),
        ...(params.cluster_id !== undefined ? { cluster_id: params.cluster_id } : {}),
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
        ...(params.cursor !== undefined ? { cursor: params.cursor } : {}),
        ...(params.order !== undefined ? { order: params.order } : {}),
      },
    })
    return result.data
  }

  /** Get a single field by id, including occurrence history and metadata. */
  async get(id: string): Promise<WithRateLimit<Field>> {
    const result = await this.#transport.request<Field>({
      method: "GET",
      path: `/v1/fields/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /** Find semantically similar fields by embedding distance. */
  async similar(id: string): Promise<WithRateLimit<{ data: Array<Field & { similarity?: number }> }>> {
    const result = await this.#transport.request<{
      data: Array<Field & { similarity?: number }>
    }>({
      method: "GET",
      path: `/v1/fields/${encodeURIComponent(id)}/similar`,
    })
    return result.data
  }
}
