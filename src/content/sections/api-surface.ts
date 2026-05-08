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
        title: "Extract with inline schema",
        code: `const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema: {
    vendor_name: 'string',
    invoice_number: 'string',
    total_amount: 'number',
    line_items: [{
      description: 'string',
      quantity: 'number',
      unit_price: 'number',
    }],
  },
})

console.log(result.data)
// { vendor_name: 'Acme Corp', total_amount: 1234.56, ... }
console.log(result.extraction_id) // 'ext_abc123'
console.log(result.confidence)    // { overall: 0.95, fields: { vendor_name: 0.99, ... } }`,
      },
      {
        type: "paragraph",
        text: "The method signature is `extract(params: ExtractParams): Promise<WithRateLimit<ExtractResult>>`. The `ExtractParams` interface accepts exactly one file source: `file` (in-memory Blob, Buffer, or Uint8Array), `file_path` (local path read with `fs/promises`), `file_url` (remote URL fetched server-side), or `document_id` (re-extract an existing document). Provide at most one schema source: `schema` (inline object or JSON string) or `schema_id` (UUID of a saved schema). Omit both for auto-discovery, though this is not recommended in production as it may return 500 on some deployments.",
      },
      {
        type: "paragraph",
        text: "Under the hood, **extract()** reads the file from disk (or fetches it from a URL), uploads it as multipart form data, and returns the structured result in a single round-trip. The response includes a `cost` block with credit consumption and a `rateLimit` object parsed from response headers.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Extract from a URL with options",
        code: `const result = await talonic.extract({
  file_url: 'https://example.com/contracts/nda-2025.pdf',
  schema_id: 'sch_def456',
  instructions: 'Focus on termination and non-compete clauses',
  include_markdown: true,
  options: {
    page_range: '1-5',
    language_hint: 'en',
    strict: true,
  },
})

console.log(result.markdown)           // raw OCR text (because include_markdown: true)
console.log(result.document.pages)     // 5
console.log(result.processing?.duration_ms) // 2340`,
      },
      {
        type: "paragraph",
        text: "Additional parameters fine-tune extraction behavior. The `instructions` field accepts natural-language guidance forwarded to the extraction engine. Set `include_markdown: true` to receive the raw OCR-converted markdown alongside structured data. The `options` object supports `page_range` (e.g. `'1-5'` or `'1,3,7-10'` for PDFs), `language_hint` (ISO 639-1 code), `strict` mode (omit fields not in the schema), and `include_raw_text`. The `content_type` parameter lets you override MIME type inference when the file extension is misleading.",
      },
      {
        type: "paragraph",
        text: "For best results, always supply a `schema` or `schema_id` rather than relying on auto-discovery. Inline schemas work well for one-off extractions, while saved schemas (via `schema_id`) keep your extraction definitions consistent across calls and team members.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Extract in-memory bytes",
        code: `import { readFile } from 'node:fs/promises'

// Pass a Buffer or Uint8Array directly
const buffer = await readFile('./scan.tiff')
const result = await talonic.extract({
  file: buffer,
  filename: 'scan.tiff',
  content_type: 'image/tiff',
  schema: {
    patient_name: 'string',
    date_of_service: 'date',
    diagnosis_codes: ['string'],
    total_charges: 'number',
  },
})

// The ExtractResult includes document metadata
console.log(result.document.mime_type)         // 'image/tiff'
console.log(result.document.size_bytes)        // 4521984
console.log(result.document.language_detected) // 'en'`,
      },
      {
        type: "paragraph",
        text: "The `ExtractResult` response is a rich object. The `extraction_id` is a stable identifier you can use with `talonic.extractions.get()` or `talonic.extractions.getData()` to retrieve the result later. The `document` block includes `id`, `filename`, `pages`, `size_bytes`, `mime_type`, `type_detected`, and `language_detected`. The `confidence` block provides `overall` and per-field scores between 0 and 1. The `schema` block shows the source (`'inline'` or `'saved'`), the resolved definition, and a `save_url` for persisting inline schemas. The `links` block provides URLs for the extraction, document, and dashboard views.",
      },
      {
        type: "paragraph",
        text: "The SDK validates parameters before making the API call. Passing zero or more than one file source throws a `TalonicError` with code `missing_file_source` or `multiple_file_sources`. Passing both `schema` and `schema_id` throws `multiple_schemas`. When using JSON Schema format with `properties` but no `required` array, the SDK auto-populates `required` with all property keys to prevent the silent-empty-data footgun where the API returns null for every field.",
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
          "It accepts file_path (local file), file_url (remote URL), file (in-memory Blob, Buffer, or Uint8Array with filename), or document_id (previously uploaded). Provide a schema or schema_id for the extraction definition.",
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
      {
        question: "What does the auto-populate required behavior do?",
        answer:
          "When you pass a JSON Schema with properties but no required array, the SDK automatically adds all property keys to required. This prevents the silent-empty-data issue where the API returns null with confidence 0 for every field you intended to extract.",
      },
      {
        question: "What file formats does extract() support?",
        answer:
          "The SDK supports PDF, PNG, JPG, TIFF, WebP, BMP, GIF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, Markdown, CSV, TSV, JSON, XML, HTML, EML, MSG, and ZIP. MIME types are inferred from the file extension. Use content_type to override when the extension is misleading.",
      },
      {
        question: "How do I include the raw OCR text in the response?",
        answer:
          "Set include_markdown: true in the extract params. The response will include a markdown field containing the full OCR-converted text that the extraction engine used as input. This is useful for debugging extraction quality or building custom post-processing.",
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
        text: "The **documents** resource lets you manage uploaded files in your workspace. Every call to **extract()** creates a document automatically, but you can also list, inspect, re-extract, filter, and delete documents independently.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Core document operations",
        code: `// List documents with cursor-based pagination
const docs = await talonic.documents.list({ limit: 50 })
console.log(docs.data.map(d => d.filename))
console.log(docs.pagination) // { next_cursor: '...', has_more: true }

// Get a single document with full metadata
const doc = await talonic.documents.get('doc_abc123')
console.log(doc.filename)           // 'invoice.pdf'
console.log(doc.status)             // 'completed'
console.log(doc.pages)              // 3
console.log(doc.triage)             // { sensitivity: 'internal', pii_detected: true, ... }

// Get OCR markdown
const md = await talonic.documents.getMarkdown('doc_abc123')
console.log(md.markdown)            // '# Invoice\\n\\nVendor: Acme Corp...'`,
      },
      {
        type: "paragraph",
        text: "The `list()` method accepts `ListDocumentsParams` with filtering by `source_id`, `status` (`'pending'`, `'processing'`, `'completed'`, `'error'`), date range (`after`, `before` as ISO 8601 strings), and full-text `search` across filenames and extracted content. Pagination uses cursor-based navigation: pass `limit` for page size and `cursor` from a previous response's `pagination.next_cursor` to fetch the next page. The legacy `page` and `per_page` parameters are accepted as aliases but cursor-based is the canonical form. Results include a `pagination` object with `next_cursor` and `has_more`.",
      },
      {
        type: "paragraph",
        text: "Use **getMarkdown()** to retrieve the raw OCR output for a document. This is useful for debugging extraction quality or building custom post-processing pipelines on top of the parsed text.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Filter documents by extracted field values",
        code: `// Filter documents using composable conditions on extracted fields
const filtered = await talonic.documents.filter({
  conditions: [
    { field: 'vendor.name', operator: 'eq', value: 'Acme Corp' },
    { field: 'total_amount', operator: 'gt', value: 10000 },
  ],
  sort: { field: 'invoice_date', direction: 'desc' },
  limit: 25,
})

console.log(filtered.total)      // 47
console.log(filtered.documents)  // [{ id: '...', filename: '...', fieldValues: { ... } }, ...]`,
      },
      {
        type: "paragraph",
        text: "The **filter()** method lets you query documents by extracted field values using composable conditions. Each condition specifies a `field` (canonical name like `'vendor.name'`) or `fieldId` (UUID), an `operator` (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `between`, `contains`, `is_empty`, `is_not_empty`), and a `value`. The `between` operator also accepts `valueTo` for range queries. Results include `fieldValues` with the matched field data for each document hit. You can optionally scope results to a specific source connection with `source_connection_id`.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Re-extract and delete",
        code: `// Re-run extraction on an existing document (e.g. after schema update)
const reExtracted = await talonic.documents.reExtract('doc_abc123')
console.log(reExtracted.status)  // 'processing'
console.log(reExtracted.message) // 'Re-extraction started'

// Delete a document and all associated extractions (irreversible)
const deleted = await talonic.documents.delete('doc_abc123')
console.log(deleted.deleted) // true`,
      },
      {
        type: "paragraph",
        text: "The **get()** method returns a `Document` object with full metadata including `triage` classification data when available. The triage block contains `sensitivity` (public, internal, restricted), `department`, `jurisdiction` (ISO country code), `pii_detected`, `pii_categories`, `regulated_data`, and `confidentiality_marking`. The `processing_log` array shows each pipeline step with status, duration, and detail. These fields are populated progressively as the document moves through the processing pipeline.",
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
        answer: "Call talonic.documents.list() with optional parameters like limit, cursor, status, source_id, after, before, and search. Results are paginated using cursor-based navigation.",
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
      {
        question: "How do I filter documents by extracted field values?",
        answer:
          "Use talonic.documents.filter() with an array of conditions. Each condition specifies a field name or fieldId, an operator (eq, gt, contains, between, etc.), and a value. You can combine multiple conditions, add sort order, and paginate with page and limit parameters.",
      },
      {
        question: "What is the triage field on documents?",
        answer:
          "The triage block contains automatic classification output including sensitivity tier, department, jurisdiction, PII detection, regulated data flags, and confidentiality markings. It is populated by the Talonic classification pipeline after document ingestion and may be null for newly uploaded documents.",
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
        title: "List and retrieve extractions",
        code: `// List extractions for a specific document
const extractions = await talonic.extractions.list({
  document_id: 'doc_abc123',
  status: 'complete',
  limit: 10,
})

for (const ext of extractions.data) {
  console.log(\`\${ext.id}: confidence \${ext.confidence_overall}, created \${ext.created_at}\`)
}

// Get full extraction with per-field confidence
const extraction = await talonic.extractions.get('ext_xyz789')
console.log(extraction.data)                    // { vendor_name: 'Acme', total: 1500, ... }
console.log(extraction.confidence?.overall)     // 0.94
console.log(extraction.confidence?.fields)      // { vendor_name: 0.99, total: 0.91, ... }
console.log(extraction.metadata?.processing_time_ms) // 1820`,
      },
      {
        type: "paragraph",
        text: "The `list()` method accepts `ListExtractionsParams` with optional filters for `document_id`, `schema_id`, and `status` (`'complete'`, `'processing'`, `'failed'`). Pagination uses cursor-based navigation with `cursor` and `limit` parameters. The legacy `page` and `per_page` parameters are accepted for compatibility. Each extraction in the list response includes a compact `confidence_overall` number, while the individual `get()` response includes the full `confidence` object with per-field scores.",
      },
      {
        type: "paragraph",
        text: "Use **getData()** to retrieve extraction results as JSON (default) or CSV. The JSON format returns typed objects matching your schema definition, while CSV is convenient for spreadsheet workflows or bulk data exports. The method uses TypeScript overloads: calling with `{ format: 'json' }` or no options returns `WithRateLimit<Record<string, unknown>>`, while `{ format: 'csv' }` returns a plain `string`.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Export extraction data",
        code: `// Get structured data as JSON (default)
const jsonData = await talonic.extractions.getData('ext_xyz789')
console.log(jsonData) // { vendor_name: 'Acme', line_items: [...], total: 1500 }

// Get structured data as CSV for spreadsheet workflows
const csvData = await talonic.extractions.getData('ext_xyz789', { format: 'csv' })
console.log(csvData)
// "vendor_name,total,due_date\\nAcme Corp,1500,2025-03-15"

// Write CSV to file
import { writeFile } from 'node:fs/promises'
await writeFile('./export.csv', csvData)`,
      },
      {
        type: "paragraph",
        text: "The **patch()** method submits field-level corrections back to the extraction. Corrections improve future extraction accuracy for similar documents by feeding the correction loop, so submitting them is worth the effort even if you fix the value downstream. Each correction specifies the `field` name, the corrected `value`, and an optional `reason` string explaining the change. The `propagate` parameter controls scope: `'this_document_only'` (default) applies the correction to this extraction only, while `'all_similar'` propagates it to similar extractions across your workspace.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Submit corrections",
        code: `// Submit field-level corrections to improve future accuracy
await talonic.extractions.patch('ext_xyz789', {
  corrections: [
    {
      field: 'vendor_name',
      value: 'Acme Corporation',
      reason: 'Full legal name required',
    },
    {
      field: 'total_amount',
      value: 14250.00,
      reason: 'OCR misread decimal separator',
    },
  ],
  propagate: 'all_similar', // apply to similar documents too
})`,
      },
      {
        type: "paragraph",
        text: "The `Extraction` interface includes metadata about the extraction run. The `metadata` block provides `pages` (number of pages processed), `language` (detected language code), `document_type` (detected document category), and `processing_time_ms`. The `links` object contains URLs for the extraction resource, related endpoints, and the dashboard view. Use these links to build navigation between the SDK and the Talonic web dashboard.",
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
          'Call talonic.extractions.getData(id, { format: "csv" }) to receive the structured data as a CSV string. The return type is a plain string rather than a WithRateLimit wrapper.',
      },
      {
        question: "What does the patch() method do?",
        answer:
          "It submits field-level corrections to an extraction result. Each correction specifies a field name, corrected value, and optional reason. Corrections are fed back into the extraction engine to improve accuracy for similar documents in future runs. Use the propagate parameter to control whether corrections apply to this document only or all similar documents.",
      },
      {
        question: "Can a document have multiple extractions?",
        answer:
          "Yes. Re-extracting a document with a different schema creates a new extraction record. Use extractions.list({ document_id }) to retrieve all runs for one document.",
      },
      {
        question: "What is the difference between get() and getData()?",
        answer:
          "The get() method returns the full Extraction object including metadata, confidence scores, status, timestamps, and links alongside the extracted data. The getData() method returns just the extracted field values as a plain JSON object or CSV string, without the surrounding metadata. Use get() for inspection and debugging, getData() for data export and downstream processing.",
      },
      {
        question: "How do I filter extractions by status?",
        answer:
          "Pass the status parameter to extractions.list() with one of 'complete', 'processing', or 'failed'. You can combine this with document_id and schema_id filters to narrow results further. Pagination is cursor-based using cursor and limit parameters.",
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
        title: "Create and use a saved schema",
        code: `// Create a reusable schema for invoice extraction
const schema = await talonic.schemas.create({
  name: 'Invoice Schema v2',
  description: 'Standard invoice fields for AP automation',
  definition: {
    type: 'object',
    properties: {
      vendor_name: { type: 'string', description: 'Legal entity name of the vendor' },
      invoice_number: { type: 'string' },
      invoice_date: { type: 'string', format: 'date' },
      due_date: { type: 'string', format: 'date' },
      total_amount: { type: 'number' },
      currency: { type: 'string' },
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
})

console.log(schema.id)        // 'sch_abc123'
console.log(schema.short_id)  // 'SCH-3A4D79D2'
console.log(schema.version)   // 1

// Use the saved schema for extraction
const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema_id: schema.id,
})`,
      },
      {
        type: "paragraph",
        text: "The `create()` method accepts a `CreateSchemaParams` object with `name` (required), `definition` (required, JSON Schema object), and an optional `description`. The returned `Schema` object includes `id` (canonical UUID), `short_id` (human-readable identifier like `'SCH-3A4D79D2'` visible in the dashboard), `version` (starts at 1, bumps on each update), `field_count`, `extraction_count`, and `links` with URLs for the schema, its extractions, and the dashboard view. Both `id` and `short_id` are accepted as lookup keys on `get()`, `update()`, and `delete()`.",
      },
      {
        type: "paragraph",
        text: "Schema definitions follow JSON Schema format with `type: \"object\"` and `properties`. Each property specifies a field name and type that the extraction engine will resolve. Updating a schema does not retroactively change existing extractions, but all future **extract()** calls using that `schema_id` will pick up the new definition. The `version` field is bumped automatically on each update so you can track which version a given extraction used.",
      },
      {
        type: "code",
        language: "typescript",
        title: "List, update, and delete schemas",
        code: `// List all schemas in the workspace
const schemas = await talonic.schemas.list()
for (const s of schemas.data) {
  console.log(\`\${s.name} (v\${s.version}): \${s.field_count} fields, \${s.extraction_count} extractions\`)
}

// Update a schema definition (bumps version, does not change existing extractions)
const updated = await talonic.schemas.update('sch_abc123', {
  name: 'Invoice Schema v3',
  definition: {
    type: 'object',
    properties: {
      vendor_name: { type: 'string' },
      invoice_number: { type: 'string' },
      total_amount: { type: 'number' },
      tax_amount: { type: 'number' },  // new field
      payment_terms: { type: 'string' }, // new field
    },
  },
})
console.log(updated.version) // 2

// Delete a schema (existing extractions are retained)
const deleted = await talonic.schemas.delete('sch_abc123')
console.log(deleted.deleted) // true`,
      },
      {
        type: "paragraph",
        text: "Saved schemas are workspace-scoped, so every team member with API access can reference the same `schema_id`. This makes schemas the right tool for standardising extraction output across a pipeline or team. The `update()` method uses HTTP PUT and replaces the entire schema definition. Pass all fields you want to keep, not just the changes. The `delete()` method removes the schema but retains all existing extractions that used it, so historical data is preserved.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Retrieve a schema by ID",
        code: `// Get a schema by canonical UUID or short_id
const schema = await talonic.schemas.get('sch_abc123')
// or: await talonic.schemas.get('SCH-3A4D79D2')

console.log(schema.name)         // 'Invoice Schema v2'
console.log(schema.definition)   // { type: 'object', properties: { ... } }
console.log(schema.created_at)   // '2025-06-01T10:30:00.000Z'
console.log(schema.updated_at)   // '2025-06-15T14:22:00.000Z'
console.log(schema.links)        // { self: '...', extractions: '...', dashboard: '...' }`,
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
          "Call talonic.schemas.create({ name, definition }) with a JSON Schema definition. The returned object includes id and short_id. Use either as schema_id in future extract calls.",
      },
      {
        question: "Are schemas shared across team members?",
        answer:
          "Yes. Schemas are workspace-scoped. Anyone with API access to the workspace can reference the same schema_id in their extract calls.",
      },
      {
        question: "Does updating a schema change existing extractions?",
        answer:
          "No. Updating a schema bumps the version number and only affects future extract calls that reference that schema_id. Existing extraction results remain unchanged and retain their original schema version.",
      },
      {
        question: "What happens to extractions when I delete a schema?",
        answer:
          "Existing extractions are retained when you delete a schema. The extraction data remains accessible via the extractions resource. Only the schema definition itself is removed, so you can no longer use that schema_id for new extractions.",
      },
      {
        question: "Can I look up a schema by its short_id?",
        answer:
          "Yes. Both the canonical UUID (id) and the human-readable short_id (e.g. 'SCH-3A4D79D2') are accepted as lookup keys on get(), update(), and delete(). The short_id is displayed in the Talonic dashboard for easy reference.",
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
        title: "Create and monitor a batch job",
        code: `// Create a batch extraction job
const job = await talonic.jobs.create({
  schema_id: 'sch_abc123',
  document_ids: ['doc_001', 'doc_002', 'doc_003', 'doc_004', 'doc_005'],
  name: 'Q4 Invoice Batch',
})

console.log(job.id)     // 'job_xyz789'
console.log(job.status) // 'queued'

// Poll for completion
let current = await talonic.jobs.get(job.id)
while (current.status === 'queued' || current.status === 'processing') {
  console.log(\`Progress: \${current.completed_documents}/\${current.total_documents} (\${current.current_phase})\`)
  await new Promise(r => setTimeout(r, 5000))
  current = await talonic.jobs.get(job.id)
}

console.log(\`Job \${current.status}: \${current.completed_documents} completed, \${current.failed_documents} failed\`)`,
      },
      {
        type: "paragraph",
        text: "The `create()` method accepts `CreateJobParams` with `schema_id` (required), optional `document_ids` (array of document UUIDs to process), and optional `name` (human-readable label). When `document_ids` is omitted, the job processes all unprocessed documents in the workspace. The returned `Job` object includes `id`, `status`, `progress`, `total_documents`, `completed_documents`, `failed_documents`, `current_phase`, `estimated_completion`, and `links` with URLs for the job and its results.",
      },
      {
        type: "paragraph",
        text: "Jobs run server-side and process documents in parallel. Use **get()** to poll the job status (`'queued'`, `'processing'`, `'completed'`, `'failed'`, `'cancelled'`) and **getResults()** to retrieve the extraction output once complete. For long-running batches, poll on a reasonable interval such as every 5 seconds. The `grid_stats` block on the job object provides `total_cells`, `filled`, `empty`, and `fill_rate` for monitoring extraction quality across the batch.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Retrieve batch results",
        code: `// Get structured results from a completed job
const results = await talonic.jobs.getResults('job_xyz789')

for (const row of results.data) {
  console.log(\`\${row.document_filename}: \${JSON.stringify(row.values)}\`)
}
// invoice_001.pdf: { vendor_name: 'Acme', total: 1500, ... }
// invoice_002.pdf: { vendor_name: 'Globex', total: 3200, ... }

// Export to CSV or send to your database
const rows = results.data.map(r => ({
  filename: r.document_filename,
  document_id: r.document_id,
  ...r.values,
}))`,
      },
      {
        type: "paragraph",
        text: "Use **cancel()** to abort a job that is still in progress. Cancelled jobs stop processing remaining documents but any extractions already completed are preserved and accessible via **getResults()**. The `cancelled_at` timestamp is set on the job object when cancellation takes effect.",
      },
      {
        type: "code",
        language: "typescript",
        title: "List and cancel jobs",
        code: `// List jobs filtered by status
const runningJobs = await talonic.jobs.list({ status: 'processing', limit: 10 })
for (const j of runningJobs.data) {
  console.log(\`\${j.id}: \${j.completed_documents}/\${j.total_documents} (est. \${j.estimated_completion})\`)
}

// Cancel a job — partial results are retained
const cancelled = await talonic.jobs.cancel('job_xyz789')
console.log(cancelled.status)        // 'cancelled'
console.log(cancelled.cancelled_at)  // '2025-06-15T14:30:00.000Z'

// Retrieve whatever completed before cancellation
const partial = await talonic.jobs.getResults('job_xyz789')
console.log(\`Retrieved \${partial.data.length} results before cancellation\`)`,
      },
      {
        type: "paragraph",
        text: "The `list()` method accepts `ListJobsParams` with optional `status` filter, cursor-based pagination (`cursor` and `limit`), and `order` for sorting. The `JobResults` response contains a `data` array where each entry has `document_id`, `document_filename`, and `values` (the extracted field data). This flat structure makes it straightforward to aggregate results across documents for reporting or database insertion.",
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
          "Call talonic.jobs.create({ schema_id, document_ids }) to start an async batch job, then poll with talonic.jobs.get(id) or retrieve results with talonic.jobs.getResults(id). Omit document_ids to process all unprocessed documents in the workspace.",
      },
      {
        question: "Can I use an inline schema with jobs?",
        answer:
          "No. Jobs require a saved schema_id. Create your schema first with talonic.schemas.create(), then pass the returned ID to talonic.jobs.create().",
      },
      {
        question: "What happens to completed extractions if I cancel a job?",
        answer:
          "Extractions already completed before cancellation are preserved. You can still retrieve them with talonic.jobs.getResults(id). The job status changes to 'cancelled' and the cancelled_at timestamp is set.",
      },
      {
        question: "How do I monitor batch job progress?",
        answer:
          "Poll talonic.jobs.get(id) on a regular interval (e.g. every 5 seconds). The Job object includes completed_documents, total_documents, failed_documents, current_phase, progress, estimated_completion, and grid_stats with fill_rate for quality monitoring.",
      },
      {
        question: "What job statuses are available for filtering?",
        answer:
          "Jobs can be in one of five statuses: 'queued' (waiting to start), 'processing' (actively extracting), 'completed' (all documents processed), 'failed' (terminal error), or 'cancelled' (manually stopped). Use the status parameter on list() to filter.",
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
        title: "Check workspace balance",
        code: `// Get the enriched workspace balance
const balance = await talonic.credits.getBalance()

console.log(balance.balance_credits)        // 1888
console.log(balance.balance_eur)            // 9.44
console.log(balance.burn_rate_30d_credits)  // 360
console.log(balance.projected_runway_days)  // 157 (-1 means no consumption)
console.log(balance.tier)                   // 'pro'
console.log(balance.tier_resets_at)         // '2026-06-01T00:00:00.000Z'`,
      },
      {
        type: "paragraph",
        text: "The `getBalance()` method returns an `EnhancedBalance` object wrapped with `WithRateLimit` metadata. The `balance_credits` field is the raw credit count, while `balance_eur` converts credits to EUR using the workspace's configured rate (rounded to two decimals). The `burn_rate_30d_credits` is the total credits consumed in the trailing 30 days, and `projected_runway_days` extrapolates how many days remain at that burn rate. The API computes these values fresh on every call, so results are always current.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Budget-aware batch processing",
        code: `// Check budget before starting a batch job
const balance = await talonic.credits.getBalance()
const estimatedCost = documentIds.length * 12 // ~12 credits per extraction

if (balance.balance_credits < estimatedCost) {
  console.warn(\`Insufficient credits: \${balance.balance_credits} available, ~\${estimatedCost} needed\`)
  console.warn(\`Tier resets at \${balance.tier_resets_at}\`)
  process.exit(1)
}

// Run the batch and track spend
const job = await talonic.jobs.create({ schema_id, document_ids: documentIds })
console.log(\`Batch started. Pre-batch balance: \${balance.balance_credits} credits\`)

// After batch completes, check remaining balance
const postBatch = await talonic.credits.getBalance()
const spent = balance.balance_credits - postBatch.balance_credits
console.log(\`Batch complete. Spent \${spent} credits, \${postBatch.balance_credits} remaining\`)`,
      },
      {
        type: "code",
        language: "typescript",
        title: "Track per-call costs on extract responses",
        code: `// Every extract response includes cost metadata
const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema_id: 'sch_abc123',
})

if (result.cost) {
  console.log(\`Cost: \${result.cost.costCredits} credits (\${result.cost.costEur} EUR)\`)
  console.log(\`Balance after: \${result.cost.balanceCredits} credits\`)
  console.log(\`Registry cells: \${result.cost.cellsResolvedRegistry} (cheap path)\`)
  console.log(\`AI cells: \${result.cost.cellsResolvedAi} (priced path)\`)
}

// cost is null on non-extract endpoints (documents.list, schemas.get, etc.)
const docs = await talonic.documents.list()
console.log(docs.cost) // null`,
      },
      {
        type: "paragraph",
        text: "The `cost` block on extract responses provides granular consumption data. The `cellsResolvedRegistry` count represents fields resolved from the materialized field registry (the cheap path), while `cellsResolvedAi` counts fields resolved by AI extraction (the priced path). Understanding this split helps optimize schemas: fields that frequently resolve from the registry cost less, so reusing consistent field names across schemas reduces your per-extraction spend over time.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Low-balance alerting",
        code: `// Set up a runway alert
const balance = await talonic.credits.getBalance()

if (balance.projected_runway_days >= 0 && balance.projected_runway_days < 7) {
  console.warn(
    \`WARNING: Only \${balance.projected_runway_days} days of runway remaining \` +
    \`at current burn rate (\${balance.burn_rate_30d_credits} credits/30d)\`
  )
}

if (balance.projected_runway_days === -1) {
  console.log('No consumption in the trailing 30 days — runway cannot be projected')
}`,
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
          "Call talonic.credits.getBalance(). It returns balance_credits, balance_eur, burn_rate_30d_credits, projected_runway_days, tier, and tier_resets_at. Read-only and safe to call at any time without consuming credits.",
      },
      {
        question: "What is the cost field on extract responses?",
        answer:
          "Every extract response carries a cost block parsed from the X-Talonic-Cost-* and X-Talonic-Balance-* response headers. Fields: costCredits, costEur, balanceCredits, cellsResolvedRegistry, cellsResolvedAi. Null on calls that did not run through extract (e.g. documents.list, schemas.get).",
      },
      {
        question: "What does projected_runway_days = -1 mean?",
        answer:
          "It means the workspace has had zero credit consumption in the trailing 30 days, so a meaningful runway projection cannot be computed. Treat -1 as 'unknown' rather than '0 days'.",
      },
      {
        question: "What is the difference between cellsResolvedRegistry and cellsResolvedAi?",
        answer:
          "cellsResolvedRegistry counts fields resolved from the materialized field registry, which is the cheap path. cellsResolvedAi counts fields resolved by AI extraction, which is the priced path. Reusing consistent field names across schemas increases registry hits and reduces per-extraction cost over time.",
      },
      {
        question: "Are credits shared across all API keys in a workspace?",
        answer:
          "Yes. Credits are workspace-scoped and shared across all API keys. The balance returned by getBalance() reflects the total workspace balance, not a per-key allocation. The tier and tier_resets_at fields indicate when the monthly credit allocation refreshes.",
      },
    ],
    mentions: ["credits", "balance", "EUR", "burn rate", "runway", "tier", "cost", "budget"],
  },
]
