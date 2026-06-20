// Talonic Zapier integration.
//
// A Zapier Platform CLI app (zapier-platform-core) exposing one
// "Extract Document" action ("create") that maps onto Talonic's
// POST /v1/extract via the official @talonic/node SDK (never raw HTTP).
//
// Auth is a custom API-key auth. The auth test hits GET /v1/credits via
// the Zapier request layer so connection setup can verify the key cheaply.

const { Talonic } = require("@talonic/node")
const { assertValidInput, toExtractParams, toToolResult } = require("./extract")

const authentication = {
  type: "custom",
  fields: [
    {
      key: "apiKey",
      label: "API Key",
      required: true,
      type: "password",
      helpText:
        "Your Talonic API key (starts with tlnc_). Get one at https://app.talonic.com.",
    },
  ],
  // A cheap call to confirm the key works during connection setup.
  test: {
    url: "https://api.talonic.com/v1/credits",
  },
  connectionLabel: "Talonic ({{bundle.authData.apiKey}})",
}

// Attach the Bearer header to the auth-test request (the only raw request
// this app makes; the Extract action goes through the SDK below).
const addBearer = (request, z, bundle) => {
  request.headers = request.headers || {}
  request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`
  return request
}

const performExtract = async (z, bundle) => {
  const input = {
    file_url: bundle.inputData.file_url || bundle.inputData.file || undefined,
    document_id: bundle.inputData.document_id || undefined,
    file_base64: bundle.inputData.file_base64 || undefined,
    filename: bundle.inputData.filename || undefined,
    schema: bundle.inputData.schema || undefined,
    schema_id: bundle.inputData.schema_id || undefined,
    instructions: bundle.inputData.instructions || undefined,
  }

  assertValidInput(input)

  const client = new Talonic({ apiKey: bundle.authData.apiKey })
  const result = await client.extract(toExtractParams(input))
  return toToolResult(result)
}

const extractDocument = {
  key: "extract_document",
  noun: "Document",
  display: {
    label: "Extract Structured Data",
    description:
      "Turn a document into schema-validated JSON with Talonic, with per-field confidence scores.",
  },
  operation: {
    inputFields: [
      {
        key: "file",
        label: "File",
        type: "file",
        helpText:
          "The document to extract. Zapier passes a hydrate URL that the Talonic API fetches.",
      },
      {
        key: "file_url",
        label: "File URL",
        type: "string",
        helpText: "Alternatively, a public or signed URL the Talonic API fetches.",
      },
      {
        key: "document_id",
        label: "Document ID",
        type: "string",
        helpText: "An already-uploaded Talonic document to (re-)extract.",
      },
      {
        key: "file_base64",
        label: "File (base64)",
        type: "string",
        helpText: "Base64-encoded document bytes. Provide Filename alongside this.",
      },
      {
        key: "filename",
        label: "Filename",
        type: "string",
        helpText: "Filename for MIME inference. Required with File (base64).",
      },
      {
        key: "schema",
        label: "Schema (JSON)",
        type: "text",
        helpText:
          'Target schema, e.g. { "total": "number" }. Leave empty to let Talonic auto-discover the fields (auto-schema).',
      },
      {
        key: "schema_id",
        label: "Schema ID",
        type: "string",
        helpText: "A saved Talonic schema ID to apply instead of an inline schema.",
      },
      {
        key: "instructions",
        label: "Instructions",
        type: "string",
        helpText: "Optional natural-language guidance for the extraction.",
      },
    ],
    perform: performExtract,
    sample: {
      extraction_id: "ext_123",
      data: { vendor_name: "ACME", total_amount: 42 },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99, total_amount: 0.95 } },
      schema: { vendor_name: "string", total_amount: "number" },
      document: {
        id: "doc_1",
        filename: "invoice.pdf",
        type_detected: "invoice",
        language_detected: "en",
        pages: 2,
      },
    },
    outputFields: [
      { key: "extraction_id", label: "Extraction ID" },
      { key: "document__id", label: "Document ID" },
      { key: "document__filename", label: "Document Filename" },
      { key: "confidence__overall", label: "Overall Confidence", type: "number" },
    ],
  },
}

module.exports = {
  version: require("../package.json").version,
  platformVersion: require("zapier-platform-core").version,
  authentication,
  beforeRequest: [addBearer],
  creates: { [extractDocument.key]: extractDocument },
}
