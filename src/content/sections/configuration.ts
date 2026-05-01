import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'client-options',
    parentSlug: 'configuration',
    title: 'Client Options',
    seoTitle: 'Configuration — Talonic Node SDK',
    description: 'Configure the Talonic client with API key, base URL, timeout, retries, and custom fetch.',
    content: [
      { type: 'code', language: 'typescript', title: 'All options', code: `const talonic = new Talonic({
  apiKey: process.env.TALONIC_API_KEY!,
  baseUrl: "https://api.talonic.com",   // default
  timeout: 60_000,                       // ms; default 60s
  maxRetries: 3,                         // 429, 500, 502, 503, 504, network, timeout
  fetch: customFetch,                    // optional override (e.g. for testing)
})` },
      { type: 'param-table', params: [
        { name: 'apiKey', type: 'string', required: true, description: 'Your Talonic API key. Starts with `tlnc_`.' },
        { name: 'baseUrl', type: 'string', description: 'API base URL.', default: 'https://api.talonic.com' },
        { name: 'timeout', type: 'number', description: 'Request timeout in milliseconds.', default: '60000' },
        { name: 'maxRetries', type: 'number', description: 'Max retry attempts for transient failures.', default: '3' },
        { name: 'fetch', type: 'function', description: 'Custom fetch implementation for testing or proxying.' },
      ]},
    ],
    related: [
      { label: 'Retries & Backoff', slug: 'retries' },
      { label: 'Install', slug: 'install' },
    ],
    faq: [
      { question: 'How do I configure the Talonic SDK client?', answer: 'Pass an options object to new Talonic() with apiKey (required), and optional baseUrl, timeout, maxRetries, and fetch.' },
    ],
    mentions: ['configuration', 'apiKey', 'timeout', 'maxRetries'],
  },
  {
    slug: 'retries',
    parentSlug: 'configuration',
    title: 'Retries & Backoff',
    seoTitle: 'Retries & Backoff — Talonic Node SDK',
    description: 'How the Talonic SDK handles automatic retries with exponential backoff and jitter for transient failures.',
    content: [
      { type: 'paragraph', text: 'The SDK retries automatically on `429` (respecting `X-RateLimit-Reset`), `500`, `502`, `503`, `504`, network errors, and timeouts. Backoff is exponential with jitter, capped at 16s.' },
      { type: 'paragraph', text: 'The API may set `retryable: false` on a specific error; the SDK respects that and does not retry.' },
      { type: 'callout', text: 'Rate limit retries respect the `X-RateLimit-Reset` header from the API, so the SDK waits the exact right amount of time before retrying a 429.' },
    ],
    related: [
      { label: 'Client Options', slug: 'client-options' },
      { label: 'Error Classes', slug: 'error-classes' },
    ],
    faq: [
      { question: 'Does the Talonic SDK retry failed requests?', answer: 'Yes. It retries on 429, 500, 502, 503, 504, network errors, and timeouts with exponential backoff and jitter, up to maxRetries attempts.' },
    ],
    mentions: ['retry', 'backoff', 'rate limit', '429'],
  },
];
