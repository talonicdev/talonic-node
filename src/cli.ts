/**
 * Talonic CLI entry point.
 *
 * Built as a separate bundle by tsup with a shebang banner so the
 * resulting `dist/cli.js` is directly executable.
 *
 * @internal
 */

import { Talonic } from "./client.js"
import { TalonicError } from "./errors.js"
import type { ExtractParams, SchemaDefinition } from "./resources/extract.js"
import type { ListDocumentsParams } from "./resources/documents.js"
import { VERSION } from "./version.js"

/**
 * Parsed positional arguments and flags from `process.argv.slice(2)`.
 *
 * @internal
 */
export interface ParsedArgs {
  positional: string[]
  flags: Record<string, string | boolean>
}

/**
 * Tiny zero-dependency argument parser. Recognises:
 *   --flag           (boolean true)
 *   --flag=value     (string value)
 *   --flag value     (string value, when the next token is not a flag)
 *   -h / -v          (short forms aliased in dispatch)
 *
 * Anything that does not start with `-` is treated as a positional.
 *
 * @internal
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === undefined) continue

    if (arg.startsWith("--")) {
      const body = arg.slice(2)
      const eq = body.indexOf("=")
      if (eq > -1) {
        flags[body.slice(0, eq)] = body.slice(eq + 1)
      } else {
        const next = argv[i + 1]
        if (next !== undefined && !next.startsWith("-")) {
          flags[body] = next
          i++
        } else {
          flags[body] = true
        }
      }
    } else if (arg.startsWith("-") && arg.length === 2) {
      // Short flags like -h, -v
      flags[arg.slice(1)] = true
    } else {
      positional.push(arg)
    }
  }

  return { positional, flags }
}

const HELP_TEXT = `talonic - Official Talonic CLI

USAGE
  talonic <command> [options]

COMMANDS
  schemas list                              List all saved schemas
  schemas get <id>                          Get a schema by ID
  documents list [--per-page=N]             List documents
                 [--status=<status>]
  documents get <id>                        Get a document by ID
  extract <file_path> [options]             Extract structured data from a document

OPTIONS
  -h, --help                                Show this help message
  -v, --version                             Show CLI version

EXTRACT OPTIONS
  --schema='<json>'                         Inline schema (any of the three formats)
  --schema-id=<id>                          Use a saved schema by ID
  --instructions='<text>'                   Natural-language extraction guidance
  --include-markdown                        Include OCR markdown in the response

ENVIRONMENT
  TALONIC_API_KEY    (required)             Your Talonic API key
  TALONIC_BASE_URL   (optional)             Override the API base URL

EXAMPLES
  talonic schemas list
  talonic documents list --per-page=10
  talonic extract ./invoice.pdf \\
    --schema='{"vendor_name":"string","total_amount":"number"}'
  talonic extract ./contract.pdf --schema-id=sch_abc123

DOCS
  https://github.com/talonicdev/talonic-node
`

/**
 * Parse a JSON string from the command line, with a clearer error than
 * raw `JSON.parse` for malformed input.
 *
 * @internal
 */
function parseJsonFlag(label: string, value: unknown): unknown {
  if (typeof value !== "string") {
    throw new Error(`--${label} requires a JSON string value`)
  }
  try {
    return JSON.parse(value)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`--${label} is not valid JSON: ${msg}`)
  }
}

/**
 * Dispatch a parsed command line against a Talonic client.
 *
 * Exposed for integration testing; the real entry point wires this up
 * against `process.argv`, environment variables, and `console`.
 *
 * @internal
 */
export async function dispatch(
  talonic: Talonic,
  parsed: ParsedArgs,
  out: (line: string) => void = console.log,
): Promise<void> {
  const [resource, action, ...rest] = parsed.positional

  if (resource === "schemas" && action === "list") {
    out(JSON.stringify(await talonic.schemas.list(), null, 2))
    return
  }

  if (resource === "schemas" && action === "get") {
    const id = rest[0]
    if (!id) throw new Error("Usage: talonic schemas get <id>")
    out(JSON.stringify(await talonic.schemas.get(id), null, 2))
    return
  }

  if (resource === "documents" && action === "list") {
    const params: ListDocumentsParams = {}
    const perPage = parsed.flags["per-page"]
    if (typeof perPage === "string") params.per_page = Number.parseInt(perPage, 10)
    const status = parsed.flags["status"]
    if (typeof status === "string") {
      params.status = status as ListDocumentsParams["status"]
    }
    out(JSON.stringify(await talonic.documents.list(params), null, 2))
    return
  }

  if (resource === "documents" && action === "get") {
    const id = rest[0]
    if (!id) throw new Error("Usage: talonic documents get <id>")
    out(JSON.stringify(await talonic.documents.get(id), null, 2))
    return
  }

  if (resource === "extract") {
    const filePath = action // first positional after `extract`
    if (!filePath) {
      throw new Error("Usage: talonic extract <file_path> [options]")
    }

    const params: ExtractParams = { file_path: filePath }

    const schemaFlag = parsed.flags["schema"]
    if (schemaFlag !== undefined) {
      params.schema = parseJsonFlag("schema", schemaFlag) as SchemaDefinition
    }

    const schemaId = parsed.flags["schema-id"]
    if (typeof schemaId === "string") params.schema_id = schemaId

    const instructions = parsed.flags["instructions"]
    if (typeof instructions === "string") params.instructions = instructions

    if (parsed.flags["include-markdown"] === true) params.include_markdown = true

    out(JSON.stringify(await talonic.extract(params), null, 2))
    return
  }

  throw new Error(
    `Unknown command: ${parsed.positional.join(" ") || "(none)"}\nRun \`talonic --help\` for usage.`,
  )
}

/**
 * Bind argv and the environment to a real Talonic client and run.
 *
 * @internal
 */
export async function run(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  out: (line: string) => void = console.log,
  err: (line: string) => void = console.error,
): Promise<number> {
  const parsed = parseArgs(argv)

  if (parsed.flags["version"] === true || parsed.flags["v"] === true) {
    out(VERSION)
    return 0
  }

  if (
    parsed.flags["help"] === true ||
    parsed.flags["h"] === true ||
    parsed.positional.length === 0
  ) {
    out(HELP_TEXT)
    return 0
  }

  const apiKey = env["TALONIC_API_KEY"]
  if (!apiKey) {
    err("Error: TALONIC_API_KEY environment variable is required.")
    err("Get a key at https://app.talonic.com and try again.")
    return 1
  }

  const baseUrl = env["TALONIC_BASE_URL"]
  const talonic = new Talonic({
    apiKey,
    ...(baseUrl ? { baseUrl } : {}),
  })

  try {
    await dispatch(talonic, parsed, out)
    return 0
  } catch (e) {
    if (e instanceof TalonicError) {
      err(`Error: ${e.message}`)
      err(`  code: ${e.code}`)
      err(`  status: ${e.status}`)
      if (e.requestId) err(`  request-id: ${e.requestId}`)
      return 1
    }
    err(`Error: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
}

// Auto-run when invoked as a binary. The shebang and the import.meta.url
// check together ensure this only runs when called directly, not when
// imported (e.g. by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  run().then((code) => process.exit(code))
}
