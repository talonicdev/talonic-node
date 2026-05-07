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
        text: "The package ships with a `talonic` binary for terminal-based workflows.",
      },
      {
        type: "code",
        language: "bash",
        title: "Examples",
        code: `talonic schemas list
talonic documents list --per-page=20
talonic extract ./invoice.pdf \\
  --schema='{"vendor_name":"string","total_amount":"number"}'
talonic --help`,
      },
      {
        type: "paragraph",
        text: "The CLI reads `TALONIC_API_KEY` from the environment. All output is JSON by default.",
      },
      {
        type: "paragraph",
        text: "The CLI mirrors the SDK's resource structure: top-level commands map to resources (`schemas`, `documents`, `extractions`, `jobs`, `credits`) and subcommands map to methods (`list`, `get`, `create`, `delete`). Run `talonic <resource> --help` for the full list of flags on any command.",
      },
      {
        type: "paragraph",
        text: "Because output is JSON, you can pipe results into `jq` or other tools for scripting. For example, `talonic documents list | jq '.[].id'` extracts all document IDs. The CLI uses the same retry and error handling logic as the SDK, so transient failures are retried automatically.",
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
          "Yes. The talonic binary ships with @talonic/node and supports schema listing, document management, and extraction from the terminal.",
      },
      {
        question: "How do I set the API key for the CLI?",
        answer:
          "Export TALONIC_API_KEY in your shell environment. The CLI reads it automatically. There is no --api-key flag to avoid key exposure in shell history.",
      },
      {
        question: "Can I pipe CLI output to other tools?",
        answer:
          "Yes. All CLI output is JSON by default, so you can pipe it into jq, grep, or any tool that accepts JSON input.",
      },
    ],
    mentions: ["CLI", "terminal", "talonic binary"],
  },
]
