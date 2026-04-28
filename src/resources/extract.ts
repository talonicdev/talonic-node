import { readFile } from "node:fs/promises"
import { basename } from "node:path"
import { TalonicError } from "../errors.js"
import type { Transport } from "../transport.js"

/**
 * Schema definition for extraction. Accepts any of the three formats
 * the Talonic API supports (JSON Schema, simplified fields, or flat
 * key-type map). Refer to the API documentation for details.
 *
 * @public
 */
export type SchemaDefinition = Record<string, unknown>

/**
 * Extra options for the extract method, forwarded to the API as the
 * `options` form field.
 *
 * @public
 */
export interface ExtractOptions {
  /** Output format. Default: `"json"`. */
  format?: "json"
  /** When true (default), fields not in the schema are omitted. */
  strict?: boolean
  /** Include the raw extracted text alongside structured data. */
  include_raw_text?: boolean
  /** Pages to extract from, e.g. `"1-5"`, `"1,3,7-10"`. PDF only. */
  page_range?: string
  /** ISO 639-1 language code hint. */
  language_hint?: string
}

/**
 * Parameters for the `extract` method.
 *
 * Provide exactly one file source: `file` (in-memory binary),
 * `file_path` (read from disk), `file_url` (remote URL fetched by the
 * server), or `document_id` (re-extract an existing document).
 *
 * Provide at most one schema source: `schema` (inline) or `schema_id`
 * (reference a saved schema). Omit both for auto-discovery.
 *
 * @public
 */
export interface ExtractParams {
  /** Binary file contents. Accepts Blob, Buffer, or Uint8Array. */
  file?: Blob | Uint8Array
  /** Filename used in the multipart upload when `file` is provided. */
  filename?: string
  /**
   * Override the MIME type sent with the multipart upload. When omitted,
   * the SDK infers it from the filename extension. Set explicitly if the
   * filename is misleading or absent.
   */
  content_type?: string
  /** Path to a file on disk. Read with `fs/promises`. Node only. */
  file_path?: string
  /** URL to fetch the document from. */
  file_url?: string
  /** ID of an existing document to re-extract. */
  document_id?: string

  /** Inline schema definition. */
  schema?: SchemaDefinition | string
  /** ID of a saved schema. */
  schema_id?: string

  /** Natural-language extraction guidance. */
  instructions?: string
  /** When true, the response includes the OCR-converted markdown. */
  include_markdown?: boolean
  /** Additional extraction options forwarded to the API. */
  options?: ExtractOptions
}

/**
 * Result of a successful extraction. Mirrors the production API response
 * shape exactly, including its nested `document`, `schema`, `processing`,
 * and `links` objects.
 *
 * @public
 */
export interface ExtractResult {
  /** Stable identifier for this extraction. */
  extraction_id: string
  /** Server-assigned request ID for support and debugging. */
  request_id?: string
  status: string
  document: {
    id: string
    filename: string
    pages?: number
    size_bytes?: number
    mime_type?: string
    type_detected?: string
    language_detected?: string
  }
  /** The structured extracted data. Shape depends on the schema. */
  data: Record<string, unknown>
  schema?: {
    source?: string
    id?: string | null
    definition?: Record<string, unknown>
    save_url?: string
  }
  confidence?: {
    overall: number
    fields: Record<string, number>
  }
  processing?: {
    duration_ms?: number
    pages_processed?: number
    region?: string
  }
  links?: {
    self?: string
    document?: string
    dashboard?: string
  }
  /** Present when `include_markdown: true` was set. */
  markdown?: string
}

/**
 * Implementation of the extract method. Lives outside the client so the
 * client class file stays small and focused on composition.
 *
 * @internal
 */
export async function performExtract(
  transport: Transport,
  params: ExtractParams,
): Promise<ExtractResult> {
  validateExtractParams(params)
  const formData = await buildExtractFormData(params)
  const result = await transport.request<ExtractResult>({
    method: "POST",
    path: "/v1/extract",
    body: formData,
  })
  return result.data
}

function validateExtractParams(params: ExtractParams): void {
  const sources = ["file", "file_path", "file_url", "document_id"] as const
  const provided = sources.filter((k) => params[k] !== undefined)

  if (provided.length === 0) {
    throw new TalonicError({
      code: "missing_file_source",
      message:
        "extract requires a file source: provide one of file, file_path, file_url, or document_id",
      status: 0,
      retryable: false,
    })
  }
  if (provided.length > 1) {
    throw new TalonicError({
      code: "multiple_file_sources",
      message: `extract accepts exactly one file source; received: ${provided.join(", ")}`,
      status: 0,
      retryable: false,
    })
  }
  if (params.schema !== undefined && params.schema_id !== undefined) {
    throw new TalonicError({
      code: "multiple_schemas",
      message: "extract accepts schema OR schema_id, not both",
      status: 0,
      retryable: false,
    })
  }
}

async function buildExtractFormData(params: ExtractParams): Promise<FormData> {
  const fd = new FormData()

  if (params.file !== undefined) {
    const filename = params.filename ?? "file"
    const blob = toBlobWithType(params.file, filename, params.content_type)
    fd.append("file", blob, filename)
  } else if (params.file_path !== undefined) {
    const buffer = await readFile(params.file_path)
    const filename = basename(params.file_path)
    const type = params.content_type ?? inferMimeType(filename)
    fd.append("file", new Blob([new Uint8Array(buffer)], { type }), filename)
  } else if (params.file_url !== undefined) {
    fd.append("file_url", params.file_url)
  } else if (params.document_id !== undefined) {
    fd.append("document_id", params.document_id)
  }

  if (params.schema !== undefined) {
    const value = typeof params.schema === "string" ? params.schema : JSON.stringify(params.schema)
    fd.append("schema", value)
  } else if (params.schema_id !== undefined) {
    fd.append("schema_id", params.schema_id)
  }

  if (params.instructions !== undefined) fd.append("instructions", params.instructions)
  if (params.include_markdown) fd.append("include_markdown", "true")
  if (params.options !== undefined) fd.append("options", JSON.stringify(params.options))

  return fd
}

function toBlobWithType(
  input: Blob | Uint8Array,
  filename: string,
  override: string | undefined,
): Blob {
  if (override) {
    return new Blob([input], { type: override })
  }
  if (input instanceof Blob) {
    if (input.type) return input
    return new Blob([input], { type: inferMimeType(filename) })
  }
  return new Blob([input], { type: inferMimeType(filename) })
}

/**
 * Map a filename extension to a MIME type. Covers every format Talonic
 * accepts plus a few common adjacent ones (XLSX, BMP, GIF, etc.) so the
 * platform side can route by content type rather than rejecting based
 * on `application/octet-stream`.
 *
 * @internal
 */
const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  tif: "image/tiff",
  tiff: "image/tiff",
  webp: "image/webp",
  bmp: "image/bmp",
  gif: "image/gif",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
  htm: "text/html",
  eml: "message/rfc822",
  msg: "application/vnd.ms-outlook",
  zip: "application/zip",
}

/**
 * Infer a MIME type from a filename. Returns `application/octet-stream`
 * if the extension is unknown; callers can override via `content_type`
 * on `ExtractParams`.
 *
 * @internal
 */
function inferMimeType(filename: string): string {
  const dot = filename.lastIndexOf(".")
  if (dot === -1 || dot === filename.length - 1) return "application/octet-stream"
  const ext = filename.slice(dot + 1).toLowerCase()
  return MIME_TYPES[ext] ?? "application/octet-stream"
}
