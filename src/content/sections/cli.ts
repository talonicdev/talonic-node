import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "cli-usage",
    parentSlug: "cli",
    title: "CLI Usage",
    seoTitle: "Talonic CLI — Terminal Document Extraction for Node.js",
    description:
      "Use the bundled talonic CLI to extract documents, list schemas and documents, and script its JSON output from the terminal with only an API key in env.",
    content: [
      {
        type: "paragraph",
        text: "The package ships with a `talonic` binary for terminal-based workflows. It focuses on the operations you reach for most often outside of code: running an extraction against a local file, listing your saved schemas, and inspecting the documents in your workspace. Every command is a thin wrapper over the same SDK client, so authentication, retries, and error mapping behave exactly as they do in TypeScript.",
      },
      {
        type: "code",
        language: "bash",
        title: "Basic usage",
        code: `# Extract structured data from a file with an inline schema
talonic extract ./invoice.pdf \\
  --schema='{"type":"object","properties":{"vendor_name":{"type":"string"},"total_amount":{"type":"number"}}}'

# Extract with a saved schema
talonic extract ./contract.pdf --schema-id=sch_abc123

# List schemas in your workspace
talonic schemas list

# List documents with paging and a status filter
talonic documents list --per-page=20 --status=completed

# Show help and version
talonic --help
talonic --version`,
      },
      {
        type: "paragraph",
        text: "The CLI reads `TALONIC_API_KEY` from the environment and exits with an error message if it is missing. Set `TALONIC_BASE_URL` to point at a staging environment or local proxy; it maps directly to the SDK's `baseUrl` option. There is intentionally no `--api-key` flag, so keys never end up in your shell history. All successful output is pretty-printed JSON on stdout, making it straightforward to pipe into `jq`, `grep`, or any other tool that accepts JSON input.",
      },
      {
        type: "code",
        language: "bash",
        title: "Supported commands",
        code: `# Schemas
talonic schemas list                    # list all saved schemas
talonic schemas get sch_abc123          # get one schema by ID

# Documents
talonic documents list                  # list documents
talonic documents list --per-page=10    # page size
talonic documents list --status=error   # filter: pending | processing | completed | error
talonic documents get doc_abc123        # get one document by ID

# Extraction
talonic extract <file_path> [options]
#   --schema='<json>'        inline schema (full JSON Schema recommended)
#   --schema-id=<id>         use a saved schema
#   --instructions='<text>'  natural-language extraction guidance
#   --include-markdown       include OCR markdown in the response

# Environment
#   TALONIC_API_KEY   (required)  your tlnc_ API key
#   TALONIC_BASE_URL  (optional)  override the API base URL`,
      },
      {
        type: "paragraph",
        text: "Command output is the full SDK response serialized with two-space indentation, so list commands return an object with `data` and `pagination` keys — plus the `rateLimit` and `cost` metadata the SDK attaches to every response. Keep that envelope in mind when scripting: document IDs live at `.data[].id`, not at the top level. Extract output mirrors the `ExtractResult` shape, with the structured fields under `.data`.",
      },
      {
        type: "code",
        language: "bash",
        title: "Scripting with jq",
        code: `# Extract all document IDs
talonic documents list | jq '.data[].id'

# Filenames of completed documents
talonic documents list --status=completed | jq '.data[].filename'

# Run an extraction and keep only the structured fields
talonic extract ./invoice.pdf --schema-id=sch_abc123 | jq '.data'

# Check the remaining rate-limit budget on any call
talonic schemas list | jq '.rateLimit'

# Save a full extraction result to a file
talonic extract ./contract.pdf --schema-id=sch_abc123 > result.json`,
      },
      {
        type: "paragraph",
        text: "Because the CLI constructs a standard SDK client, transient failures (429 rate limits, 5xx responses, network errors, timeouts) are retried automatically with exponential backoff before anything is reported. When a command does fail, the error goes to stderr as plain-text lines — `Error: <message>` followed by indented `code:`, `status:`, and `request-id:` lines when available — and the process exits with status 1. Stdout stays reserved for clean JSON, so redirects and pipes never mix data with diagnostics.",
      },
      {
        type: "paragraph",
        text: "The CLI is deliberately smaller than the SDK: operations like schema creation, extraction listing, batch jobs, corrections, and credit queries are SDK-only today. For anything beyond extract, schema lookup, and document lookup, write a short script against `@talonic/node` instead — the Quick Start covers the same flows in a few lines of TypeScript. `talonic --help` always prints the current, authoritative command list for the version you have installed.",
      },
      {
        type: "callout",
        text: "Set `TALONIC_API_KEY` in your shell profile or `.env` file to avoid passing it on every invocation. The CLI does not support an `--api-key` flag, which prevents accidental key exposure in shell history.",
      },
    ],
    related: [
      { label: "Install", slug: "install" },
      { label: "Extract", slug: "extract" },
      { label: "Quick Start", slug: "quickstart" },
    ],
    faq: [
      {
        question: "Does the Talonic SDK include a CLI?",
        answer:
          "Yes. The talonic binary ships with @talonic/node and supports extraction (talonic extract), schema listing and lookup (talonic schemas list/get), and document listing and lookup (talonic documents list/get). Install via npm install @talonic/node and run it with npx talonic, or install globally.",
      },
      {
        question: "How do I set the API key for the CLI?",
        answer:
          "Export TALONIC_API_KEY in your shell environment; the CLI reads it automatically and exits with an error if it is missing. There is no --api-key flag, which prevents accidental key exposure in shell history. TALONIC_BASE_URL optionally overrides the API base URL.",
      },
      {
        question: "Can I pipe CLI output to other tools?",
        answer:
          "Yes. Successful output is pretty-printed JSON on stdout, so you can pipe it into jq or any JSON-aware tool. List commands wrap results in a data array (use .data[].id in jq), and errors go to stderr as plain text, so stdout always contains clean parseable JSON.",
      },
      {
        question: "Does the CLI retry failed requests?",
        answer:
          "Yes. The CLI builds a standard SDK client under the hood, so 429s, 5xx responses, network errors, and timeouts are retried automatically with exponential backoff and jitter before an error is reported. There is no separate retry configuration for the CLI.",
      },
      {
        question: "Can I manage jobs, extractions, or credits from the CLI?",
        answer:
          "Not yet. The CLI currently covers extract, schemas list/get, and documents list/get. Batch jobs, extraction queries, corrections, schema creation, and credit balance checks are available through the SDK — a few lines of TypeScript with @talonic/node cover each of those flows.",
      },
      {
        question: "What format should the --schema flag use?",
        answer:
          'Pass a JSON string. Full JSON Schema with type "object" and a properties map is recommended, matching the SDK guidance — the flat key-type shorthand is not yet reliably normalised server-side. Quote the value in single quotes so your shell passes the JSON through unmodified.',
      },
    ],
    mentions: ["CLI", "terminal", "talonic binary", "jq"],
  },
]
