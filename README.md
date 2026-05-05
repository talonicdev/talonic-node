# @talonic/node

Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.

> **Status:** Core surface stable. Live `extract` is verified end-to-end against production. `documents.filter()` now passes canonical field names directly to the API for server-side resolution; remaining edge cases are tracked in [Known issues](#known-issues).

> **Looking for the AI agent path?** [`@talonic/mcp`](https://github.com/talonicdev/talonic-mcp) wraps this SDK as a Model Context Protocol server. Install it locally into Claude Desktop, Cursor, Cline, Continue, or Cowork via `npx -y @talonic/mcp@latest`, or use the hosted endpoint at `https://mcp.talonic.com/mcp` from Claude.ai's "Add custom connector" flow. Either way, any MCP-aware agent can extract documents directly.

## Install

```bash
npm install @talonic/node
```

Requires Node.js 18 or newer. Zero runtime dependencies.

## Get an API key (30 seconds)

Every user runs against their own Talonic workspace, so each user needs their own key. Workspaces are isolated; your documents and schemas are private to you.

1. Sign up at [https://app.talonic.com](https://app.talonic.com). Free tier: 50 extractions per day, no credit card.
2. Settings → API Keys → Create New Key.
3. Copy the `tlnc_` value.
4. Set it as the `TALONIC_API_KEY` environment variable, or pass it directly to the client constructor.

## Quickstart

```ts
import { Talonic } from "@talonic/node"

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

const result = await talonic.extract({
  file_path: "./invoice.pdf",
  schema: {
    type: "object",
    properties: {
      vendor_name: { type: "string", title: "Vendor Name" },
      invoice_number: { type: "string", title: "Invoice Number" },
      total_amount: { type: "number", title: "Total Amount" },
      due_date: { type: "string", title: "Due Date", format: "date" },
    },
    required: ["vendor_name", "total_amount"],
  },
})

console.log(result.data)
// { vendor_name: "Acme Corp", invoice_number: "INV-2024-0847", total_amount: 14250, due_date: "2024-03-15" }

console.log(result.confidence.overall)
// 0.97   — overall extraction confidence (0..1)

console.log(result.rateLimit)
// { limit, remaining, resetAt }   — parsed from X-RateLimit-* headers
```

Pass full JSON Schema with `type: "object"` and `properties` for reliable results. The SDK auto-populates `required` from `properties` when omitted, so you cannot accidentally end up with the silent-empty-data footgun where the API returns `null` for fields you intended to extract. Pass `include_provenance: true` to also receive per-field source evidence (page, section, source text).

## API surface

```ts
// Top-level
await talonic.extract({ ... })

// Documents
await talonic.documents.list({ per_page: 50 })
await talonic.documents.get(id)
await talonic.documents.getMarkdown(id)
await talonic.documents.reExtract(id)
await talonic.documents.delete(id)

// Extractions
await talonic.extractions.list({ document_id })
await talonic.extractions.get(id)
await talonic.extractions.getData(id)             // returns object
await talonic.extractions.getData(id, { format: "csv" })  // returns string
await talonic.extractions.patch(id, { corrections: [...] })

// Schemas
await talonic.schemas.list()
await talonic.schemas.get(id)
await talonic.schemas.create({ name, definition })
await talonic.schemas.update(id, { ... })
await talonic.schemas.delete(id)

// Asynchronous batch jobs
await talonic.jobs.create({ schema_id, document_ids })
await talonic.jobs.list()
await talonic.jobs.get(id)
await talonic.jobs.getResults(id)
await talonic.jobs.cancel(id)
```

## CLI

The package ships with a `talonic` binary:

```bash
talonic schemas list
talonic documents list --per-page=20
talonic extract ./invoice.pdf \
  --schema='{"type":"object","properties":{"vendor_name":{"type":"string"},"total_amount":{"type":"number"}},"required":["vendor_name","total_amount"]}'
talonic --help
```

## Configuration

```ts
const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  baseUrl: "https://api.talonic.com",   // default
  timeout: 60_000,                       // ms; default 60s
  maxRetries: 3,                         // 429, 500, 502, 503, 504, network, timeout
  fetch: customFetch,                    // optional override (e.g. for testing)
})
```

The SDK retries automatically on `429` (respecting `X-RateLimit-Reset`), `500`, `502`, `503`, `504`, network errors, and timeouts. Backoff is exponential with jitter, capped at 16s. The API may set `retryable: false` on a specific error; the SDK respects that and does not retry.

## Rate limits

Every successful response is wrapped in `WithRateLimit<T>` and includes a `rateLimit` block parsed from the `X-RateLimit-*` response headers:

```ts
const result = await talonic.schemas.list()

result.data         // SchemaList
result.rateLimit    // { limit, remaining, resetAt }
```

> **Caveat (v0.1.7):** the rate-limit values currently come back as sentinel zeros (`{limit: 0, remaining: 0, resetAt: 1970-01-01T00:00:00.000Z}`) because either the API is not emitting `X-RateLimit-*` headers or the transport layer is not parsing them. The wrapper exists, the values are not yet meaningful. Tracked for a fix.

## Errors

Every failure is a `TalonicError` subclass:

```ts
import {
  TalonicError,           // base
  TalonicAuthError,       // 401, 403
  TalonicNotFoundError,   // 404
  TalonicValidationError, // 400, 409, 413, 422
  TalonicRateLimitError,  // 429 (after retries exhausted)
  TalonicServerError,     // 500, 502, 503, 504 (after retries exhausted)
  TalonicNetworkError,    // DNS / TCP failures
  TalonicTimeoutError,    // request exceeded timeout
} from "@talonic/node"

try {
  await talonic.extract({ ... })
} catch (err) {
  if (err instanceof TalonicRateLimitError) {
    console.log(`Reset at ${err.rateLimit.resetAt}`)
  } else if (err instanceof TalonicError) {
    console.error(`${err.code} (status ${err.status}, request ${err.requestId}): ${err.message}`)
  }
}
```

## Known issues

- **Schema is required on `extract`.** Schema-less extraction is unreliable in v0.1. Always provide a `schema` (full JSON Schema recommended) or a `schema_id`. The MCP wrapper at `@talonic/mcp` rejects schema-less calls at the layer above; the SDK passes through but you will hit unreliable behaviour.
- **Schema definitions: prefer full JSON Schema.** The flat key-type map (`{ vendor_name: "string", ... }`) is documented as supported and the API's own error message lists it as accepted, but as of writing the server-side normaliser does not always translate it. If a flat-map save returns a "no fields" error, fall back to:
  ```ts
  schema: {
    type: "object",
    properties: {
      vendor_name: { type: "string", title: "Vendor Name" },
      total_amount: { type: "number", title: "Total Amount" },
    },
    required: ["vendor_name", "total_amount"],
  }
  ```
- **Filter requires `filterable: true` fields.** Call `talonic.search(...)` first; only entries in the response where `filterable: true` can be used as `field` (or `fieldId`) on `talonic.documents.filter(...)`. Entries with `filterable: false` exist in the schema but have no extracted data yet.
- **Schema field type affects filter operators.** Numeric operators (`gt`, `gte`, `lt`, `lte`, `between`) only work on fields typed as `number` in the schema. Numeric values stored as strings (with currency symbols, locale formatting, etc.) silently return zero results. Type your schema fields appropriately at design time.
- **`is_not_empty` filter currently underreports.** A filter condition with `operator: "is_not_empty"` may return zero documents even when the field has populated values in the workspace. The other operators (`eq`, `gt`, `gte`, `lt`, `lte`, `contains`, `between`, `is_empty`) work as expected.
- **Rate-limit values come back as sentinel zeros.** See the [Rate limits](#rate-limits) section. The `WithRateLimit<T>` wrapper is in place; the values are not yet meaningful.
- **Cost, EUR price, and remaining balance are not surfaced** in API responses. Credit balance must be checked in the Talonic dashboard.

## Development

```bash
npm install
npm test                      # 100+ unit tests
npm run typecheck
npm run check:spec            # verify SDK paths against the official OpenAPI spec
npm run build
npm run debug                 # diagnostic against the live API (needs TALONIC_API_KEY)
npm run test:live             # full live integration tests
```

### Source of truth: `@talonic/docs/openapi.json`

The canonical Talonic API contract is the OpenAPI spec shipped via the
`@talonic/docs` npm package. The SDK is built against it and CI verifies
every call site stays in sync.

If you ever see CI fail with `API spec drift detected`, one of two things
has happened: the spec changed and the SDK needs an update, or someone
introduced a path that does not exist in the spec. Either way, fix the
code or bump `@talonic/docs`. Do not bypass the check.

We previously kept a `talonic-api-reference.md` in the repo root; that
document was incomplete and incorrect on several paths and has been
removed. Use the OpenAPI spec instead.

## License

MIT (c) Talonic GmbH
