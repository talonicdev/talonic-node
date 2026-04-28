/**
 * @talonic/node
 *
 * Official Talonic SDK for Node.js and TypeScript. Extract structured,
 * schema-validated data from any document.
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
 * ```
 *
 * @packageDocumentation
 */

export { Talonic } from "./client.js"
export { VERSION } from "./version.js"

export {
  TalonicAuthError,
  TalonicError,
  TalonicNetworkError,
  TalonicNotFoundError,
  TalonicRateLimitError,
  TalonicServerError,
  TalonicTimeoutError,
  TalonicValidationError,
} from "./errors.js"

export type { RateLimitInfo, TalonicConfig } from "./types.js"

export type {
  ExtractOptions,
  ExtractParams,
  ExtractResult,
  SchemaDefinition,
} from "./resources/extract.js"

export { Documents } from "./resources/documents.js"
export type {
  Document,
  DocumentList,
  DocumentMarkdown,
  FilterCondition,
  FilterDocumentHit,
  FilterDocumentsParams,
  FilterDocumentsResult,
  FilterOperator,
  FilterSort,
  ListDocumentsParams,
  ReExtractResult,
} from "./resources/documents.js"

export { Fields } from "./resources/fields.js"
export type { Field, FieldList, ListFieldsParams } from "./resources/fields.js"

export type {
  SearchDocumentHit,
  SearchFieldHit,
  SearchFieldMatch,
  SearchOptions,
  SearchResult,
  SearchSchemaHit,
  SearchSourceHit,
} from "./resources/search.js"

export { Extractions } from "./resources/extractions.js"
export type {
  Extraction,
  ExtractionList,
  ListExtractionsParams,
  PatchExtractionParams,
  PatchExtractionResult,
} from "./resources/extractions.js"

export { Schemas } from "./resources/schemas.js"
export type {
  CreateSchemaParams,
  Schema,
  SchemaList,
  UpdateSchemaParams,
} from "./resources/schemas.js"

export { Jobs } from "./resources/jobs.js"
export type { CreateJobParams, Job, JobList, JobResults, ListJobsParams } from "./resources/jobs.js"

export type { Pagination } from "./resources/pagination.js"
