# @talonic/langchain

A [LangChain](https://docs.langchain.com) (JS/TS) tool that turns any document into schema-validated JSON using [Talonic](https://talonic.com). Add it to a LangChain agent's tool list and the LLM gains a reliable "structure this document" capability backed by `POST /v1/extract`, with per-field confidence scores.

## Install

```bash
npm install @talonic/langchain @talonic/node @langchain/core zod
```

`@talonic/node`, `@langchain/core`, and `zod` are peer dependencies.

## Usage

```ts
import { ChatOpenAI } from "@langchain/openai"
import { createReactAgent } from "langchain"
import { Talonic } from "@talonic/node"
import { talonicExtractTool } from "@talonic/langchain"

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

const agent = createReactAgent({
  llm: new ChatOpenAI({ model: "gpt-4o" }),
  tools: [talonicExtractTool({ client: talonic })],
})

const result = await agent.invoke({
  messages: [
    { role: "user", content: "Extract the totals from https://example.com/invoice.pdf" },
  ],
})
```

You can also call the tool directly:

```ts
const extractTool = talonicExtractTool({ client: talonic })

const json = await extractTool.invoke({
  file_url: "https://example.com/invoice.pdf",
  schema: { vendor_name: "string", total_amount: "number" },
})
// json is a JSON string: { extraction_id, data, confidence, schema, document }
```

## Tool input

| Field | Description |
| --- | --- |
| `file_url` | URL the Talonic API fetches. |
| `document_id` | An already-uploaded Talonic document to (re-)extract. |
| `file_base64` | Base64 document bytes (also set `filename`). |
| `filename` | Filename for MIME inference; required with `file_base64`. |
| `schema` | Optional target schema, e.g. `{ "total": "number" }`. Omit for **auto-schema**. |
| `schema_id` | Optional saved-schema ID instead of an inline `schema`. |
| `instructions` | Optional natural-language extraction guidance. |

Provide **exactly one** document source. Omit both `schema` and `schema_id` to let Talonic auto-discover the fields.

## Tool output

LangChain tool outputs are strings, so the tool returns a JSON string containing:

```ts
{
  extraction_id: string
  data: Record<string, unknown>
  confidence?: { overall: number; fields: Record<string, number> }
  schema?: Record<string, unknown> | null
  document: { id, filename, type_detected?, language_detected?, pages? }
}
```

## Options

```ts
talonicExtractTool({
  client: talonic,
  name: "talonic_extract_document", // optional, this is the default
  description: "Custom description shown to the model", // optional
})
```

## License

MIT
