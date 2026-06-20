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
| n8n community node | `n8n/` | **Built + tested** (17 tests) | `@talonic/node` |
| Zapier | `zapier/` | **Built + tested** (15 tests) | `@talonic/node` |

### Built, fully working

- **`@talonic/ai-sdk`** — `talonicExtractTool({ client })` built with the AI SDK
  `tool()` helper (`inputSchema` = zod, `execute()` calls `client.extract`).
  Returns the AI SDK `Tool` object; drop into the `tools` map of
  `generateText` / `streamText`. Unit-tested with a mocked SDK client.
- **`@talonic/langchain`** — `talonicExtractTool({ client })` built with the
  LangChain `tool()` helper from `@langchain/core/tools`, producing a
  `DynamicStructuredTool` (zod `schema`, named `talonic_extract_document`).
  Returns a JSON string (LangChain tool outputs are strings). Unit-tested.
- **`n8n-nodes-talonic`** — an n8n community node (`INodeType` + `talonicApi`
  `ICredentialType`) with a single **Extract** operation. Programmatic
  `execute()` reads the `talonicApi` credential, instantiates `@talonic/node`,
  maps the document source (file URL / upstream binary / document ID) + optional
  schema, calls `client.extract`, and returns the trimmed output. Built with
  `tsc` + a gulp icon copy; tested with vitest (SDK + n8n context mocked).
- **`talonic-zapier`** — a Zapier Platform CLI app (`zapier-platform-core`) with
  custom API-key auth and one **Extract Structured Data** create. `perform`
  instantiates `@talonic/node` and calls `client.extract`; a Zapier file-hydrate
  URL is passed through as `file_url`. Tested with vitest via `createAppTester`
  (SDK stubbed, no live key).

Both have their own `tsconfig` / `tsup` / `vitest` matching the repo's tooling,
list `@talonic/node` + the framework + `zod` as **peer dependencies** (so the
adapter never forces a framework version on consumers), and `external` those in
the bundle.

### Scaffolded — exact path to finish

**LlamaIndex (Python)** — `llamaindex/talonic_llamaindex/__init__.py` (held pending a benchmark decision; left untouched).
- Wrap with `FunctionTool.from_defaults(fn=extract_document, name=…, description=…)`.
- Implement `extract_document(...)` per the shared contract above. Prefer the
  Talonic Python SDK once published; until then call `/v1/extract` with `httpx`.
- Add `llama-index-core` + `httpx` to `pyproject.toml` deps, add a pytest with a
  mocked transport, publish to PyPI as `talonic-llamaindex`.

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
