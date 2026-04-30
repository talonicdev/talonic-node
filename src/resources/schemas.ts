import type { Transport } from "../transport.js"
import type { Pagination } from "./pagination.js"

/**
 * A saved schema definition.
 *
 * Mirrors the production API response shape, including the schema
 * `version` and the `links` object pointing at related resources.
 *
 * @public
 */
export interface Schema {
  /** Canonical UUID identifier. */
  id: string
  /**
   * Short, human-readable identifier (e.g. `"SCH-3A4D79D2"`). Visible
   * in the Talonic dashboard. Both `id` and `short_id` are accepted as
   * lookup keys on `/v1/schemas/:id`.
   */
  short_id?: string
  name: string
  description?: string
  field_count?: number
  extraction_count?: number
  /** Schema version. Bumped each time the definition is updated. */
  version?: number
  /** Present on list responses and on individual fetches. */
  definition?: Record<string, unknown>
  /** Optional because list responses do not always include it. */
  created_at?: string
  updated_at?: string
  /** Convenience URLs returned by the API. */
  links?: {
    self?: string
    extractions?: string
    dashboard?: string
  }
}

/**
 * Paginated list of saved schemas.
 *
 * @public
 */
export interface SchemaList {
  data: Schema[]
  pagination?: Pagination
}

/**
 * Body for creating a new schema.
 *
 * @public
 */
export interface CreateSchemaParams {
  name: string
  definition: Record<string, unknown>
  description?: string
}

/**
 * Body for updating an existing schema. Replaces the schema definition;
 * a new internal version is created so existing extractions retain
 * their original schema version.
 *
 * @public
 */
export interface UpdateSchemaParams {
  name?: string
  definition?: Record<string, unknown>
  description?: string
}

/**
 * Schemas resource. Accessed via `talonic.schemas`.
 *
 * @public
 */
export class Schemas {
  /** @internal */
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /** List all saved schemas. */
  async list(): Promise<SchemaList> {
    const result = await this.#transport.request<SchemaList>({
      method: "GET",
      path: "/v1/schemas",
    })
    return result.data
  }

  /** Get a schema by ID, including its full definition. */
  async get(id: string): Promise<Schema> {
    const result = await this.#transport.request<Schema>({
      method: "GET",
      path: `/v1/schemas/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /** Create a new schema. */
  async create(params: CreateSchemaParams): Promise<Schema> {
    const result = await this.#transport.request<Schema>({
      method: "POST",
      path: "/v1/schemas",
      body: params,
    })
    return result.data
  }

  /** Replace a schema definition. */
  async update(id: string, params: UpdateSchemaParams): Promise<Schema> {
    const result = await this.#transport.request<Schema>({
      method: "PUT",
      path: `/v1/schemas/${encodeURIComponent(id)}`,
      body: params,
    })
    return result.data
  }

  /** Delete a schema. Existing extractions are retained. */
  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.#transport.request<{ deleted: boolean }>({
      method: "DELETE",
      path: `/v1/schemas/${encodeURIComponent(id)}`,
    })
    return result.data
  }
}
