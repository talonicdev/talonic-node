# n8n-nodes-talonic

An [n8n](https://n8n.io) community node that turns any document into
schema-validated JSON using [Talonic](https://talonic.com). Add a **Talonic**
node to your workflow and its single **Extract** operation calls Talonic's
`POST /v1/extract` (via the official [`@talonic/node`](https://www.npmjs.com/package/@talonic/node)
SDK) to return structured data with per-field confidence scores.

## Install

In a self-hosted n8n instance: **Settings -> Community Nodes -> Install** and
enter `n8n-nodes-talonic`.

Or install manually into your n8n custom nodes directory:

```bash
npm install n8n-nodes-talonic
```

## Credentials

Create a **Talonic API** credential and paste your API key (starts with
`tlnc_`; get one at https://app.talonic.com). The credential injects
`Authorization: Bearer <key>` on every request, and its **Test** button checks
the key against `GET /v1/credits`.

## The Extract operation

| Field | Description |
| --- | --- |
| **Document Source** | `File URL`, `Binary (from previous node)`, or `Document ID`. |
| **File URL** | URL the Talonic API fetches the document from. |
| **Binary Property** | Name of the binary property holding the file to upload (default `data`). |
| **Document ID** | An already-uploaded Talonic document to (re-)extract. |
| **Schema (JSON)** | Optional target schema, e.g. `{ "total": "number" }`. Leave empty for **auto-schema**. |
| **Schema ID** | Optional saved-schema ID instead of an inline schema. |
| **Instructions** | Optional natural-language extraction guidance. |

Provide **exactly one** document source. Omit both **Schema** and **Schema ID**
to let Talonic auto-discover the fields.

### Output

Each item returns the trimmed result, identical in shape across all Talonic
adapters:

```jsonc
{
  "extraction_id": "ext_...",
  "data": { /* structured result; shape follows the schema or auto-schema */ },
  "confidence": { "overall": 0.97, "fields": { "...": 0.99 } },
  "schema": { /* the schema applied or discovered */ },
  "document": { "id", "filename", "type_detected", "language_detected", "pages" }
}
```

## Develop

```bash
npm install
npm run build      # tsc -> dist/ + copies the icon via gulp
npm test           # vitest, SDK + n8n context mocked (no live key needed)
```

## License

MIT
