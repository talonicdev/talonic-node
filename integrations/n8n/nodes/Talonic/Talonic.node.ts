/**
 * Talonic n8n community node.
 *
 * A single "Extract" operation that maps onto Talonic's
 * `POST /v1/extract` via the official `@talonic/node` SDK (never raw
 * HTTP). Document + optional schema in, schema-validated JSON with
 * per-field confidence out.
 *
 * Built programmatically (not declarative `routing`) so binary uploads
 * from upstream nodes work and so the node reuses the same SDK the rest
 * of the Talonic adapters wrap.
 */
import {
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  NodeOperationError,
} from "n8n-workflow"
import { Talonic } from "@talonic/node"
import {
  assertValidInput,
  type TalonicExtractInput,
  toExtractParams,
  toToolResult,
} from "../../shared"

export class TalonicNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Talonic",
    name: "talonic",
    icon: "file:talonic.svg",
    group: ["transform"],
    version: 1,
    subtitle: "Extract structured data",
    description:
      "Extract structured, schema-validated JSON from any document with Talonic",
    defaults: { name: "Talonic" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "talonicApi", required: true }],
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
            description: "Turn a document into schema-validated JSON",
          },
        ],
        default: "extract",
      },
      {
        displayName: "Document Source",
        name: "documentSource",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "File URL", value: "file_url" },
          { name: "Binary (From Previous Node)", value: "binary" },
          { name: "Document ID", value: "document_id" },
        ],
        default: "file_url",
        description: "Where the document comes from",
      },
      {
        displayName: "File URL",
        name: "fileUrl",
        type: "string",
        default: "",
        placeholder: "https://example.com/invoice.pdf",
        description: "URL the Talonic API fetches the document from",
        displayOptions: { show: { documentSource: ["file_url"] } },
      },
      {
        displayName: "Document ID",
        name: "documentId",
        type: "string",
        default: "",
        description: "ID of a document already uploaded to Talonic, to (re-)extract",
        displayOptions: { show: { documentSource: ["document_id"] } },
      },
      {
        displayName: "Binary Property",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        description:
          "Name of the binary property holding the document to upload as the file part",
        displayOptions: { show: { documentSource: ["binary"] } },
      },
      {
        displayName: "Schema (JSON)",
        name: "schema",
        type: "json",
        default: "",
        description:
          "Target schema, e.g. { \"vendor_name\": \"string\", \"total\": \"number\" }. Leave empty to let Talonic auto-discover the fields (auto-schema).",
      },
      {
        displayName: "Schema ID",
        name: "schemaId",
        type: "string",
        default: "",
        description: "ID of a saved Talonic schema to apply instead of an inline schema",
      },
      {
        displayName: "Instructions",
        name: "instructions",
        type: "string",
        default: "",
        placeholder: "Amounts are in EUR",
        description: "Optional natural-language guidance for the extraction",
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []

    const credentials = await this.getCredentials("talonicApi")
    const client = new Talonic({ apiKey: credentials.apiKey as string })

    for (let i = 0; i < items.length; i++) {
      try {
        const documentSource = this.getNodeParameter("documentSource", i) as string
        const schemaRaw = this.getNodeParameter("schema", i, "") as
          | string
          | Record<string, unknown>
        const schemaId = this.getNodeParameter("schemaId", i, "") as string
        const instructions = this.getNodeParameter("instructions", i, "") as string

        const input: TalonicExtractInput = {}

        if (documentSource === "file_url") {
          input.file_url = this.getNodeParameter("fileUrl", i, "") as string
        } else if (documentSource === "document_id") {
          input.document_id = this.getNodeParameter("documentId", i, "") as string
        } else if (documentSource === "binary") {
          const binaryPropertyName = this.getNodeParameter(
            "binaryPropertyName",
            i,
            "data",
          ) as string
          const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName)
          const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName)
          input.file_base64 = buffer.toString("base64")
          input.filename = binaryData.fileName ?? "document"
        }

        if (schemaId !== "") input.schema_id = schemaId
        if (instructions !== "") input.instructions = instructions
        if (schemaRaw !== "" && schemaRaw !== undefined) {
          input.schema = schemaRaw as Record<string, unknown> | string
        }

        assertValidInput(input)

        const result = await client.extract(toExtractParams(input))
        const trimmed = toToolResult(result)

        returnData.push({
          json: trimmed as unknown as IDataObject,
          pairedItem: { item: i },
        })
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          })
          continue
        }
        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i })
      }
    }

    return [returnData]
  }
}
