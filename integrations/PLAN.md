# Talonic agent-framework integrations

Make Talonic a first-class "structure this document" tool inside the frameworks
agent-builders actually use. Each integration is a thin wrapper around Talonic's
core call, **`POST /v1/extract`** (document + schema, or omit the schema for
auto-discovery), returning schema-validated JSON with per-field confidence.

The TypeScript adapters wrap the official **`@talonic/node`** SDK rather than
re-implementing HTTP. The Python / no-code scaffolds should wrap the equivalent
SDK once it exists, falling back to the REST endpoint until then.

## Shared tool contract

Every adapter exposes one operation with the same input shape and the same
trimmed output, so an agent learns Talonic once and reuses it everywhere.

**Input** (exactly one document source; schema optional):

| Field | Meaning | `/v1/extract` mapping |
| --- | --- | --- |
| `file_url` | URL the API fetches | form field `file_url` |
| `document_id` | existing Talonic document | form field `document_id` |
| `file_base64` | base64 bytes (+ `filename`) | decode -> `file` multipart part |
| `filename` | for MIME inference | multipart filename |
| `schema` | target schema; **omit for auto-schema** | JSON-encoded `schema` field |
| `schema_id` | saved-schema ID | form field `schema_id` |
| `instructions` | NL guidance | form field `instructions` |

**Validation** (identical across adapters, with LLM-readable error messages so
the agent self-corrects): exactly one document source; `file_base64` requires
`filename`; `schema` and `schema_id` are mutually exclusive.

**Output** (trimmed from the SDK `ExtractResult`):

```jsonc
{
  "extraction_id": "ext_...",
  "data": { /* the structured result; shape follows the schema or auto-schema */ },
  "confidence": { "overall": 0.97, "fields": { "...": 0.99 } },
  "schema": { /* the schema applied or discovered */ },
  "document": { "id", "filename", "type_detected", "language_detected", "pages" }
}
```

**Tool description** (drives LLM selection): "Extract structured, schema-validated
JSON from a document … use this whenever you need to turn an unstructured
document into reliable structured data with per-field confidence scores."

---

## Status

| Integration | Dir | Status | Wraps |
| --- | --- | --- | --- |
| Vercel AI SDK | `vercel-ai-sdk/` | **Built + tested** (10 tests) | `@talonic/node` |
| LangChain (JS/TS) | `langchain/` | **Built + tested** (8 tests) | `@talonic/node` |
| LlamaIndex (Python) | `llamaindex/` | Scaffold | Talonic Python SDK / REST |
| n8n community node | `n8n/` | Scaffold | REST (`/v1/extract`) |
| Zapier | `zapier/` | Scaffold | REST (`/v1/extract`) |

### Built, fully working

- **`@talonic/ai-sdk`** — `talonicExtractTool({ client })` built with the AI SDK
  `tool()` helper (`inputSchema` = zod, `execute()` calls `client.extract`).
  Returns the AI SDK `Tool` object; drop into the `tools` map of
  `generateText` / `streamText`. Unit-tested with a mocked SDK client.
- **`@talonic/langchain`** — `talonicExtractTool({ client })` built with the
  LangChain `tool()` helper from `@langchain/core/tools`, producing a
  `DynamicStructuredTool` (zod `schema`, named `talonic_extract_document`).
  Returns a JSON string (LangChain tool outputs are strings). Unit-tested.

Both have their own `tsconfig` / `tsup` / `vitest` matching the repo's tooling,
list `@talonic/node` + the framework + `zod` as **peer dependencies** (so the
adapter never forces a framework version on consumers), and `external` those in
the bundle.

### Scaffolded — exact path to finish

**LlamaIndex (Python)** — `llamaindex/talonic_llamaindex/__init__.py`
- Wrap with `FunctionTool.from_defaults(fn=extract_document, name=…, description=…)`.
- Implement `extract_document(...)` per the shared contract above. Prefer the
  Talonic Python SDK once published; until then call `/v1/extract` with `httpx`.
- Add `llama-index-core` + `httpx` to `pyproject.toml` deps, add a pytest with a
  mocked transport, publish to PyPI as `talonic-llamaindex`.

**n8n community node** — `n8n/nodes/Talonic/Talonic.node.ts` + `credentials/TalonicApi.credentials.ts`
- Follow the n8n declarative-node template (`n8n-workflow` dependency, `tsc` +
  gulp icon build). Credential already injects `Authorization: Bearer` and has a
  `test` against `/v1/credits`.
- Implement the single "Extract" operation: build the multipart form from the
  selected document source and optional schema, POST `/v1/extract`, return the
  trimmed output. Add a `talonic.svg` icon. Publish as `n8n-nodes-talonic` (the
  `n8n-community-node-package` keyword makes it discoverable in n8n).

**Zapier** — `zapier/src/index.js`
- Zapier Platform CLI app. Custom API-key auth + `beforeRequest` Bearer header
  are wired; `test` hits `/v1/credits`.
- Implement `creates.extract_document.operation.perform` to build the
  `/v1/extract` request (use Zapier file hydration for uploads) and return the
  trimmed output. `zapier register` + `zapier push`, then submit for the public
  app directory.

---

## Open decisions for a human

1. **Dedicated integrations repo vs. this folder.** These currently live in
   `talonic-node/integrations/` on a branch. Long term, the cleanest home is a
   small **pnpm/npm workspace monorepo** (e.g. `talonic-integrations`) so each
   adapter publishes independently and the Python/no-code ones aren't awkward
   guests in a Node SDK repo. Recommendation in the PR description.
2. **Publishing.** Nothing here is published. Decide npm scope (`@talonic/ai-sdk`,
   `@talonic/langchain`), PyPI name (`talonic-llamaindex`), and whether to set up
   CI publishing like `@talonic/node` already has.
3. **Python SDK.** The LlamaIndex tool wants a Talonic Python SDK to wrap; if one
   isn't planned, the scaffold falls back to raw REST.
