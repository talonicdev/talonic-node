// Shared extract-contract helpers for the Talonic Zapier app.
//
// Mirrors the validation + SDK-param mapping used by the other Talonic
// adapters so the behaviour is identical everywhere. Framework-agnostic
// and unit-testable without Zapier.

/**
 * Validate that exactly one document source was supplied, with readable
 * error messages. Throws a plain Error.
 * @param {object} input
 */
function assertValidInput(input) {
  const sources = [input.file_url, input.document_id, input.file_base64].filter(
    (v) => v !== undefined && v !== "",
  )
  if (sources.length === 0) {
    throw new Error("Provide exactly one document source: a File, File URL, Document ID, or base64 file.")
  }
  if (sources.length > 1) {
    throw new Error("Provide only one document source (file, file_url, document_id, or file_base64), not several.")
  }
  if ((input.file_base64 || "") !== "" && (input.filename || "") === "") {
    throw new Error("When using File (base64), also provide Filename so the MIME type can be inferred.")
  }
  if ((input.schema || "") !== "" && (input.schema_id || "") !== "") {
    throw new Error("Provide either an inline schema or a schema_id, not both.")
  }
}

/**
 * Map the flat input into @talonic/node ExtractParams.
 * @param {object} input
 */
function toExtractParams(input) {
  const params = {}

  if (input.file_url) {
    params.file_url = input.file_url
  } else if (input.document_id) {
    params.document_id = input.document_id
  } else if (input.file_base64) {
    params.file = base64ToBytes(input.file_base64)
    params.filename = input.filename
  }

  if (input.schema) {
    params.schema = typeof input.schema === "string" ? parseSchema(input.schema) : input.schema
  } else if (input.schema_id) {
    params.schema_id = input.schema_id
  }

  if (input.instructions) {
    params.instructions = input.instructions
  }

  return params
}

/**
 * Trim a full SDK ExtractResult into the shared output shape.
 * @param {object} result
 */
function toToolResult(result) {
  return {
    extraction_id: result.extraction_id,
    data: result.data,
    confidence: result.confidence,
    schema: (result.schema && result.schema.definition) || null,
    document: {
      id: result.document.id,
      filename: result.document.filename,
      type_detected: result.document.type_detected,
      language_detected: result.document.language_detected,
      pages: result.document.pages,
    },
  }
}

function parseSchema(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error("Schema must be valid JSON. Leave it empty to auto-discover the fields.")
  }
}

function base64ToBytes(b64) {
  const comma = b64.indexOf(",")
  const payload = b64.startsWith("data:") && comma !== -1 ? b64.slice(comma + 1) : b64
  return new Uint8Array(Buffer.from(payload, "base64"))
}

module.exports = { assertValidInput, toExtractParams, toToolResult }
