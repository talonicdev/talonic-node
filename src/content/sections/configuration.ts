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
        code: `const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  baseUrl: "https://api.talonic.com",   // default
  timeout: 60_000,                       // ms; default 60s
  maxRetries: 3,                         // 429, 500, 502, 503, 504, network, timeout
  fetch: customFetch,                    // optional override (e.g. for testing)
})`,
      },
      {
        type: "paragraph",
        text: "The `fetch` option lets you inject a custom implementation for testing or proxying. In production on Node.js 18+, the SDK uses the built-in `globalThis.fetch` automatically. If no fetch implementation is available (Node < 18 without a polyfill), the constructor throws a `TypeError` with a clear message.",
      },
      {
        type: "paragraph",
        text: "Adjust `timeout` for long-running extractions on large documents; the default of 60 seconds covers most cases. Set `maxRetries` to `0` to disable automatic retries entirely, which is useful during development when you want to see errors immediately.",
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
            description: "API base URL.",
            default: "https://api.talonic.com",
          },
          {
            name: "timeout",
            type: "number",
            description: "Request timeout in milliseconds.",
            default: "60000",
          },
          {
            name: "maxRetries",
            type: "number",
            description: "Max retry attempts for transient failures.",
            default: "3",
          },
          {
            name: "fetch",
            type: "function",
            description: "Custom fetch implementation for testing or proxying.",
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
          "Pass an options object to new Talonic() with apiKey (required), and optional baseUrl, timeout, maxRetries, and fetch.",
      },
      {
        question: "Can I disable automatic retries?",
        answer:
          "Yes. Set maxRetries to 0 in the constructor options. The SDK will throw on the first failure without retrying.",
      },
      {
        question: "What happens if no fetch implementation is available?",
        answer:
          "The constructor throws a TypeError with the message 'no fetch implementation available'. On Node.js 18+ the built-in fetch is used automatically; on older versions, pass a polyfill via the fetch option.",
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
        text: "The backoff schedule starts at 1 second for the first retry, doubling on each subsequent attempt (1s, 2s, 4s, ...) up to a maximum of 16 seconds. A random jitter of up to 250ms is added to each wait to prevent thundering-herd problems when multiple clients retry simultaneously.",
      },
      {
        type: "paragraph",
        text: "For `429` rate-limit responses specifically, the SDK reads the `X-RateLimit-Reset` header and waits until the reset timestamp (plus a 100ms buffer) rather than using exponential backoff. If the reset window exceeds 60 seconds, the SDK falls back to standard backoff instead of blocking indefinitely.",
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
          "Yes. It retries on 429, 500, 502, 503, 504, network errors, and timeouts with exponential backoff and jitter, up to maxRetries attempts.",
      },
      {
        question: "What is the maximum backoff time between retries?",
        answer:
          "The exponential backoff caps at 16 seconds. For 429 rate-limit errors, the SDK instead waits until the server-provided reset timestamp, up to a maximum of 60 seconds.",
      },
      {
        question: "Can the API override the SDK's retry behavior?",
        answer:
          "Yes. If the API returns retryable: false on an error response, the SDK will not retry that request regardless of the status code or maxRetries setting.",
      },
    ],
    mentions: ["retry", "backoff", "rate limit", "429"],
  },
]
