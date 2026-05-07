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
