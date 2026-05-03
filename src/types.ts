/**
 * Configuration for the Talonic client.
 *
 * @public
 */
export interface TalonicConfig {
  /**
   * Your Talonic API key. Starts with `tlnc_`.
   * Get one at https://app.talonic.com.
   */
  apiKey: string

  /**
   * Override the API base URL.
   * Default: `https://api.talonic.com`.
   */
  baseUrl?: string

  /**
   * Per-request timeout in milliseconds.
   * Default: 60000 (60 seconds).
   */
  timeout?: number

  /**
   * Maximum number of automatic retries for retryable failures
   * (429 rate-limited, 500 internal_error, 503 service_unavailable,
   * network errors, timeouts).
   *
   * Default: 3. Set to 0 to disable retries.
   */
  maxRetries?: number

  /**
   * Custom fetch implementation. Useful for testing, instrumentation,
   * or environments that need a polyfill. Defaults to the global fetch.
   */
  fetch?: typeof fetch
}

/**
 * Rate-limit information parsed from the `X-RateLimit-*` headers
 * returned by every API response.
 *
 * @public
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the current window. */
  limit: number
  /** Requests remaining in the current window. */
  remaining: number
  /** Date when the current window resets. */
  resetAt: Date
}

/**
 * Extends a response type `T` with rate-limit metadata parsed from
 * the `X-RateLimit-*` response headers. Every SDK method returns
 * `WithRateLimit<T>`, so `result.rateLimit` is always available.
 *
 * @public
 */
export type WithRateLimit<T> = T & { rateLimit: RateLimitInfo }

/**
 * Internal request options consumed by the transport layer.
 *
 * Not part of the public SDK surface.
 *
 * @internal
 */
export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /**
   * Request path. Either an absolute path beginning with `/` or a path
   * relative to the configured baseUrl. Will be joined with baseUrl.
   */
  path: string
  /**
   * Query-string parameters. `undefined` and `null` values are dropped.
   */
  query?: Record<string, string | number | boolean | undefined | null>
  /**
   * Request body. Plain objects are JSON-serialized. `FormData`,
   * strings, and binary types are passed through unchanged.
   */
  body?: unknown
  /**
   * Extra headers to merge onto the default set. Keys are case-insensitive.
   */
  headers?: Record<string, string>
  /**
   * Optional AbortSignal for caller-driven cancellation.
   */
  signal?: AbortSignal
}
