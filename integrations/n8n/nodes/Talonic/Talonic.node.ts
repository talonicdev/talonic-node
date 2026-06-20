/**
 * Talonic n8n community node — SCAFFOLD.
 *
 * Not registered or published. This file documents the node shape an
 * implementer should fill in following the n8n declarative-node tutorial:
 * https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/
 *
 * The single "Extract" operation maps directly onto POST /v1/extract.
 * Prefer the declarative `routing` style so n8n builds the multipart
 * request for us; fall back to a programmatic `execute()` if binary
 * upload handling needs it.
 *
 * @ts-nocheck is intentional — `n8n-workflow` is a peer that is not
 * installed in this scaffold, so the types are illustrative only.
 */
// @ts-nocheck
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow"

export class Talonic implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Talonic",
    name: "talonic",
    icon: "file:talonic.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{ "Extract structured data" }}',
    description: "Extract structured, schema-validated JSON from any document with Talonic",
    defaults: { name: "Talonic" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "talonicApi", required: true }],
    requestDefaults: {
      baseURL: "https://api.talonic.com",
      headers: { Accept: "application/json" },
    },
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Extract",
            value: "extract",
            action: "Extract structured data from a document",
            description: "POST /v1/extract — document + optional schema -> validated JSON",
          },
        ],
        default: "extract",
      },
      // Document source (exactly one). Implementer: use displayOptions to
      // toggle the relevant field based on this selector.
      {
        displayName: "Document Source",
        name: "documentSource",
        type: "options",
        options: [
          { name: "File URL", value: "file_url" },
          { name: "Binary (from previous node)", value: "binary" },
          { name: "Document ID", value: "document_id" },
        ],
        default: "file_url",
      },
      { displayName: "File URL", name: "file_url", type: "string", default: "" },
      { displayName: "Document ID", name: "document_id", type: "string", default: "" },
      {
        displayName: "Binary Property",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        description: "Name of the binary property holding the document to upload as the `file` part",
      },
      // Schema (optional — omit for auto-schema).
      {
        displayName: "Schema (JSON)",
        name: "schema",
        type: "json",
        default: "",
        description: "Target schema. Leave empty to let Talonic auto-discover the fields.",
      },
      { displayName: "Schema ID", name: "schema_id", type: "string", default: "" },
      { displayName: "Instructions", name: "instructions", type: "string", default: "" },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // SCAFFOLD: for each input item, build the multipart form per the
    // mapping above and call POST {baseURL}/v1/extract with the
    // `talonicApi` credential's Authorization: Bearer header, then return
    // { extraction_id, data, confidence, schema, document }.
    throw new Error("n8n-nodes-talonic is a scaffold. See integrations/PLAN.md.")
  }
}
