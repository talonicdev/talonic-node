import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "introduction",
    parentSlug: "overview",
    title: "Introduction",
    seoTitle: "Node SDK Introduction — Talonic Docs",
    description:
      "Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.",
    content: [
      {
        type: "paragraph",
        text: "Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.",
      },
      {
        type: "paragraph",
        text: "The SDK wraps the [Talonic REST API](https://talonic.com/docs/api) with a typed client, automatic retries, structured errors, and a CLI. Zero runtime dependencies.",
      },
      {
        type: "paragraph",
        text: "The client exposes resource objects for every API namespace: **documents**, **extractions**, **schemas**, **jobs**, **fields**, and **credits**. Each resource provides typed methods that return structured responses with rate-limit and cost metadata attached.",
      },
      {
        type: "paragraph",
        text: "Every HTTP call goes through a shared transport layer that handles authentication, retries with exponential backoff, timeout enforcement, and error mapping. You configure these behaviors once in the constructor and every method call inherits them.",
      },
      {
        type: "paragraph",
        text: "The top-level `extract()` method is the fastest path from document to structured data. Pass a local file path, a remote URL, in-memory bytes, or a previously uploaded `document_id` alongside an inline schema or a saved `schema_id`. The SDK reads the file, uploads it as multipart form data, and returns typed JSON in a single await. Every response also carries `rateLimit` and `cost` metadata parsed from response headers, so you can build budget-aware pipelines without extra API calls.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Create a client and extract",
        code: `import { Talonic } from '@talonic/node'

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

// Extract structured data from a local PDF
const result = await talonic.extract({
  file_path: './contract.pdf',
  schema: {
    parties: [{ name: 'string', role: 'string' }],
    effective_date: 'date',
    termination_clause: 'string',
    governing_law: 'string',
  },
})

console.log(result.data)
// { parties: [{ name: 'Acme Corp', role: 'Licensor' }, ...], effective_date: '2025-01-15', ... }
console.log(result.cost)
// { costCredits: 8, costEur: 0.04, balanceCredits: 1892, ... }`,
      },
      {
        type: "paragraph",
        text: "Beyond extraction, the SDK provides full CRUD access to your workspace. Use `talonic.documents` to list, inspect, re-extract, filter, and delete uploaded files. Use `talonic.schemas` to create and manage reusable extraction definitions that keep your output consistent across calls and team members. Use `talonic.jobs` for asynchronous batch extraction across many documents, and `talonic.credits.getBalance()` to monitor your workspace credit balance, burn rate, and projected runway.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Explore your workspace",
        code: `// List all documents in your workspace
const docs = await talonic.documents.list({ limit: 10 })
console.log(docs.data.map(d => d.filename))

// Search across documents, fields, sources, and schemas
const hits = await talonic.search('indemnification clause')
console.log(hits.documents)
console.log(hits.fieldMatches)

// Check your credit balance
const balance = await talonic.credits.getBalance()
console.log(\`\${balance.balance_credits} credits remaining (\${balance.projected_runway_days} days runway)\`)`,
      },
      {
        type: "paragraph",
        text: "The SDK ships both ESM and CJS builds with full TypeScript declarations, so it integrates cleanly into any modern Node.js project. Every error is a typed `TalonicError` subclass with `status`, `code`, and `requestId` properties, making it straightforward to handle failures in a structured way. The global `search()` method lets you query across documents, fields, sources, and schemas in a single call, useful for building search interfaces or validating that data exists before running an extraction.",
      },
      {
        type: "callout",
        text: "**Looking for the AI agent path?** [`@talonic/mcp`](https://talonic.com/docs/mcp) wraps this SDK as a Model Context Protocol server. Install it into Claude Desktop, Cursor, Cline, Continue, or Cowork and any MCP-aware agent can extract documents directly.",
      },
    ],
    related: [
      { label: "Install", slug: "install" },
      { label: "Quick Start", slug: "quickstart" },
      { label: "MCP Server", slug: "mcp-introduction" },
    ],
    faq: [
      {
        question: "What is @talonic/node?",
        answer:
          "The official Talonic SDK for Node.js and TypeScript. It extracts structured, schema-validated data from any document with a typed client, automatic retries, and structured errors.",
      },
      {
        question: "Does the Talonic SDK have dependencies?",
        answer: "No. @talonic/node has zero runtime dependencies and requires Node.js 18 or newer.",
      },
      {
        question: "What resources does the SDK expose?",
        answer:
          "The client exposes documents, extractions, schemas, jobs, fields, and credits as typed resource objects. Each provides methods that map to the corresponding REST API endpoints.",
      },
      {
        question: "What file formats does the Talonic SDK support?",
        answer:
          "The SDK supports PDF, PNG, JPG, TIFF, WebP, BMP, GIF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, Markdown, CSV, TSV, JSON, XML, HTML, EML, MSG, and ZIP files. MIME types are inferred from the file extension, or you can set content_type explicitly.",
      },
      {
        question: "Does the SDK include a search method?",
        answer:
          "Yes. The top-level talonic.search() method runs a global omnisearch across documents, fields, sources, and schemas. It returns categorized hits for each entity type and accepts an optional limit parameter to control results per type.",
      },
      {
        question: "How does the SDK handle rate limiting and costs?",
        answer:
          "Every response includes rateLimit metadata (limit, remaining, resetAt) parsed from X-RateLimit-* headers. Extract responses also carry cost metadata (costCredits, costEur, balanceCredits) parsed from X-Talonic-Cost-* headers. The SDK retries 429 rate-limit responses automatically, respecting the server-provided reset timestamp.",
      },
    ],
    mentions: ["Node.js", "TypeScript", "SDK", "document extraction"],
  },
  {
    slug: "install",
    parentSlug: "overview",
    title: "Install",
    seoTitle: "Install @talonic/node — Talonic Docs",
    description:
      "Install the official Talonic Node.js SDK via npm. Requires Node.js 18 or newer with zero runtime dependencies.",
    content: [
      { type: "code", language: "bash", code: "npm install @talonic/node" },
      { type: "paragraph", text: "Requires Node.js 18 or newer. Zero runtime dependencies." },
      {
        type: "paragraph",
        text: "The package works with npm, yarn, pnpm, and bun. It ships ESM and CJS builds with full TypeScript declarations, so it integrates cleanly into any modern Node.js project without additional configuration.",
      },
      {
        type: "paragraph",
        text: "The SDK relies on the built-in `fetch` available in Node.js 18+. If you are running an older Node.js version, pass a fetch polyfill (such as `node-fetch`) via the `fetch` constructor option.",
      },
      {
        type: "code",
        language: "bash",
        title: "Install with other package managers",
        code: `# yarn
yarn add @talonic/node

# pnpm
pnpm add @talonic/node

# bun
bun add @talonic/node`,
      },
      {
        type: "paragraph",
        text: "After installation the `talonic` CLI binary is available in your project. Run `npx talonic --help` to verify the install. The CLI mirrors the SDK's resource structure, so you can test your API key from the terminal before writing any code. If you installed globally with `npm install -g @talonic/node`, the `talonic` command is available directly without `npx`.",
      },
      { type: "heading", level: 3, id: "get-api-key", text: "Get an API key (30 seconds)" },
      {
        type: "paragraph",
        text: "Every user runs against their own Talonic workspace. Your documents and schemas are private to you.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Sign up at [app.talonic.com](https://app.talonic.com). Free tier: 50 extractions per day, no credit card.",
          "Settings → API Keys → Create New Key.",
          "Copy the `tlnc_` value.",
          "Set it as the `TALONIC_API_KEY` environment variable, or pass it directly to the client constructor.",
        ],
      },
      {
        type: "code",
        language: "typescript",
        title: "Verify your installation",
        code: `import { Talonic } from '@talonic/node'

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

// Quick smoke test: check your credit balance
const balance = await talonic.credits.getBalance()
console.log(\`Connected! Balance: \${balance.balance_credits} credits (\${balance.tier} tier)\`)`,
      },
      {
        type: "paragraph",
        text: "The constructor validates that the `apiKey` is a non-empty string and that a `fetch` implementation is available. It throws a `TypeError` immediately if either check fails, so you will catch configuration problems at startup rather than on the first API call. The SDK does not validate the `tlnc_` prefix or contact the server during construction; authentication errors surface on the first actual request as a `TalonicAuthError` with status 401 or 403.",
      },
      {
        type: "code",
        language: "bash",
        title: "Verify from the terminal",
        code: `# Set your API key
export TALONIC_API_KEY=tlnc_your_key_here

# Test the connection
npx talonic credits balance
# { "balance_credits": 1888, "tier": "pro", ... }`,
      },
      {
        type: "callout",
        text: "Store your API key in an environment variable or secrets manager. Never commit `tlnc_` values to version control.",
      },
    ],
    related: [
      { label: "Quick Start", slug: "quickstart" },
      { label: "Client Options", slug: "client-options" },
    ],
    faq: [
      {
        question: "How do I install the Talonic SDK?",
        answer:
          "Run npm install @talonic/node. Requires Node.js 18+ with zero runtime dependencies. Also works with yarn, pnpm, and bun.",
      },
      {
        question: "How do I get a Talonic API key?",
        answer:
          "Sign up at app.talonic.com (free tier, no credit card), then go to Settings > API Keys > Create New Key. Keys use the tlnc_ prefix.",
      },
      {
        question: "Does the SDK ship ESM and CJS builds?",
        answer:
          "Yes. The package includes both ESM and CJS builds with full TypeScript declarations. It integrates into any modern Node.js project without additional bundler configuration, and the types are auto-discovered by TypeScript without manual setup.",
      },
      {
        question: "How do I verify my installation is working?",
        answer:
          "After installing, create a Talonic client with your API key and call talonic.credits.getBalance(). If the call succeeds and returns your balance, the SDK is correctly installed and your key is valid. You can also run npx talonic credits balance from the terminal.",
      },
    ],
    mentions: ["npm", "API key", "Node.js 18"],
  },
  {
    slug: "quickstart",
    parentSlug: "overview",
    title: "Quick Start",
    seoTitle: "Quick Start — Talonic Node SDK",
    description:
      "Extract structured data from a document in 5 lines of TypeScript using the Talonic SDK.",
    content: [
      {
        type: "paragraph",
        text: "Extract structured data from a document in five lines. Create a client, call **extract()** with a file and schema, and read the typed result.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Extract an invoice",
        code: `import { Talonic } from '@talonic/node'

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

const result = await talonic.extract({
  file_path: './invoice.pdf',
  schema: {
    vendor_name: 'string',
    invoice_number: 'string',
    total_amount: 'number',
    due_date: 'date',
  },
})

console.log(result.data)
// { vendor_name: 'Acme Corp', invoice_number: 'INV-2024-0847', total_amount: 14250, due_date: '2024-03-15' }`,
      },
      {
        type: "paragraph",
        text: "The `result` object contains the extracted `data` matching your schema, plus `rateLimit` and `cost` metadata. The `data` fields are typed according to your schema definition, so `total_amount` comes back as a number and `due_date` as a date string.",
      },
      {
        type: "paragraph",
        text: "You can also pass `file_url` for remote files or `file` with `filename` for in-memory bytes (Blob, Buffer, or Uint8Array). For documents already uploaded to your workspace, pass `document_id` to skip the upload step entirely. The SDK accepts exactly one file source per call and validates this at runtime, throwing a `TalonicError` with code `missing_file_source` or `multiple_file_sources` if the constraint is violated.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Extract from a URL",
        code: `// Extract from a remote file — no local download needed
const result = await talonic.extract({
  file_url: 'https://example.com/reports/q4-2025.pdf',
  schema: {
    report_title: 'string',
    period: 'string',
    revenue: 'number',
    net_income: 'number',
    highlights: ['string'],
  },
})

console.log(result.data.revenue)       // 4250000
console.log(result.confidence?.overall) // 0.94
console.log(result.document.pages)      // 12`,
      },
      {
        type: "paragraph",
        text: "All **extract()** calls are async and return a `Promise`. The SDK handles retries, timeouts, and error mapping automatically, so you only need a single `try/catch` around your call for error handling. Retryable failures (429, 5xx, network errors, timeouts) are retried up to `maxRetries` times with exponential backoff, so transient hiccups do not require manual retry logic.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Extract with error handling",
        code: `import { Talonic, TalonicAuthError, TalonicValidationError, TalonicError } from '@talonic/node'

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

try {
  const result = await talonic.extract({
    file_path: './receipt.png',
    schema: {
      merchant: 'string',
      date: 'date',
      total: 'number',
      items: [{ name: 'string', price: 'number' }],
    },
  })
  console.log(\`Extracted \${result.data.items?.length ?? 0} line items from \${result.document.filename}\`)
  console.log(\`Cost: \${result.cost?.costCredits} credits, balance: \${result.cost?.balanceCredits}\`)
} catch (err) {
  if (err instanceof TalonicAuthError) {
    console.error('Invalid API key — check TALONIC_API_KEY')
  } else if (err instanceof TalonicValidationError) {
    console.error(\`Bad request: \${err.message} (code: \${err.code})\`)
  } else if (err instanceof TalonicError) {
    console.error(\`Talonic error: \${err.code} (status \${err.status}, request \${err.requestId})\`)
  }
}`,
      },
      {
        type: "paragraph",
        text: "The `extract()` response includes rich metadata beyond the extracted data. The `document` block contains the filename, page count, file size, detected MIME type, and detected language. The optional `confidence` block provides an overall confidence score and per-field scores. The `processing` block reports duration, pages processed, and the region that handled the request. Use these fields to build quality gates and observability into your extraction pipeline.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Re-extract a previously uploaded document with a saved schema",
        code: `// Use document_id + schema_id to re-extract without re-uploading
const result = await talonic.extract({
  document_id: 'doc_abc123',
  schema_id: 'sch_def456',
  instructions: 'Focus on the indemnification and liability sections',
  include_markdown: true,
})

console.log(result.data)       // structured extraction
console.log(result.markdown)   // raw OCR markdown (when include_markdown is true)
console.log(result.schema)     // { source: 'saved', id: 'sch_def456', definition: { ... } }`,
      },
      {
        type: "callout",
        text: "This example uses top-level `await`. If your environment does not support it, wrap the code in an `async` function.",
      },
    ],
    related: [
      { label: "Extract", slug: "extract" },
      { label: "Schemas", slug: "schemas" },
    ],
    faq: [
      {
        question: "How do I extract data from a PDF with the Talonic SDK?",
        answer:
          "Import Talonic, create a client with your API key, and call talonic.extract() with a file path and schema. The result contains structured, schema-validated JSON.",
      },
      {
        question: "What does the extract result contain?",
        answer:
          "The result includes a data object with fields matching your schema, plus rateLimit (limit, remaining, resetAt) and cost (credits consumed, EUR value, post-call balance) metadata. It also contains document metadata (filename, pages, size_bytes, mime_type), optional confidence scores (overall and per-field), and processing info (duration_ms, region).",
      },
      {
        question: "Can I extract from a URL instead of a local file?",
        answer:
          "Yes. Pass file_url instead of file_path to extract from a remote document. The SDK fetches the file server-side, so you do not need to download it first.",
      },
      {
        question: "Can I pass natural-language instructions to guide extraction?",
        answer:
          "Yes. The extract() method accepts an optional instructions parameter where you can provide natural-language guidance like 'Focus on the indemnification section' or 'Extract amounts in USD only'. Instructions are forwarded to the extraction engine alongside the schema to improve accuracy for ambiguous documents.",
      },
      {
        question: "How do I extract only specific pages from a PDF?",
        answer:
          "Pass the options.page_range parameter with a page specification like '1-5' or '1,3,7-10'. This tells the extraction engine to process only those pages, which reduces processing time and credit consumption for large documents.",
      },
      {
        question: "What happens if I pass both schema and schema_id?",
        answer:
          "The SDK throws a TalonicError with code 'multiple_schemas' immediately, before making any API call. You must provide at most one schema source: either an inline schema object or a schema_id referencing a saved schema.",
      },
    ],
    mentions: ["extract", "schema", "TypeScript"],
  },
]
