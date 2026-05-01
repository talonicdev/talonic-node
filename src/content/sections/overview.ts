import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'introduction',
    parentSlug: 'overview',
    title: 'Introduction',
    seoTitle: 'Node SDK Introduction — Talonic Docs',
    description: 'Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.',
    content: [
      { type: 'paragraph', text: 'Official Talonic SDK for Node.js and TypeScript. Extract structured, schema-validated data from any document.' },
      { type: 'paragraph', text: 'The SDK wraps the [Talonic REST API](https://talonic.com/docs/api) with a typed client, automatic retries, structured errors, and a CLI. Zero runtime dependencies.' },
      { type: 'callout', text: '**Looking for the AI agent path?** [`@talonic/mcp`](https://talonic.com/docs/mcp) wraps this SDK as a Model Context Protocol server. Install it into Claude Desktop, Cursor, Cline, Continue, or Cowork and any MCP-aware agent can extract documents directly.' },
    ],
    related: [
      { label: 'Install', slug: 'install' },
      { label: 'Quick Start', slug: 'quickstart' },
      { label: 'MCP Server', slug: 'mcp-introduction' },
    ],
    faq: [
      { question: 'What is @talonic/node?', answer: 'The official Talonic SDK for Node.js and TypeScript. It extracts structured, schema-validated data from any document with a typed client, automatic retries, and structured errors.' },
      { question: 'Does the Talonic SDK have dependencies?', answer: 'No. @talonic/node has zero runtime dependencies and requires Node.js 18 or newer.' },
    ],
    mentions: ['Node.js', 'TypeScript', 'SDK', 'document extraction'],
  },
  {
    slug: 'install',
    parentSlug: 'overview',
    title: 'Install',
    seoTitle: 'Install @talonic/node — Talonic Docs',
    description: 'Install the official Talonic Node.js SDK via npm. Requires Node.js 18 or newer with zero runtime dependencies.',
    content: [
      { type: 'code', language: 'bash', code: 'npm install @talonic/node' },
      { type: 'paragraph', text: 'Requires Node.js 18 or newer. Zero runtime dependencies.' },
      { type: 'heading', level: 3, id: 'get-api-key', text: 'Get an API key (30 seconds)' },
      { type: 'paragraph', text: 'Every user runs against their own Talonic workspace. Your documents and schemas are private to you.' },
      { type: 'list', ordered: true, items: [
        'Sign up at [app.talonic.com](https://app.talonic.com). Free tier: 50 extractions per day, no credit card.',
        'Settings → API Keys → Create New Key.',
        'Copy the `tlnc_` value.',
        'Set it as the `TALONIC_API_KEY` environment variable, or pass it directly to the client constructor.',
      ]},
    ],
    related: [
      { label: 'Quick Start', slug: 'quickstart' },
      { label: 'Client Options', slug: 'client-options' },
    ],
    faq: [
      { question: 'How do I install the Talonic SDK?', answer: 'Run npm install @talonic/node. Requires Node.js 18+ with zero runtime dependencies.' },
      { question: 'How do I get a Talonic API key?', answer: 'Sign up at app.talonic.com (free tier, no credit card), then go to Settings > API Keys > Create New Key. Keys use the tlnc_ prefix.' },
    ],
    mentions: ['npm', 'API key', 'Node.js 18'],
  },
  {
    slug: 'quickstart',
    parentSlug: 'overview',
    title: 'Quick Start',
    seoTitle: 'Quick Start — Talonic Node SDK',
    description: 'Extract structured data from a document in 5 lines of TypeScript using the Talonic SDK.',
    content: [
      { type: 'code', language: 'typescript', title: 'Extract an invoice', code: `import { Talonic } from "@talonic/node"

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
// { vendor_name: "Acme Corp", invoice_number: "INV-2024-0847", total_amount: 14250, due_date: "2024-03-15" }` },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Schemas', slug: 'schemas' },
    ],
    faq: [
      { question: 'How do I extract data from a PDF with the Talonic SDK?', answer: 'Import Talonic, create a client with your API key, and call talonic.extract() with a file path and schema. The result contains structured, schema-validated JSON.' },
    ],
    mentions: ['extract', 'schema', 'TypeScript'],
  },
];
