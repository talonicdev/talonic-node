# talonic-llamaindex (scaffold)

> **Status: scaffold.** The wrapper shape and `/v1/extract` mapping are defined; the body raises `NotImplementedError` until implemented. See [`../PLAN.md`](../PLAN.md).

A LlamaIndex (Python) `FunctionTool` that turns any document into schema-validated JSON using Talonic.

## Intended usage

```python
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI
from talonic_llamaindex import talonic_extract_tool

tool = talonic_extract_tool(api_key="tlnc_...")
agent = ReActAgent.from_tools([tool], llm=OpenAI(model="gpt-4o"))
agent.chat("Extract the totals from https://example.com/invoice.pdf")
```

## Tool input

`file_url` | `document_id` | `file_base64` (+ `filename`) | `schema` | `schema_id` | `instructions`.

Provide exactly one document source. Omit `schema`/`schema_id` for auto-schema.

## Implementation note

Prefer wrapping the forthcoming Talonic **Python SDK** (mirroring how the TS adapters wrap `@talonic/node`) rather than re-implementing HTTP. Until that SDK ships, call `POST /v1/extract` directly with `httpx`.
