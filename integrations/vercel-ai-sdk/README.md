# @talonic/ai-sdk

A [Vercel AI SDK](https://ai-sdk.dev) tool that turns any document into schema-validated JSON using [Talonic](https://talonic.com). Give your AI SDK agents a reliable "structure this document" capability backed by `POST /v1/extract`, complete with per-field confidence scores.

## Install

```bash
npm install @talonic/ai-sdk @talonic/node ai zod
```

`@talonic/node`, `ai`, and `zod` are peer dependencies, so the adapter never pins versions for you.

## Usage

```ts
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { Talonic } from "@talonic/node"
import { talonicExtractTool } from "@talonic/ai-sdk"

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: {
    extractDocument: talonicExtractTool({ client: talonic }),
  },
  prompt:
    "Extract vendor, invoice number, and total from https://example.com/invoice.pdf",
})

console.log(text)
```

The model fills in the tool's arguments and the `execute()` function calls Talonic for you.

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

```ts
{
  extraction_id: string
  data: Record<string, unknown>        // the structured result
  confidence?: { overall: number; fields: Record<string, number> }
  schema?: Record<string, unknown> | null
  document: { id, filename, type_detected?, language_detected?, pages? }
}
```

## Options

```ts
talonicExtractTool({
  client: talonic,
  description: "Custom description shown to the model", // optional
})
```

## License

MIT
