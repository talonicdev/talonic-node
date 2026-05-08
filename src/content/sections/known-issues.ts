import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "current-limitations",
    parentSlug: "known-issues",
    title: "Current Limitations",
    seoTitle: "Known Issues — Talonic Node SDK",
    description:
      "Known issues and limitations in the current version of the Talonic Node SDK, including auto-discovery extract and schema format constraints.",
    content: [
      {
        type: "paragraph",
        text: "The following limitations apply to the current version of the SDK and the underlying API. They are tracked and will be resolved in upcoming releases.",
      },
      {
        type: "list",
        items: [
          "**Auto-discovery extract (no schema) currently returns 500 on production.** Always provide a `schema` or `schema_id` in v0.1.",
          '**Schema definitions: prefer full JSON Schema for now.** The flat key-type map (`{ vendor_name: "string" }`) is documented as supported but the server-side normaliser does not translate it yet. Send full JSON Schema with `type: "object"` and `properties`.',
          '**`is_not_empty` filter checks materialized data.** The operator works correctly for documents that have completed extraction and materialization (typically within seconds). For batch-mode documents, materialization occurs after the batch poll cycle applies results.',
        ],
      },
      {
        type: "paragraph",
        text: "The most impactful workaround is always providing a schema. This avoids the auto-discovery 500 and produces more accurate, predictable results. Even a minimal schema with a few key fields is better than no schema at all.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Workaround: always provide a schema",
        code: `// BAD: auto-discovery may return 500 on production
const result = await talonic.extract({
  file_path: './invoice.pdf',
  // no schema — relies on auto-discovery
})

// GOOD: always provide a schema or schema_id
const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema: {
    type: 'object',
    properties: {
      vendor_name: { type: 'string' },
      total_amount: { type: 'number' },
      due_date: { type: 'string', format: 'date' },
    },
  },
})

// ALSO GOOD: use a saved schema_id
const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema_id: 'sch_abc123',
})`,
      },
      {
        type: "paragraph",
        text: "The `is_not_empty` operator now works correctly for all documents that have completed extraction. It checks the materialized values index, which is updated within seconds of extraction completing via the `DOCUMENT_RESOLVED` event.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Using is_not_empty to find documents with populated fields",
        code: `// Find documents where vendor.name has been extracted
const filtered = await talonic.documents.filter({
  conditions: [
    { field: 'vendor.name', operator: 'is_not_empty' },
  ],
})

// Combine with other operators
const filtered2 = await talonic.documents.filter({
  conditions: [
    { field: 'vendor.name', operator: 'is_not_empty' },
    { field: 'total_amount', operator: 'gt', value: 1000 },
  ],
})`,
      },
      {
        type: "code",
        language: "typescript",
        title: "Workaround: use full JSON Schema format",
        code: `// BAD: flat key-type map is not fully normalised server-side
const schema = await talonic.schemas.create({
  name: 'Invoice Schema',
  definition: {
    vendor_name: 'string',
    total_amount: 'number',
  },
})

// GOOD: use full JSON Schema format
const schema = await talonic.schemas.create({
  name: 'Invoice Schema',
  definition: {
    type: 'object',
    properties: {
      vendor_name: { type: 'string', description: 'Legal entity name' },
      total_amount: { type: 'number', description: 'Invoice total in local currency' },
      line_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            quantity: { type: 'number' },
            unit_price: { type: 'number' },
          },
        },
      },
    },
  },
})`,
      },
      {
        type: "paragraph",
        text: "These limitations are server-side, not SDK-side. Upgrading the SDK alone will not resolve them; they will be fixed in API releases. Check the [changelog](https://talonic.com/docs/changelog) for updates on when each issue is resolved. The SDK includes a client-side mitigation for the JSON Schema issue: when you pass a JSON Schema with `properties` but no `required` array, the SDK automatically populates `required` with all property keys to prevent silent empty data.",
      },
      {
        type: "paragraph",
        text: "When encountering unexpected results, use `include_markdown: true` on your `extract()` calls to inspect the raw OCR text alongside the structured output. This helps distinguish between extraction accuracy issues (the engine misreads the text) and schema mapping issues (the engine reads the text correctly but maps it to the wrong field). You can also retrieve the OCR markdown for any previously processed document with `talonic.documents.getMarkdown(id)` without re-running extraction.",
      },
      {
        type: "callout",
        variant: "warning",
        text: "These limitations are tracked and will be resolved in upcoming releases. Always pass a `schema` or `schema_id` to `extract()` for reliable results.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Schemas", slug: "schemas" },
    ],
    faq: [
      {
        question: "Why does extract without a schema return 500?",
        answer:
          "Auto-discovery extraction (no schema) is not yet reliable on production. Always provide a schema or schema_id in v0.1. Even a minimal schema with a few key fields produces better results than auto-discovery.",
      },
      {
        question: "Should I use flat key-type maps or JSON Schema?",
        answer:
          'Use full JSON Schema with type: "object" and properties. The flat key-type map format (e.g. { vendor_name: "string" }) is documented as supported but the server-side normaliser does not translate it correctly yet. The SDK does auto-populate the required array when using JSON Schema with properties, which prevents silent empty data.',
      },
      {
        question: "Are these limitations in the SDK or the API?",
        answer:
          "These are server-side API limitations. Upgrading the SDK alone will not resolve them. Check the changelog for API release updates.",
      },
      {
        question: "How do I debug extraction quality issues?",
        answer:
          "Set include_markdown: true on your extract() call to get the raw OCR text alongside structured output. Compare the markdown to the extracted data to determine whether the issue is OCR accuracy or schema mapping. You can also call talonic.documents.getMarkdown(id) for any previously processed document.",
      },
      {
        question: "How does the is_not_empty filter operator work?",
        answer:
          "The is_not_empty operator checks the materialized values index for a given field. It returns documents where the field has at least one non-null value. Results are available within seconds of extraction completing. For batch-mode documents, materialization occurs after the batch poll cycle applies results.",
      },
    ],
    mentions: ["known issues", "auto-discovery", "JSON Schema", "is_not_empty"],
  },
]
