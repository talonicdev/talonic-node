import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "cli-usage",
    parentSlug: "cli",
    title: "CLI Usage",
    seoTitle: "CLI — Talonic Node SDK",
    description:
      "Use the talonic CLI to list schemas, manage documents, and extract data directly from the terminal.",
    content: [
      {
        type: "paragraph",
        text: "The package ships with a `talonic` binary for terminal-based workflows. It mirrors the SDK's resource structure so every operation available in code is also available from the command line.",
      },
      {
        type: "code",
        language: "bash",
        title: "Basic usage",
        code: `# Extract structured data from a file
talonic extract ./invoice.pdf \\
  --schema='{"vendor_name":"string","total_amount":"number"}'

# List schemas in your workspace
talonic schemas list

# List documents with pagination
talonic documents list --per-page=20

# Get help on any command
talonic --help
talonic extract --help
talonic documents --help`,
      },
      {
        type: "paragraph",
        text: "The CLI reads `TALONIC_API_KEY` from the environment. All output is JSON by default, making it straightforward to pipe into `jq`, `grep`, or any other tool that accepts JSON input.",
      },
      {
        type: "code",
        language: "bash",
        title: "Resource commands",
        code: `# Documents
talonic documents list
talonic documents get doc_abc123
talonic documents delete doc_abc123

# Schemas
talonic schemas list
talonic schemas get sch_abc123
talonic schemas create --name "Invoice Schema" \\
  --definition='{"type":"object","properties":{"vendor":{"type":"string"}}}'
talonic schemas delete sch_abc123

# Extractions
talonic extractions list --document-id=doc_abc123
talonic extractions get ext_xyz789
talonic extractions data ext_xyz789
talonic extractions data ext_xyz789 --format=csv

# Jobs
talonic jobs list
talonic jobs get job_abc123
talonic jobs create --schema-id=sch_abc123 --document-ids=doc_001,doc_002
talonic jobs results job_abc123
talonic jobs cancel job_abc123

# Credits
talonic credits balance`,
      },
      {
        type: "paragraph",
        text: "The CLI mirrors the SDK's resource structure: top-level commands map to resources (`schemas`, `documents`, `extractions`, `jobs`, `credits`) and subcommands map to methods (`list`, `get`, `create`, `delete`). Run `talonic <resource> --help` for the full list of flags on any command. Flag names use kebab-case (e.g. `--schema-id`, `--per-page`, `--document-ids`) corresponding to the SDK's camelCase and snake_case parameters.",
      },
      {
        type: "code",
        language: "bash",
        title: "Scripting with jq",
        code: `# Extract all document IDs
talonic documents list | jq '.[].id'

# Get the total amount from an extraction
talonic extractions data ext_xyz789 | jq '.total_amount'

# Check credit balance and runway
talonic credits balance | jq '{credits: .balance_credits, runway: .projected_runway_days}'

# Export extraction data to CSV
talonic extractions data ext_xyz789 --format=csv > export.csv

# Find all completed jobs
talonic jobs list | jq '.[] | select(.status == "completed") | .id'

# Extract and save result to file
talonic extract ./contract.pdf \\
  --schema='{"parties":["string"],"effective_date":"date"}' > result.json`,
      },
      {
        type: "paragraph",
        text: "Because output is JSON, you can pipe results into `jq` or other tools for scripting. The CLI uses the same retry and error handling logic as the SDK, so transient failures (429, 5xx, network errors, timeouts) are retried automatically with exponential backoff. Error output goes to stderr as JSON with `code`, `status`, and `message` fields, so you can parse errors programmatically in shell scripts.",
      },
      {
        type: "paragraph",
        text: "The CLI is particularly useful for one-off extractions, debugging schema definitions, verifying API key permissions, and building shell-based automation workflows. For CI/CD pipelines, you can use it to extract data from documents generated during the build process, verify schemas before deployment, or run batch jobs triggered by cron schedules.",
      },
      {
        type: "callout",
        text: "Set `TALONIC_API_KEY` in your shell profile or `.env` file to avoid passing it on every invocation. The CLI does not support a `--api-key` flag to prevent accidental key exposure in shell history.",
      },
    ],
    related: [
      { label: "Install", slug: "install" },
      { label: "Extract", slug: "extract" },
    ],
    faq: [
      {
        question: "Does the Talonic SDK include a CLI?",
        answer:
          "Yes. The talonic binary ships with @talonic/node and supports extraction, document management, schema CRUD, job management, and credit balance checks from the terminal. Install via npm install @talonic/node and run with npx talonic or install globally.",
      },
      {
        question: "How do I set the API key for the CLI?",
        answer:
          "Export TALONIC_API_KEY in your shell environment. The CLI reads it automatically. There is no --api-key flag to prevent accidental key exposure in shell history. Store the key in your shell profile (~/.bashrc, ~/.zshrc) or a .env file.",
      },
      {
        question: "Can I pipe CLI output to other tools?",
        answer:
          "Yes. All CLI output is JSON by default, so you can pipe it into jq, grep, or any tool that accepts JSON input. Errors go to stderr as JSON, so stdout always contains clean parseable output.",
      },
      {
        question: "What commands does the CLI support?",
        answer:
          "The CLI supports extract, documents (list, get, delete), schemas (list, get, create, delete), extractions (list, get, data), jobs (list, get, create, results, cancel), and credits (balance). Run talonic --help or talonic <command> --help for full details.",
      },
      {
        question: "Does the CLI retry failed requests?",
        answer:
          "Yes. The CLI uses the same transport layer as the SDK, so it retries 429, 5xx, network errors, and timeouts automatically with exponential backoff and jitter. There is no separate retry configuration for the CLI.",
      },
      {
        question: "How do I export extraction data as CSV from the CLI?",
        answer:
          "Run talonic extractions data <id> --format=csv. The CSV output goes to stdout so you can redirect it to a file with > export.csv or pipe it into other tools for processing.",
      },
    ],
    mentions: ["CLI", "terminal", "talonic binary"],
  },
]
