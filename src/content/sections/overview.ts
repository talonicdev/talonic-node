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
          "Run npm install @talonic/node. Requires Node.js 18+ with zero runtime dependencies.",
      },
      {
        question: "How do I get a Talonic API key?",
        answer:
          "Sign up at app.talonic.com (free tier, no credit card), then go to Settings > API Keys > Create New Key. Keys use the tlnc_ prefix.",
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
        code: `import { Talonic } from "@talonic/node"

const talonic = new Talonic({ apiKey: process.env.TALONIC_API_KEY! })

const result = await talonic.extract({
  file_path: "./invoice.pdf",
  schema: {
    vendor_name: "string",
    invoice_number: "string",
    total_amount: "number",
    due_date: "date",
  },
})

console.log(result.data)
// { vendor_name: "Acme Corp", invoice_number: "INV-2024-0847", total_amount: 14250, due_date: "2024-03-15" }`,
      },
      {
        type: "paragraph",
        text: "The `result` object contains the extracted `data` matching your schema, plus `rateLimit` and `cost` metadata. The `data` fields are typed according to your schema definition, so `total_amount` comes back as a number and `due_date` as a date string.",
      },
      {
        type: "paragraph",
        text: "You can also pass `file_url` for remote files or `file_data` with `filename` for base64-encoded bytes. For documents already uploaded to your workspace, pass `document_id` to skip the upload step entirely.",
      },
      {
        type: "paragraph",
        text: "All **extract()** calls are async and return a `Promise`. The SDK handles retries, timeouts, and error mapping automatically, so you only need a single `try/catch` around your call for error handling.",
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
          "The result includes a data object with fields matching your schema, plus rateLimit (limit, remaining, resetAt) and cost (credits consumed, EUR value, post-call balance) metadata.",
      },
      {
        question: "Can I extract from a URL instead of a local file?",
        answer:
          "Yes. Pass file_url instead of file_path to extract from a remote document. The SDK fetches the file server-side, so you do not need to download it first.",
      },
    ],
    mentions: ["extract", "schema", "TypeScript"],
  },
]
