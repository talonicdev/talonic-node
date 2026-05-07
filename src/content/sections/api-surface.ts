import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "extract",
    parentSlug: "api-surface",
    title: "Extract",
    seoTitle: "Extract Method — Talonic Node SDK",
    description:
      "Top-level extract method: send a document and schema, receive structured validated data with confidence scores.",
    content: [
      {
        type: "paragraph",
        text: "The top-level `extract()` method is the primary entry point. Send a document and schema, receive structured validated data.",
      },
      {
        type: "code",
        language: "typescript",
        code: `await talonic.extract({
  file_path: "./invoice.pdf",
  schema: {
    vendor_name: "string",
    total_amount: "number",
  },
})`,
      },
      {
        type: "paragraph",
        text: "Accepts `file_path` (local file), `file_url` (remote URL), `file_data` + `filename` (base64 bytes), or `document_id` (previously uploaded). Provide a `schema` (inline definition) or `schema_id` (saved schema UUID).",
      },
      {
        type: "paragraph",
        text: "Under the hood, **extract()** reads the file from disk (or fetches it from a URL), uploads it as multipart form data, and returns the structured result in a single round-trip. The response includes a `cost` block with credit consumption and a `rateLimit` object parsed from response headers.",
      },
      {
        type: "paragraph",
        text: "For best results, always supply a `schema` or `schema_id` rather than relying on auto-discovery. Inline schemas work well for one-off extractions, while saved schemas (via `schema_id`) keep your extraction definitions consistent across calls and team members.",
      },
      {
        type: "callout",
        text: "Every **extract()** response carries `cost` metadata (credits consumed, EUR value, post-call balance) and `rateLimit` info. Use these to build budget-aware pipelines without extra API calls.",
      },
    ],
    related: [
      { label: "Schemas", slug: "schemas" },
      { label: "Documents", slug: "documents" },
    ],
    faq: [
      {
        question: "What inputs does talonic.extract() accept?",
        answer:
          "It accepts file_path (local file), file_url (remote URL), file_data + filename (base64), or document_id (previously uploaded). Provide a schema or schema_id.",
      },
      {
        question: "Does extract() return cost information?",
        answer:
          "Yes. Every extract response includes a cost block with costCredits, costEur, balanceCredits, cellsResolvedRegistry, and cellsResolvedAi parsed from response headers.",
      },
      {
        question: "Can I extract the same document with different schemas?",
        answer:
          "Yes. Pass the document_id from a previous upload along with a new schema or schema_id. The document is not re-uploaded, saving bandwidth and credits.",
      },
    ],
    mentions: ["extract", "schema", "file_path", "file_url", "document_id"],
  },
  {
    slug: "documents",
    parentSlug: "api-surface",
    title: "Documents",
    seoTitle: "Documents API — Talonic Node SDK",
    description:
      "List, retrieve, get markdown, re-extract, and delete documents in your Talonic workspace.",
    content: [
      {
        type: "paragraph",
        text: "The **documents** resource lets you manage uploaded files in your workspace. Every call to **extract()** creates a document automatically, but you can also list, inspect, re-extract, and delete documents independently.",
      },
      {
        type: "code",
        language: "typescript",
        code: `// List documents
await talonic.documents.list({ per_page: 50 })

// Get a single document
await talonic.documents.get(id)

// Get OCR markdown
await talonic.documents.getMarkdown(id)

// Re-extract with a new schema
await talonic.documents.reExtract(id)

// Delete
await talonic.documents.delete(id)`,
      },
      {
        type: "paragraph",
        text: "Use **getMarkdown()** to retrieve the raw OCR output for a document. This is useful for debugging extraction quality or building custom post-processing pipelines on top of the parsed text.",
      },
      {
        type: "paragraph",
        text: "The **list()** method supports pagination via `per_page` and `page` parameters. Results are sorted by upload date descending. Use **reExtract()** to run a document through extraction again, for example after updating a schema definition.",
      },
      {
        type: "callout",
        text: "Deleting a document also removes all associated extractions. If you need to preserve extraction history, fetch the data with **extractions.getData()** before deleting.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Extractions", slug: "extractions" },
    ],
    faq: [
      {
        question: "How do I list documents with the Talonic SDK?",
        answer: "Call talonic.documents.list() with optional pagination parameters like per_page.",
      },
      {
        question: "What does getMarkdown() return?",
        answer:
          "It returns the raw OCR markdown output for a document, which is the text the extraction engine uses as input. Useful for debugging or building custom processing pipelines.",
      },
      {
        question: "Does deleting a document remove its extractions?",
        answer:
          "Yes. Deleting a document removes all associated extraction results. Retrieve any data you need before calling delete().",
      },
    ],
    mentions: ["documents", "list", "get", "delete", "markdown"],
  },
  {
    slug: "extractions",
    parentSlug: "api-surface",
    title: "Extractions",
    seoTitle: "Extractions API — Talonic Node SDK",
    description:
      "Query extraction results, retrieve structured data in JSON or CSV, and submit field corrections.",
    content: [
      {
        type: "paragraph",
        text: "The **extractions** resource gives you access to the structured data produced by each extraction run. Every **extract()** call creates an extraction record that you can query, export, and correct after the fact.",
      },
      {
        type: "code",
        language: "typescript",
        code: `// List extractions for a document
await talonic.extractions.list({ document_id })

// Get extraction metadata
await talonic.extractions.get(id)

// Get structured data (JSON)
await talonic.extractions.getData(id)

// Get structured data (CSV)
await talonic.extractions.getData(id, { format: "csv" })

// Submit corrections
await talonic.extractions.patch(id, { corrections: [...] })`,
      },
      {
        type: "paragraph",
        text: "Use **getData()** to retrieve extraction results as JSON (default) or CSV. The JSON format returns typed objects matching your schema definition, while CSV is convenient for spreadsheet workflows or bulk data exports.",
      },
      {
        type: "paragraph",
        text: "The **patch()** method submits field-level corrections back to the extraction. Corrections improve future extraction accuracy for similar documents by feeding the correction loop, so submitting them is worth the effort even if you fix the value downstream.",
      },
      {
        type: "callout",
        text: "A single document can have multiple extractions if it was re-extracted with different schemas. Use **list({ document_id })** to see all extraction runs for a given document.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Documents", slug: "documents" },
    ],
    faq: [
      {
        question: "How do I get extraction data as CSV?",
        answer:
          'Call talonic.extractions.getData(id, { format: "csv" }) to receive the structured data as a CSV string.',
      },
      {
        question: "What does the patch() method do?",
        answer:
          "It submits field-level corrections to an extraction result. Corrections are fed back into the extraction engine to improve accuracy for similar documents in future runs.",
      },
      {
        question: "Can a document have multiple extractions?",
        answer:
          "Yes. Re-extracting a document with a different schema creates a new extraction record. Use extractions.list({ document_id }) to retrieve all runs for one document.",
      },
    ],
    mentions: ["extractions", "getData", "corrections", "CSV", "JSON"],
  },
  {
    slug: "schemas",
    parentSlug: "api-surface",
    title: "Schemas",
    seoTitle: "Schemas API — Talonic Node SDK",
    description:
      "Create, update, and manage reusable extraction schemas for consistent document structuring.",
    content: [
      {
        type: "paragraph",
        text: "The **schemas** resource manages reusable extraction definitions. Instead of passing an inline `schema` on every **extract()** call, create a named schema once and reference it by `schema_id` across all your extractions.",
      },
      {
        type: "code",
        language: "typescript",
        code: `// List all schemas
await talonic.schemas.list()

// Get a schema
await talonic.schemas.get(id)

// Create a new schema
await talonic.schemas.create({ name, definition })

// Update
await talonic.schemas.update(id, { ... })

// Delete
await talonic.schemas.delete(id)`,
      },
      {
        type: "paragraph",
        text: "Schema definitions follow JSON Schema format with `type: \"object\"` and `properties`. Each property specifies a field name and type that the extraction engine will resolve. Updating a schema does not retroactively change existing extractions, but all future **extract()** calls using that `schema_id` will pick up the new definition.",
      },
      {
        type: "paragraph",
        text: "Saved schemas are workspace-scoped, so every team member with API access can reference the same `schema_id`. This makes schemas the right tool for standardising extraction output across a pipeline or team.",
      },
      {
        type: "callout",
        variant: "warning",
        text: "Use full JSON Schema format (`type: \"object\"` with `properties`) rather than the flat key-type shorthand. The server-side normaliser for the shorthand format is not fully supported yet.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Known Issues", slug: "current-limitations" },
    ],
    faq: [
      {
        question: "How do I create a reusable schema?",
        answer:
          "Call talonic.schemas.create({ name, definition }) with a JSON Schema definition. Use the returned schema_id in future extract calls.",
      },
      {
        question: "Are schemas shared across team members?",
        answer:
          "Yes. Schemas are workspace-scoped. Anyone with API access to the workspace can reference the same schema_id in their extract calls.",
      },
      {
        question: "Does updating a schema change existing extractions?",
        answer:
          "No. Updating a schema only affects future extract calls that reference that schema_id. Existing extraction results remain unchanged.",
      },
    ],
    mentions: ["schemas", "JSON Schema", "create", "update"],
  },
  {
    slug: "jobs",
    parentSlug: "api-surface",
    title: "Jobs",
    seoTitle: "Jobs API — Talonic Node SDK",
    description: "Create and track asynchronous batch extraction jobs across multiple documents.",
    content: [
      {
        type: "paragraph",
        text: "The **jobs** resource handles asynchronous batch extraction across multiple documents. Create a job with a `schema_id` and an array of `document_ids`, then poll for completion or fetch results when the job finishes.",
      },
      {
        type: "code",
        language: "typescript",
        code: `// Create a batch job
await talonic.jobs.create({ schema_id, document_ids })

// List jobs
await talonic.jobs.list()

// Get job status
await talonic.jobs.get(id)

// Get results
await talonic.jobs.getResults(id)

// Cancel
await talonic.jobs.cancel(id)`,
      },
      {
        type: "paragraph",
        text: "Jobs run server-side and process documents in parallel. Use **get()** to poll the job status (queued, running, completed, failed) and **getResults()** to retrieve the extraction output once complete. For long-running batches, poll on a reasonable interval such as every 5 seconds.",
      },
      {
        type: "paragraph",
        text: "Use **cancel()** to abort a job that is still in progress. Cancelled jobs stop processing remaining documents but any extractions already completed are preserved and accessible via **getResults()**.",
      },
      {
        type: "callout",
        text: "Jobs require a saved `schema_id` rather than an inline schema. Create your schema with **schemas.create()** first, then pass the returned ID to **jobs.create()**.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Schemas", slug: "schemas" },
    ],
    faq: [
      {
        question: "How do I run batch extraction with the Talonic SDK?",
        answer:
          "Call talonic.jobs.create({ schema_id, document_ids }) to start an async batch job, then poll with talonic.jobs.get(id) or retrieve results with talonic.jobs.getResults(id).",
      },
      {
        question: "Can I use an inline schema with jobs?",
        answer:
          "No. Jobs require a saved schema_id. Create your schema first with talonic.schemas.create(), then pass the returned ID to talonic.jobs.create().",
      },
      {
        question: "What happens to completed extractions if I cancel a job?",
        answer:
          "Extractions already completed before cancellation are preserved. You can still retrieve them with talonic.jobs.getResults(id).",
      },
    ],
    mentions: ["jobs", "batch", "async"],
  },
  {
    slug: "credits",
    parentSlug: "api-surface",
    title: "Credits",
    seoTitle: "Credits API — Talonic Node SDK",
    description:
      "Read the workspace credit balance, EUR value, 30-day burn rate, projected runway, tier, and next monthly tier-reset timestamp from the Talonic Node SDK.",
    content: [
      {
        type: "paragraph",
        text: "Use `talonic.credits.getBalance()` to fetch the workspace's current credit balance and budget metadata. Pair this with the `cost` block on `extract` responses for budget-aware behaviour: read the balance before scheduling a batch, log per-call cost as you go.",
      },
      {
        type: "paragraph",
        text: "The balance response includes `burn_rate_30d_credits` and `projected_runway_days` so you can build alerts before credits run out. A `projected_runway_days` value of `-1` means zero consumption in the trailing window, so no projection is possible.",
      },
      {
        type: "paragraph",
        text: "Credits are workspace-scoped and shared across all API keys. The `tier` field reflects your current plan (free, pro, enterprise) and `tier_resets_at` indicates when the monthly allocation refreshes. This call is read-only and does not consume credits.",
      },
      {
        type: "code",
        language: "typescript",
        code: `// Get the enriched workspace balance
const balance = await talonic.credits.getBalance()

// {
//   balance_credits: 1888,
//   balance_eur: 9.44,
//   burn_rate_30d_credits: 360,
//   projected_runway_days: 157,    // -1 means no consumption in the trailing window
//   tier: "pro",
//   tier_resets_at: "2026-06-01T00:00:00.000Z"
// }

// Per-call cost is also surfaced on extract responses
const result = await talonic.extract({ ... })
console.log(result.cost)
// {
//   costCredits: 12,
//   costEur: 0.06,
//   balanceCredits: 1876,           // post-call balance
//   cellsResolvedRegistry: 2,       // cheap path
//   cellsResolvedAi: 10             // priced path
// }
// null on calls that do not run through the extract path.`,
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Errors", slug: "errors" },
    ],
    faq: [
      {
        question: "How do I check my Talonic credit balance from the Node SDK?",
        answer:
          "Call talonic.credits.getBalance(). It returns balance_credits, balance_eur, burn_rate_30d_credits, projected_runway_days, tier, and tier_resets_at. Read-only and safe to call at any time.",
      },
      {
        question: "What is the cost field on extract responses?",
        answer:
          "Every extract response carries a `cost` block parsed from the X-Talonic-Cost-* and X-Talonic-Balance-* response headers. Fields: costCredits, costEur, balanceCredits, cellsResolvedRegistry, cellsResolvedAi. Null on calls that did not run through extract.",
      },
      {
        question: "What does projected_runway_days = -1 mean?",
        answer:
          "It means the workspace has had zero credit consumption in the trailing 30 days, so a meaningful runway projection cannot be computed. Treat -1 as 'unknown' rather than '0 days'.",
      },
    ],
    mentions: ["credits", "balance", "EUR", "burn rate", "runway", "tier", "cost", "budget"],
  },
]
