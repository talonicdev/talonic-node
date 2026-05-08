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
        text: "Every failure is a `TalonicError` subclass with `status`, `code`, `retryable`, and `requestId` properties. The class hierarchy maps HTTP status codes to specific error types so you can handle each failure category independently.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Available error classes",
        code: `import {
  TalonicError,           // base class — catches all SDK errors
  TalonicAuthError,       // 401, 403 — invalid key or insufficient permissions
  TalonicNotFoundError,   // 404 — resource does not exist
  TalonicValidationError, // 400, 409, 413, 422 — bad input, conflict, file too large
  TalonicRateLimitError,  // 429 — rate limited (after retries exhausted)
  TalonicServerError,     // 500, 502, 503, 504 — server error (after retries exhausted)
  TalonicNetworkError,    // DNS / TCP failures — status: 0, code: 'network_error'
  TalonicTimeoutError,    // request exceeded configured timeout — status: 0, code: 'timeout'
} from '@talonic/node'`,
      },
      {
        type: "paragraph",
        text: "Each error class maps to a specific failure category. **TalonicAuthError** covers authentication and permission failures (401, 403). **TalonicValidationError** covers request rejections like bad input, conflicts, oversized files, or unprocessable entities (400, 409, 413, 422). **TalonicRateLimitError** and **TalonicServerError** are only thrown after all retries are exhausted.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Error class properties",
        code: `// Every TalonicError subclass carries these properties:
try {
  await talonic.extract({ file_path: './doc.pdf', schema_id: 'sch_invalid' })
} catch (err) {
  if (err instanceof TalonicError) {
    err.code       // 'invalid_schema' — machine-readable error code
    err.status     // 422 — HTTP status (0 for network/timeout)
    err.message    // 'Schema sch_invalid not found' — human-readable
    err.retryable  // false — was this error retried?
    err.requestId  // 'req_abc123' — server trace ID (undefined for transport errors)
    err.name       // 'TalonicValidationError' — class name
  }
}`,
      },
      {
        type: "paragraph",
        text: '**TalonicNetworkError** and **TalonicTimeoutError** represent transport-level failures that never reached the server. Both carry `status: 0` and are retried automatically. The `code` property is set to `"network_error"` or `"timeout"` respectively, and `retryable` is always `true`. `TalonicNetworkError` preserves the original error as `cause` for debugging DNS failures, TCP resets, and unreachable hosts. `TalonicTimeoutError` includes a `timeoutMs` property with the configured timeout value that was exceeded.',
      },
      {
        type: "code",
        language: "typescript",
        title: "Transport-level error details",
        code: `import { TalonicNetworkError, TalonicTimeoutError, TalonicRateLimitError } from '@talonic/node'

try {
  await talonic.extract({ file_path: './doc.pdf', schema_id: 'sch_abc123' })
} catch (err) {
  if (err instanceof TalonicTimeoutError) {
    console.error(\`Request timed out after \${err.timeoutMs}ms\`)
    // err.status === 0, err.code === 'timeout', err.retryable === true
  }

  if (err instanceof TalonicNetworkError) {
    console.error(\`Network failure: \${err.message}\`)
    console.error(\`Original error: \${err.cause}\`) // underlying DNS/TCP error
    // err.status === 0, err.code === 'network_error', err.retryable === true
  }

  if (err instanceof TalonicRateLimitError) {
    console.error(\`Rate limited. Limit: \${err.rateLimit.limit}, remaining: \${err.rateLimit.remaining}\`)
    console.error(\`Resets at: \${err.rateLimit.resetAt.toISOString()}\`)
    // err.rateLimit provides { limit, remaining, resetAt } from response headers
  }
}`,
      },
      {
        type: "paragraph",
        text: "All error classes extend the base `TalonicError`, so a single `catch` with `instanceof TalonicError` captures every SDK failure. Use more specific subclasses when you need to branch on failure mode, such as showing a different message for auth errors versus validation errors. The `TalonicRateLimitError` is unique in carrying a `rateLimit` property with `limit`, `remaining`, and `resetAt` (Date) from the response headers, useful for scheduling manual retries after the SDK's own retries are exhausted.",
      },
      {
        type: "paragraph",
        text: "The SDK also throws client-side `TalonicError` instances (not subclasses) for parameter validation failures before any network request is made. These carry `status: 0`, `retryable: false`, and codes like `missing_file_source`, `multiple_file_sources`, `multiple_schemas`, or `missing_field_reference`. They indicate programming errors in how the SDK is called rather than server-side failures.",
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
          "The SDK throws typed subclasses of TalonicError: TalonicAuthError (401/403), TalonicNotFoundError (404), TalonicValidationError (400/409/413/422), TalonicRateLimitError (429), TalonicServerError (5xx), TalonicNetworkError, and TalonicTimeoutError. Client-side validation errors use the base TalonicError class.",
      },
      {
        question: "What is the requestId property on errors?",
        answer:
          "It is a server-assigned identifier for the request that failed. Include it in support tickets or logs for fast debugging. It may be undefined for transport-level errors (network, timeout) that never reached the server, and for client-side validation errors.",
      },
      {
        question: "Are TalonicNetworkError and TalonicTimeoutError retried automatically?",
        answer:
          "Yes. Both are marked retryable: true and the SDK retries them up to maxRetries times with exponential backoff. They are only thrown after all retry attempts are exhausted.",
      },
      {
        question: "What client-side validation errors does the SDK throw?",
        answer:
          "The SDK throws TalonicError (base class) with status 0 and retryable false for parameter validation failures: missing_file_source (no file provided to extract), multiple_file_sources (more than one file source), multiple_schemas (both schema and schema_id provided), and missing_field_reference (filter condition without field or fieldId).",
      },
      {
        question: "How does TalonicRateLimitError differ from other error classes?",
        answer:
          "TalonicRateLimitError uniquely carries a rateLimit property with limit (max requests per window), remaining (requests left), and resetAt (Date when the window resets). This data comes from the X-RateLimit-* response headers and is useful for scheduling manual retries or implementing backpressure in your application.",
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
        title: "Comprehensive catch pattern",
        code: `import {
  TalonicAuthError,
  TalonicNotFoundError,
  TalonicValidationError,
  TalonicRateLimitError,
  TalonicServerError,
  TalonicNetworkError,
  TalonicTimeoutError,
  TalonicError,
} from '@talonic/node'

try {
  const result = await talonic.extract({
    file_path: './invoice.pdf',
    schema_id: 'sch_abc123',
  })
} catch (err) {
  if (err instanceof TalonicAuthError) {
    console.error('Authentication failed — check your API key')
  } else if (err instanceof TalonicNotFoundError) {
    console.error(\`Resource not found: \${err.message}\`)
  } else if (err instanceof TalonicValidationError) {
    console.error(\`Invalid request: \${err.code} — \${err.message}\`)
  } else if (err instanceof TalonicRateLimitError) {
    console.error(\`Rate limited. Resets at \${err.rateLimit.resetAt.toISOString()}\`)
  } else if (err instanceof TalonicServerError) {
    console.error(\`Server error (retries exhausted): \${err.code}\`)
  } else if (err instanceof TalonicTimeoutError) {
    console.error(\`Timed out after \${err.timeoutMs}ms\`)
  } else if (err instanceof TalonicNetworkError) {
    console.error(\`Network failure: \${err.message}\`)
  } else if (err instanceof TalonicError) {
    console.error(\`Talonic error: \${err.code} (status \${err.status})\`)
  }
}`,
      },
      {
        type: "paragraph",
        text: "`TalonicRateLimitError` includes a `rateLimit` object with `limit`, `remaining`, and `resetAt` (Date) for scheduling retries. All errors include `requestId` for support debugging. The `TalonicTimeoutError` includes `timeoutMs` with the configured timeout value that was exceeded, and `TalonicNetworkError` preserves the original error as `cause` for inspecting DNS or TCP failures.",
      },
      {
        type: "paragraph",
        text: "The `retryable` property on every error tells you whether the SDK considers the failure worth retrying. When you catch an error after retries are exhausted, checking `retryable` helps decide whether to queue the request for later or surface it to the user immediately. Errors with `retryable: true` that still threw mean the SDK exhausted all `maxRetries` attempts; errors with `retryable: false` were thrown on the first attempt without any retry.",
      },
      {
        type: "code",
        language: "typescript",
        title: "Structured error logging",
        code: `import { TalonicError } from '@talonic/node'

async function extractWithLogging(filePath: string, schemaId: string) {
  try {
    return await talonic.extract({ file_path: filePath, schema_id: schemaId })
  } catch (err) {
    if (err instanceof TalonicError) {
      // Structured log entry safe for metrics and alerting
      const logEntry = {
        level: 'error',
        service: 'extraction-pipeline',
        error_code: err.code,        // 'invalid_schema', 'rate_limited', etc.
        http_status: err.status,     // 422, 429, 500, or 0 for transport errors
        request_id: err.requestId,   // server trace ID
        retryable: err.retryable,    // was this retried?
        error_class: err.name,       // 'TalonicValidationError', etc.
        message: err.message,
        file: filePath,
        schema_id: schemaId,
      }
      console.error(JSON.stringify(logEntry))
    }
    throw err
  }
}`,
      },
      {
        type: "paragraph",
        text: 'For logging and observability, capture `err.code`, `err.status`, and `err.requestId` on every failure. The `code` is a machine-readable string like `"invalid_schema"` or `"rate_limited"` that is safe to use in metrics and alerting rules. The `err.name` property gives you the class name (e.g. `\'TalonicValidationError\'`) which is useful for grouping errors by category in your monitoring dashboard.',
      },
      {
        type: "code",
        language: "typescript",
        title: "Rate-limit-aware retry wrapper",
        code: `import { TalonicRateLimitError, TalonicError } from '@talonic/node'

// Retry wrapper that waits for rate limit reset
async function extractWithRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof TalonicRateLimitError && attempt < maxAttempts - 1) {
        const waitMs = err.rateLimit.resetAt.getTime() - Date.now()
        if (waitMs > 0 && waitMs < 120_000) {
          console.log(\`Rate limited. Waiting \${Math.ceil(waitMs / 1000)}s...\`)
          await new Promise(r => setTimeout(r, waitMs + 100))
          continue
        }
      }
      throw err
    }
  }
  throw new Error('Unreachable')
}

// Usage
const result = await extractWithRateLimitRetry(() =>
  talonic.extract({ file_path: './doc.pdf', schema_id: 'sch_abc123' })
)`,
      },
      {
        type: "paragraph",
        text: "When building extraction pipelines that process many documents, consider wrapping your calls in a function that distinguishes between recoverable and terminal errors. Errors with `retryable: true` (rate limits, server errors, network issues, timeouts) may succeed if retried later. Errors with `retryable: false` (auth, validation, not found) indicate a problem with the request itself and should be logged and skipped. This pattern is especially useful for batch processing where you want to continue with remaining documents rather than failing the entire batch.",
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
          "Catch TalonicRateLimitError and read err.rateLimit.resetAt to know when to retry. The SDK retries rate-limited requests automatically up to maxRetries times first, respecting the X-RateLimit-Reset header. The error is only thrown after all retries are exhausted.",
      },
      {
        question: "What is the retryable property on errors?",
        answer:
          "It indicates whether the SDK considers the failure worth retrying. Errors thrown after retries are exhausted still carry retryable: true, meaning they could succeed on a future attempt. Use this to decide whether to queue the request for later processing or surface it to the user immediately.",
      },
      {
        question: "How should I log Talonic errors?",
        answer:
          "Capture err.code (machine-readable string), err.status (HTTP status or 0), err.requestId (server-side trace ID), err.name (class name), and err.message. The code field is stable and safe for metrics and alerting rules. Include requestId in support tickets for server-side debugging.",
      },
      {
        question: "Should I order instanceof checks from specific to general?",
        answer:
          "Yes. Always check the most specific error subclass first (e.g. TalonicRateLimitError before TalonicError). Since all errors extend TalonicError, placing the base class check first would catch everything and prevent the more specific handlers from running.",
      },
      {
        question: "How do I handle errors in batch processing pipelines?",
        answer:
          "Check err.retryable to distinguish recoverable from terminal errors. Errors with retryable: true (rate limits, server errors, network issues) may succeed later. Errors with retryable: false (auth, validation, not found) indicate a problem with the request itself. Log terminal errors and continue processing remaining documents rather than failing the entire batch.",
      },
    ],
    mentions: ["try/catch", "instanceof", "rate limit", "requestId"],
  },
]
