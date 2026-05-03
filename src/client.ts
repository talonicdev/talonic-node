import { Documents } from "./resources/documents.js"
import { type ExtractParams, type ExtractResult, performExtract } from "./resources/extract.js"
import { Extractions } from "./resources/extractions.js"
import { Fields } from "./resources/fields.js"
import { Jobs } from "./resources/jobs.js"
import { Schemas } from "./resources/schemas.js"
import type { SearchOptions, SearchResult } from "./resources/search.js"
import { Transport } from "./transport.js"
import type { TalonicConfig, WithRateLimit } from "./types.js"

/**
 * The Talonic client. Entry point to every Talonic API operation.
 *
 * @example
 * ```ts
 * import { Talonic } from "@talonic/node"
 *
 * const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })
 *
 * const result = await talonic.extract({
 *   file_path: "./invoice.pdf",
 *   schema: { vendor_name: "string", total_amount: "number" },
 * })
 * console.log(result.data)
 * ```
 *
 * @public
 */
export class Talonic {
  /**
   * Owned transport instance. Endpoint methods on the resource objects
   * call into this directly. Truly private (`#`) so it does not leak
   * into the published `.d.ts`.
   *
   * @internal
   */
  readonly #transport: Transport

  /** Documents resource. List, fetch, re-extract, filter, and delete documents. */
  readonly documents: Documents

  /** Extractions resource. List, fetch, and patch extracted data. */
  readonly extractions: Extractions

  /** Schemas resource. Create, list, update, and delete saved schemas. */
  readonly schemas: Schemas

  /** Jobs resource. Run and monitor asynchronous extraction work. */
  readonly jobs: Jobs

  /** Fields resource. Autocomplete field names from the registry. */
  readonly fields: Fields

  constructor(config: TalonicConfig) {
    this.#transport = new Transport(config)
    this.fields = new Fields(this.#transport)
    this.documents = new Documents(this.#transport)
    this.extractions = new Extractions(this.#transport)
    this.schemas = new Schemas(this.#transport)
    this.jobs = new Jobs(this.#transport)
  }

  /**
   * Extract structured, schema-validated data from a document.
   *
   * Provide exactly one file source (`file`, `file_path`, `file_url`,
   * or `document_id`) and at most one schema source (`schema` or
   * `schema_id`; omit both for auto-discovery).
   *
   * @example
   * ```ts
   * const result = await talonic.extract({
   *   file_path: "./invoice.pdf",
   *   schema: {
   *     vendor_name: "string",
   *     invoice_number: "string",
   *     total_amount: "number",
   *     due_date: "date",
   *   },
   * })
   * ```
   */
  async extract(params: ExtractParams): Promise<WithRateLimit<ExtractResult>> {
    return performExtract(this.#transport, params)
  }

  /**
   * Global omnisearch across documents, fields, sources, and schemas.
   *
   * @example
   * ```ts
   * const result = await talonic.search("indemnification clauses")
   * console.log(result.documents)
   * ```
   */
  async search(query: string, options: SearchOptions = {}): Promise<WithRateLimit<SearchResult>> {
    const result = await this.#transport.request<SearchResult>({
      method: "GET",
      path: "/v1/search",
      query: {
        q: query,
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
      },
    })
    return result.data
  }
}
