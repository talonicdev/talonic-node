import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'error-classes',
    parentSlug: 'errors',
    title: 'Error Classes',
    seoTitle: 'Error Classes — Talonic Node SDK',
    description: 'Every Talonic SDK failure is a typed TalonicError subclass with status, code, and requestId for debugging.',
    content: [
      { type: 'paragraph', text: 'Every failure is a `TalonicError` subclass with `status`, `code`, and `requestId` properties.' },
      { type: 'code', language: 'typescript', title: 'Available error classes', code: `import {
  TalonicError,           // base
  TalonicAuthError,       // 401, 403
  TalonicNotFoundError,   // 404
  TalonicValidationError, // 400, 409, 413, 422
  TalonicRateLimitError,  // 429 (after retries exhausted)
  TalonicServerError,     // 500, 502, 503, 504 (after retries exhausted)
  TalonicNetworkError,    // DNS / TCP failures
  TalonicTimeoutError,    // request exceeded timeout
} from "@talonic/node"` },
    ],
    related: [
      { label: 'Error Handling', slug: 'error-handling' },
      { label: 'Retries & Backoff', slug: 'retries' },
    ],
    faq: [
      { question: 'What error types does the Talonic SDK throw?', answer: 'The SDK throws typed subclasses of TalonicError: TalonicAuthError (401/403), TalonicNotFoundError (404), TalonicValidationError (400/409/413/422), TalonicRateLimitError (429), TalonicServerError (5xx), TalonicNetworkError, and TalonicTimeoutError.' },
    ],
    mentions: ['TalonicError', 'error handling', 'status codes'],
  },
  {
    slug: 'error-handling',
    parentSlug: 'errors',
    title: 'Error Handling',
    seoTitle: 'Error Handling — Talonic Node SDK',
    description: 'Pattern for catching and handling Talonic SDK errors with instanceof checks and rate limit metadata.',
    content: [
      { type: 'code', language: 'typescript', title: 'Catch pattern', code: `try {
  await talonic.extract({ ... })
} catch (err) {
  if (err instanceof TalonicRateLimitError) {
    console.log(\`Reset at \${err.rateLimit.resetAt}\`)
  } else if (err instanceof TalonicError) {
    console.error(\`\${err.code} (status \${err.status}, request \${err.requestId}): \${err.message}\`)
  }
}` },
      { type: 'paragraph', text: '`TalonicRateLimitError` includes a `rateLimit` object with `resetAt` (Date) for scheduling retries. All errors include `requestId` for support debugging.' },
    ],
    related: [
      { label: 'Error Classes', slug: 'error-classes' },
      { label: 'Retries & Backoff', slug: 'retries' },
    ],
    faq: [
      { question: 'How do I handle rate limits in the Talonic SDK?', answer: 'Catch TalonicRateLimitError and read err.rateLimit.resetAt to know when to retry. The SDK also retries rate-limited requests automatically up to maxRetries.' },
    ],
    mentions: ['try/catch', 'instanceof', 'rate limit', 'requestId'],
  },
];
