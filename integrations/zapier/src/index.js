// Talonic Zapier integration — SCAFFOLD. Not deployed. See integrations/PLAN.md.
//
// Built on the Zapier Platform CLI (zapier-platform-core). The app exposes
// one "Extract Document" action ("create") that maps onto POST /v1/extract.
// Auth is a custom API-key auth that sends `Authorization: Bearer tlnc_...`.

const authentication = {
  type: "custom",
  fields: [
    {
      key: "apiKey",
      label: "API Key",
      required: true,
      type: "password",
      helpText: "Your Talonic API key (starts with tlnc_). Get one at https://app.talonic.com.",
    },
  ],
  // A cheap call to confirm the key works during connection setup.
  test: {
    url: "https://api.talonic.com/v1/credits",
  },
  connectionLabel: "{{bundle.authData.apiKey}}",
}

const addBearer = (request, z, bundle) => {
  request.headers = request.headers || {}
  request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`
  return request
}

// SCAFFOLD: implement perform() to build the multipart /v1/extract request.
// Mapping (Zapier input field -> /v1/extract form field):
//   file        (Zapier file/hydrate URL) -> `file` part, or `file_url`
//   document_id                           -> `document_id`
//   schema      (JSON text)               -> `schema`     (omit for auto-schema)
//   schema_id                             -> `schema_id`
//   instructions                          -> `instructions`
// Return: { extraction_id, data, confidence, schema, document }.
const extractDocument = {
  key: "extract_document",
  noun: "Document",
  display: {
    label: "Extract Structured Data",
    description: "Turn a document into schema-validated JSON with Talonic.",
  },
  operation: {
    inputFields: [
      { key: "file", label: "File", type: "file", helpText: "The document to extract." },
      { key: "file_url", label: "File URL", type: "string" },
      { key: "document_id", label: "Document ID", type: "string" },
      {
        key: "schema",
        label: "Schema (JSON)",
        type: "text",
        helpText: "Target schema. Leave empty to let Talonic auto-discover the fields.",
      },
      { key: "schema_id", label: "Schema ID", type: "string" },
      { key: "instructions", label: "Instructions", type: "string" },
    ],
    perform: () => {
      throw new Error("talonic-zapier is a scaffold. See integrations/PLAN.md.")
    },
    sample: {
      extraction_id: "ext_123",
      data: { vendor_name: "ACME", total_amount: 42 },
      confidence: { overall: 0.97, fields: { vendor_name: 0.99, total_amount: 0.95 } },
      document: { id: "doc_1", filename: "invoice.pdf", type_detected: "invoice" },
    },
  },
}

module.exports = {
  version: require("./package.json").version,
  platformVersion: require("zapier-platform-core").version,
  authentication,
  beforeRequest: [addBearer],
  creates: { [extractDocument.key]: extractDocument },
}
