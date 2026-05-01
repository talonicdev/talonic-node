import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'extract',
    parentSlug: 'api-surface',
    title: 'Extract',
    seoTitle: 'Extract Method — Talonic Node SDK',
    description: 'Top-level extract method: send a document and schema, receive structured validated data with confidence scores.',
    content: [
      { type: 'paragraph', text: 'The top-level `extract()` method is the primary entry point. Send a document and schema, receive structured validated data.' },
      { type: 'code', language: 'typescript', code: `await talonic.extract({
  file_path: "./invoice.pdf",
  schema: {
    vendor_name: "string",
    total_amount: "number",
  },
})` },
      { type: 'paragraph', text: 'Accepts `file_path` (local file), `file_url` (remote URL), `file_data` + `filename` (base64 bytes), or `document_id` (previously uploaded). Provide a `schema` (inline definition) or `schema_id` (saved schema UUID).' },
    ],
    related: [
      { label: 'Schemas', slug: 'schemas' },
      { label: 'Documents', slug: 'documents' },
    ],
    faq: [
      { question: 'What inputs does talonic.extract() accept?', answer: 'It accepts file_path (local file), file_url (remote URL), file_data + filename (base64), or document_id (previously uploaded). Provide a schema or schema_id.' },
    ],
    mentions: ['extract', 'schema', 'file_path', 'file_url', 'document_id'],
  },
  {
    slug: 'documents',
    parentSlug: 'api-surface',
    title: 'Documents',
    seoTitle: 'Documents API — Talonic Node SDK',
    description: 'List, retrieve, get markdown, re-extract, and delete documents in your Talonic workspace.',
    content: [
      { type: 'code', language: 'typescript', code: `// List documents
await talonic.documents.list({ per_page: 50 })

// Get a single document
await talonic.documents.get(id)

// Get OCR markdown
await talonic.documents.getMarkdown(id)

// Re-extract with a new schema
await talonic.documents.reExtract(id)

// Delete
await talonic.documents.delete(id)` },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Extractions', slug: 'extractions' },
    ],
    faq: [
      { question: 'How do I list documents with the Talonic SDK?', answer: 'Call talonic.documents.list() with optional pagination parameters like per_page.' },
    ],
    mentions: ['documents', 'list', 'get', 'delete', 'markdown'],
  },
  {
    slug: 'extractions',
    parentSlug: 'api-surface',
    title: 'Extractions',
    seoTitle: 'Extractions API — Talonic Node SDK',
    description: 'Query extraction results, retrieve structured data in JSON or CSV, and submit field corrections.',
    content: [
      { type: 'code', language: 'typescript', code: `// List extractions for a document
await talonic.extractions.list({ document_id })

// Get extraction metadata
await talonic.extractions.get(id)

// Get structured data (JSON)
await talonic.extractions.getData(id)

// Get structured data (CSV)
await talonic.extractions.getData(id, { format: "csv" })

// Submit corrections
await talonic.extractions.patch(id, { corrections: [...] })` },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Documents', slug: 'documents' },
    ],
    faq: [
      { question: 'How do I get extraction data as CSV?', answer: 'Call talonic.extractions.getData(id, { format: "csv" }) to receive the structured data as a CSV string.' },
    ],
    mentions: ['extractions', 'getData', 'corrections', 'CSV', 'JSON'],
  },
  {
    slug: 'schemas',
    parentSlug: 'api-surface',
    title: 'Schemas',
    seoTitle: 'Schemas API — Talonic Node SDK',
    description: 'Create, update, and manage reusable extraction schemas for consistent document structuring.',
    content: [
      { type: 'code', language: 'typescript', code: `// List all schemas
await talonic.schemas.list()

// Get a schema
await talonic.schemas.get(id)

// Create a new schema
await talonic.schemas.create({ name, definition })

// Update
await talonic.schemas.update(id, { ... })

// Delete
await talonic.schemas.delete(id)` },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Known Issues', slug: 'current-limitations' },
    ],
    faq: [
      { question: 'How do I create a reusable schema?', answer: 'Call talonic.schemas.create({ name, definition }) with a JSON Schema definition. Use the returned schema_id in future extract calls.' },
    ],
    mentions: ['schemas', 'JSON Schema', 'create', 'update'],
  },
  {
    slug: 'jobs',
    parentSlug: 'api-surface',
    title: 'Jobs',
    seoTitle: 'Jobs API — Talonic Node SDK',
    description: 'Create and track asynchronous batch extraction jobs across multiple documents.',
    content: [
      { type: 'code', language: 'typescript', code: `// Create a batch job
await talonic.jobs.create({ schema_id, document_ids })

// List jobs
await talonic.jobs.list()

// Get job status
await talonic.jobs.get(id)

// Get results
await talonic.jobs.getResults(id)

// Cancel
await talonic.jobs.cancel(id)` },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Schemas', slug: 'schemas' },
    ],
    faq: [
      { question: 'How do I run batch extraction with the Talonic SDK?', answer: 'Call talonic.jobs.create({ schema_id, document_ids }) to start an async batch job, then poll with talonic.jobs.get(id) or retrieve results with talonic.jobs.getResults(id).' },
    ],
    mentions: ['jobs', 'batch', 'async'],
  },
];
