# Talonic agent-framework integrations

Thin wrappers that make Talonic a first-class "structure this document" tool in
the frameworks agent-builders use. Each wraps Talonic's `POST /v1/extract`
(document + schema, or omit the schema for auto-discovery).

| Integration | Status | Package |
| --- | --- | --- |
| [Vercel AI SDK](./vercel-ai-sdk) | Built + tested | `@talonic/ai-sdk` |
| [LangChain (JS/TS)](./langchain) | Built + tested | `@talonic/langchain` |
| [LlamaIndex (Python)](./llamaindex) | Scaffold | `talonic-llamaindex` |
| [n8n community node](./n8n) | Built + tested | `n8n-nodes-talonic` |
| [Zapier](./zapier) | Built + tested | `talonic-zapier` |

See [`PLAN.md`](./PLAN.md) for the shared tool contract, the `/v1/extract`
mapping, and the exact path to finish the remaining LlamaIndex scaffold.
