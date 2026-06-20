# Talonic for Zapier

A [Zapier Platform CLI](https://platform.zapier.com/) app that turns any
document into schema-validated JSON using [Talonic](https://talonic.com). Add
the **Extract Structured Data** action to a Zap and it calls Talonic's
`POST /v1/extract` (via the official [`@talonic/node`](https://www.npmjs.com/package/@talonic/node)
SDK) to return structured data with per-field confidence scores.

## Auth

Custom **API key** auth. Paste your Talonic API key (starts with `tlnc_`; get
one at https://app.talonic.com). The connection test verifies the key against
`GET /v1/credits`.

## Action: Extract Structured Data

| Input | Description |
| --- | --- |
| **File** | A document (Zapier passes a hydrate URL the Talonic API fetches). |
| **File URL** | Alternatively, a public/signed URL the API fetches. |
| **Document ID** | An already-uploaded Talonic document to (re-)extract. |
| **File (base64)** | Base64 document bytes (also set **Filename**). |
| **Filename** | Filename for MIME inference; required with File (base64). |
| **Schema (JSON)** | Optional target schema, e.g. `{ "total": "number" }`. Omit for **auto-schema**. |
| **Schema ID** | Optional saved-schema ID instead of an inline schema. |
| **Instructions** | Optional natural-language extraction guidance. |

Provide **exactly one** document source. Omit both **Schema** and **Schema ID**
to let Talonic auto-discover the fields.

### Output

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
npm test            # vitest, SDK mocked via zapier createAppTester (no live key)
```

To validate and run against Zapier's tooling once you have the CLI:

```bash
npm install -g zapier-platform-cli
zapier validate
zapier test         # runs the same test suite under the Zapier runner
```

## License

MIT
