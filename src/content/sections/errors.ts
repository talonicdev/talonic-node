import type { RawSection } from "../types"

export const sections: RawSection[] = [
  {
    slug: "error-classes",
    parentSlug: "errors",
    title: "Error Classes",
    seoTitle: "Error Classes — Talonic Node SDK",
    description:
      "Every Talonic SDK failure is a typed TalonicError subclass with status, code, and requestId for debugging.",
    content: [
      {
        type: "paragraph",
        text: "Every failure is a `TalonicError` subclass with `status`, `code`, and `requestId` properties.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Available error classes",
        code: `import {
  TalonicError,           // base
  TalonicAuthError,       // 401, 403
  TalonicNotFoundError,   // 404
  TalonicValidationError, // 400, 409, 413, 422
  TalonicRateLimitError,  // 429 (after retries exhausted)
  TalonicServerError,     // 500, 502, 503, 504 (after retries exhausted)
  TalonicNetworkError,    // DNS / TCP failures
  TalonicTimeoutError,    // request exceeded timeout
} from "@talonic/node"`,
      },
      {
        type: "paragraph",
        text: "Each error class maps to a specific failure category. **TalonicAuthError** covers authentication and permission failures (401, 403). **TalonicValidationError** covers request rejections like bad input, conflicts, oversized files, or unprocessable entities (400, 409, 413, 422). **TalonicRateLimitError** and **TalonicServerError** are only thrown after all retries are exhausted.",
      },
      {
        type: "paragraph",
        text: "**TalonicNetworkError** and **TalonicTimeoutError** represent transport-level failures that never reached the server. Both carry `status: 0` and are retried automatically. The `code` property is set to `\"network_error\"` or `\"timeout\"` respectively, and `retryable` is always `true`.",
      },
      {
        type: "paragraph",
        text: "All error classes extend the base `TalonicError`, so a single `catch` with `instanceof TalonicError` captures every SDK failure. Use more specific subclasses when you need to branch on failure mode, such as showing a different message for auth errors versus validation errors.",
      },
      {
        type: "callout",
        text: "Every error includes a `requestId` property (when available) that maps to the server-side request log. Include it in support tickets for fast debugging.",
      },
    ],
    related: [
      { label: "Error Handling", slug: "error-handling" },
      { label: "Retries & Backoff", slug: "retries" },
    ],
    faq: [
      {
        question: "What error types does the Talonic SDK throw?",
        answer:
          "The SDK throws typed subclasses of TalonicError: TalonicAuthError (401/403), TalonicNotFoundError (404), TalonicValidationError (400/409/413/422), TalonicRateLimitError (429), TalonicServerError (5xx), TalonicNetworkError, and TalonicTimeoutError.",
      },
      {
        question: "What is the requestId property on errors?",
        answer:
          "It is a server-assigned identifier for the request that failed. Include it in support tickets or logs for fast debugging. It may be undefined for transport-level errors that never reached the server.",
      },
      {
        question: "Are TalonicNetworkError and TalonicTimeoutError retried automatically?",
        answer:
          "Yes. Both are marked retryable: true and the SDK retries them up to maxRetries times with exponential backoff. They are only thrown after all retry attempts are exhausted.",
      },
    ],
    mentions: ["TalonicError", "error handling", "status codes"],
  },
  {
    slug: "error-handling",
    parentSlug: "errors",
    title: "Error Handling",
    seoTitle: "Error Handling — Talonic Node SDK",
    description:
      "Pattern for catching and handling Talonic SDK errors with instanceof checks and rate limit metadata.",
    content: [
      {
        type: "paragraph",
        text: "Use `instanceof` checks against specific error subclasses to handle different failure modes. Order your checks from most specific to least specific, with the base `TalonicError` as the final catch-all.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Catch pattern",
        code: `try {
  await talonic.extract({ ... })
} catch (err) {
  if (err instanceof TalonicRateLimitError) {
    console.log(\`Reset at \${err.rateLimit.resetAt}\`)
  } else if (err instanceof TalonicError) {
    console.error(\`\${err.code} (status \${err.status}, request \${err.requestId}): \${err.message}\`)
  }
}`,
      },
      {
        type: "paragraph",
        text: "`TalonicRateLimitError` includes a `rateLimit` object with `resetAt` (Date) for scheduling retries. All errors include `requestId` for support debugging.",
      },
      {
        type: "paragraph",
        text: "The `retryable` property on every error tells you whether the SDK considers the failure worth retrying. When you catch an error after retries are exhausted, checking `retryable` helps decide whether to queue the request for later or surface it to the user immediately.",
      },
      {
        type: "paragraph",
        text: "For logging and observability, capture `err.code`, `err.status`, and `err.requestId` on every failure. The `code` is a machine-readable string like `\"invalid_schema\"` or `\"rate_limited\"` that is safe to use in metrics and alerting rules.",
      },
      {
        type: "callout",
        text: "Remember that **TalonicRateLimitError** and **TalonicServerError** are only thrown after all retry attempts are exhausted. If you catch them, the SDK has already retried `maxRetries` times.",
      },
    ],
    related: [
      { label: "Error Classes", slug: "error-classes" },
      { label: "Retries & Backoff", slug: "retries" },
    ],
    faq: [
      {
        question: "How do I handle rate limits in the Talonic SDK?",
        answer:
          "Catch TalonicRateLimitError and read err.rateLimit.resetAt to know when to retry. The SDK also retries rate-limited requests automatically up to maxRetries.",
      },
      {
        question: "What is the retryable property on errors?",
        answer:
          "It indicates whether the SDK considers the failure worth retrying. Errors thrown after retries are exhausted still carry retryable: true, which you can use to decide whether to queue the request for later.",
      },
      {
        question: "How should I log Talonic errors?",
        answer:
          "Capture err.code (machine-readable string), err.status (HTTP status or 0), err.requestId (server-side trace ID), and err.message. The code field is stable and safe for metrics and alerting rules.",
      },
    ],
    mentions: ["try/catch", "instanceof", "rate limit", "requestId"],
  },
]
