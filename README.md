# @talonic/node

Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.

> **Status:** v0.1.3. Core surface stable. Live `extract` is verified end-to-end against production. `documents.filter()` now passes canonical field names directly to the API for server-side resolution; remaining edge cases are tracked in [Known issues](#known-issues).

> **Looking for the AI agent path?** [`@talonic/mcp`](https://github.com/talonicdev/talonic-mcp) wraps this SDK as a Model Context Protocol server. Install it into Claude Desktop, Cursor, Cline, Continue, or Cowork and any MCP-aware agent can extract documents directly.

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
    vendor_name: "string",
    invoice_number: "string",
    total_amount: "number",
    due_date: "date",
  },
})

console.log(result.data)
// { vendor_name: "Acme Corp", invoice_number: "INV-2024-0847", total_amount: 14250, due_date: "2024-03-15" }
```

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
  --schema='{"vendor_name":"string","total_amount":"number"}'
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

- **Auto-discovery extract (no schema) currently returns 500 on production.** Always provide a `schema` or `schema_id` in v0.1.
- **Schema definitions: prefer full JSON Schema for now.** The flat key-type map (`{ vendor_name: "string", ... }`) is documented as supported and the API's own error message lists it as accepted, but as of writing the server-side normaliser does not actually translate it. Until that ships, send full JSON Schema:
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
- **`is_not_empty` filter currently underreports.** A filter condition with `operator: "is_not_empty"` may return zero documents even when the field has populated values in the workspace. The other operators (`eq`, `gt`, `gte`, `lt`, `lte`, `contains`, `between`, `is_empty`) work as expected. Tracked separately.

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
