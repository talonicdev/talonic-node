import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "client-options",
    parentSlug: "configuration",
    title: "Client Options",
    seoTitle: "Configuration — Talonic Node SDK",
    description:
      "Configure the Talonic client with API key, base URL, timeout, retries, and custom fetch.",
    content: [
      {
        type: "paragraph",
        text: "Create a `Talonic` instance by passing a configuration object to the constructor. The only required field is `apiKey`; all other options have sensible defaults. The client validates the key format on construction and throws a `TypeError` if it is missing or empty.",
      },
      {
        type: "code",
        language: "typescript",
        title: "All options",
        code: `import { Talonic } from '@talonic/node'

const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  baseUrl: 'https://api.talonic.com',   // default
  timeout: 60_000,                       // ms; default 60s
  maxRetries: 3,                         // 429, 500, 502, 503, 504, network, timeout
  fetch: customFetch,                    // optional override (e.g. for testing)
})`,
      },
      {
        type: "paragraph",
        text: "The `TalonicConfig` interface defines the constructor shape. The `apiKey` field is the only required parameter and must be a non-empty string. The constructor does not validate the `tlnc_` prefix or make any network calls; it only checks that the key is present and that a `fetch` implementation is available. Authentication failures surface on the first API call as a `TalonicAuthError` with status 401 (invalid key) or 403 (insufficient permissions).",
      },
      {
        type: "paragraph",
        text: "The `fetch` option lets you inject a custom implementation for testing or proxying. In production on Node.js 18+, the SDK uses the built-in `globalThis.fetch` automatically. If no fetch implementation is available (Node < 18 without a polyfill), the constructor throws a `TypeError` with a clear message.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Testing with a mock fetch",
        code: `import { Talonic } from '@talonic/node'

// Inject a custom fetch for testing
const mockFetch = async (url: string, init?: RequestInit) => {
  console.log(\`Request: \${init?.method} \${url}\`)
  return new Response(JSON.stringify({ balance_credits: 1000, tier: 'free' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

const talonic = new Talonic({
  apiKey: 'tlnc_test_key',
  fetch: mockFetch as typeof fetch,
})

const balance = await talonic.credits.getBalance()
console.log(balance.balance_credits) // 1000`,
      },
      {
        type: "paragraph",
        text: "Adjust `timeout` for long-running extractions on large documents; the default of 60 seconds covers most cases. For multi-page PDFs or image-heavy documents, consider increasing to 120 seconds or more. Set `maxRetries` to `0` to disable automatic retries entirely, which is useful during development when you want to see errors immediately. In production, the default of 3 retries with exponential backoff handles most transient failures without any manual intervention.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Production configuration",
        code: `// Production: higher timeout for large documents, default retries
const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  timeout: 120_000, // 2 minutes for large documents
  maxRetries: 3,    // default — retries 429, 5xx, network, timeout
})

// Development: fast feedback, no retries
const devClient = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  timeout: 30_000,
  maxRetries: 0, // fail immediately on errors
})`,
      },
      {
        type: "paragraph",
        text: "The `baseUrl` option defaults to `https://api.talonic.com` and is useful for pointing at staging environments or local proxies during development. Trailing slashes are stripped automatically. Every HTTP request sent by the SDK includes an `Authorization: Bearer <apiKey>` header, a `User-Agent: talonic-node/<version>` header, and `Accept: application/json`. For non-FormData bodies, `Content-Type: application/json` is set automatically. You can override headers on individual requests through the transport layer, but the constructor-level options cover all common configuration needs.",
      },
      {
        type: "callout",
        text: "API keys use the `tlnc_` prefix. Store them in environment variables or a secrets manager rather than hard-coding them in source files.",
      },
      {
        type: "param-table",
        params: [
          {
            name: "apiKey",
            type: "string",
            required: true,
            description: "Your Talonic API key. Starts with `tlnc_`.",
          },
          {
            name: "baseUrl",
            type: "string",
            description: "API base URL. Trailing slashes are stripped automatically.",
            default: "https://api.talonic.com",
          },
          {
            name: "timeout",
            type: "number",
            description: "Request timeout in milliseconds. Applies per-request including retries.",
            default: "60000",
          },
          {
            name: "maxRetries",
            type: "number",
            description: "Max retry attempts for transient failures (429, 5xx, network, timeout). Set to 0 to disable.",
            default: "3",
          },
          {
            name: "fetch",
            type: "function",
            description: "Custom fetch implementation for testing, instrumentation, or polyfilling Node < 18.",
          },
        ],
      },
    ],
    related: [
      { label: "Retries & Backoff", slug: "retries" },
      { label: "Install", slug: "install" },
    ],
    faq: [
      {
        question: "How do I configure the Talonic SDK client?",
        answer:
          "Pass an options object to new Talonic() with apiKey (required), and optional baseUrl, timeout, maxRetries, and fetch. All options except apiKey have sensible defaults.",
      },
      {
        question: "Can I disable automatic retries?",
        answer:
          "Yes. Set maxRetries to 0 in the constructor options. The SDK will throw on the first failure without retrying. This is useful during development for fast feedback on errors.",
      },
      {
        question: "What happens if no fetch implementation is available?",
        answer:
          "The constructor throws a TypeError with the message 'no fetch implementation available'. On Node.js 18+ the built-in fetch is used automatically; on older versions, pass a polyfill via the fetch option.",
      },
      {
        question: "Does the constructor validate the API key with the server?",
        answer:
          "No. The constructor only checks that apiKey is a non-empty string and that a fetch implementation exists. It does not make any network calls. Authentication errors (invalid key, insufficient permissions) surface on the first API call as TalonicAuthError with status 401 or 403.",
      },
      {
        question: "What headers does the SDK send with every request?",
        answer:
          "Every request includes Authorization: Bearer <apiKey>, User-Agent: talonic-node/<version>, and Accept: application/json. For JSON bodies, Content-Type: application/json is set automatically. FormData bodies (used by extract) omit Content-Type to let the browser set the multipart boundary.",
      },
    ],
    mentions: ["configuration", "apiKey", "timeout", "maxRetries"],
  },
  {
    slug: "retries",
    parentSlug: "configuration",
    title: "Retries & Backoff",
    seoTitle: "Retries & Backoff — Talonic Node SDK",
    description:
      "How the Talonic SDK handles automatic retries with exponential backoff and jitter for transient failures.",
    content: [
      {
        type: "paragraph",
        text: "The SDK retries automatically on `429` (respecting `X-RateLimit-Reset`), `500`, `502`, `503`, `504`, network errors, and timeouts. Backoff is exponential with jitter, capped at 16s.",
      },
      {
        type: "paragraph",
        text: "The API may set `retryable: false` on a specific error; the SDK respects that and does not retry.",
      },
      {
        type: "paragraph",
        text: "The backoff schedule starts at 1 second for the first retry, doubling on each subsequent attempt (1s, 2s, 4s, ...) up to a maximum of 16 seconds. A random jitter of up to 250ms is added to each wait to prevent thundering-herd problems when multiple clients retry simultaneously. The formula is `min(1000 * 2^attempt, 16000) + random(0, 250)` milliseconds.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Retry behavior in practice",
        code: `import { Talonic, TalonicServerError, TalonicRateLimitError } from '@talonic/node'

// Default: 3 retries with exponential backoff
// Attempt 0: immediate request
// Attempt 1: wait ~1.0-1.25s, then retry
// Attempt 2: wait ~2.0-2.25s, then retry
// Attempt 3: wait ~4.0-4.25s, then retry
// If all fail, throws the last error

const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  maxRetries: 3, // default
})

try {
  await talonic.extract({ file_path: './doc.pdf', schema_id: 'sch_abc123' })
} catch (err) {
  if (err instanceof TalonicServerError) {
    // Thrown only after all 3 retries exhausted
    console.error(\`Server error after retries: \${err.code} (request \${err.requestId})\`)
  }
  if (err instanceof TalonicRateLimitError) {
    // Thrown after retries exhausted; check when the rate limit resets
    console.error(\`Rate limited. Resets at: \${err.rateLimit.resetAt}\`)
  }
}`,
      },
      {
        type: "paragraph",
        text: "For `429` rate-limit responses specifically, the SDK reads the `X-RateLimit-Reset` header and waits until the reset timestamp (plus a 100ms buffer) rather than using exponential backoff. If the reset window exceeds 60 seconds, the SDK falls back to standard backoff instead of blocking indefinitely. This means rate-limit retries are usually faster than exponential backoff because the SDK waits exactly the right amount of time rather than guessing.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Disable retries for development",
        code: `// In development, disable retries for immediate feedback
const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  maxRetries: 0, // no retries — throw on first failure
})

// Errors are thrown immediately without any wait
try {
  await talonic.documents.list()
} catch (err) {
  // err.retryable tells you if this WOULD have been retried
  if (err instanceof TalonicError && err.retryable) {
    console.log('This error would be retried in production (maxRetries > 0)')
  }
}`,
      },
      {
        type: "paragraph",
        text: "Non-retryable errors are never retried regardless of `maxRetries`. Authentication errors (401, 403), validation errors (400, 409, 413, 422), and not-found errors (404) are thrown immediately on the first attempt. The API can also mark specific errors as non-retryable by setting `retryable: false` in the error response body, which the SDK respects even for status codes that would normally be retried.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Custom retry logic on top of SDK retries",
        code: `import { Talonic, TalonicRateLimitError, TalonicError } from '@talonic/node'

// For critical pipelines, add your own retry layer on top
async function extractWithFallback(talonic: Talonic, params: Parameters<Talonic['extract']>[0]) {
  try {
    return await talonic.extract(params)
  } catch (err) {
    if (err instanceof TalonicRateLimitError) {
      // SDK retries are exhausted — wait for the rate limit reset and try once more
      const waitMs = err.rateLimit.resetAt.getTime() - Date.now()
      if (waitMs > 0 && waitMs < 120_000) {
        console.log(\`Rate limited. Waiting \${Math.ceil(waitMs / 1000)}s for reset...\`)
        await new Promise(r => setTimeout(r, waitMs + 100))
        return await talonic.extract(params)
      }
    }
    throw err
  }
}`,
      },
      {
        type: "paragraph",
        text: "The transport layer handles `TalonicTimeoutError` and `TalonicNetworkError` as retryable by default. Timeout errors are raised when a request exceeds the configured `timeout` milliseconds (default 60s). Network errors cover DNS failures, TCP resets, and unreachable hosts. Both carry `status: 0` because no HTTP response was received. After all retries are exhausted, the last error is thrown with `retryable: true` still set, so your application code can decide whether to queue the request for later processing.",
      },
      {
        type: "callout",
        text: "Rate limit retries respect the `X-RateLimit-Reset` header from the API, so the SDK waits the exact right amount of time before retrying a 429.",
      },
    ],
    related: [
      { label: "Client Options", slug: "client-options" },
      { label: "Error Classes", slug: "error-classes" },
    ],
    faq: [
      {
        question: "Does the Talonic SDK retry failed requests?",
        answer:
          "Yes. It retries on 429, 500, 502, 503, 504, network errors, and timeouts with exponential backoff and jitter, up to maxRetries attempts (default 3). Non-retryable errors like 401, 403, 400, and 404 are thrown immediately.",
      },
      {
        question: "What is the maximum backoff time between retries?",
        answer:
          "The exponential backoff caps at 16 seconds. For 429 rate-limit errors, the SDK instead waits until the server-provided reset timestamp (plus 100ms buffer), up to a maximum of 60 seconds. If the reset window exceeds 60 seconds, standard backoff is used instead.",
      },
      {
        question: "Can the API override the SDK's retry behavior?",
        answer:
          "Yes. If the API returns retryable: false on an error response, the SDK will not retry that request regardless of the status code or maxRetries setting.",
      },
      {
        question: "What is the exact backoff formula?",
        answer:
          "The wait time is min(1000 * 2^attempt, 16000) + random(0, 250) milliseconds. So: ~1s for the first retry, ~2s for the second, ~4s for the third, capping at ~16s. The random jitter of up to 250ms prevents thundering-herd problems when multiple clients retry simultaneously.",
      },
      {
        question: "Are timeout and network errors retried?",
        answer:
          "Yes. Both TalonicTimeoutError and TalonicNetworkError are marked retryable: true and are retried up to maxRetries times. They carry status: 0 because no HTTP response was received. They are only thrown to your code after all retry attempts are exhausted.",
      },
    ],
    mentions: ["retry", "backoff", "rate limit", "429"],
  },
]
