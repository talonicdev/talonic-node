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
 * Per-call cost information parsed from the `X-Talonic-Cost-*` and
 * `X-Talonic-Balance-*` response headers. Populated on extract calls;
 * `null` on every other endpoint.
 *
 * @public
 */
export interface CostInfo {
  /** Credits consumed by this call. */
  costCredits: number
  /** Approximate EUR cost of this call. */
  costEur: number
  /** Workspace credit balance after this call settled. */
  balanceCredits: number
  /** Cells resolved from the materialized field-registry (cheap path). */
  cellsResolvedRegistry: number
  /** Cells resolved by AI extraction (priced path). */
  cellsResolvedAi: number
}

/**
 * Extends a response type `T` with response-side metadata parsed from
 * Talonic's `X-RateLimit-*` and `X-Talonic-*` headers.
 *
 * `rateLimit` is `null` when the response did not include any
 * `X-RateLimit-*` headers. This typically means the endpoint or
 * workspace tier has no configured limit (e.g. enterprise / unlimited),
 * or the response came from a path that does not run through the
 * rate-limit interceptor. Treat `null` as "rate-limit information is
 * not available for this response" rather than as "zero requests
 * remaining".
 *
 * `cost` is `null` on every endpoint that is not extract; the API only
 * sets `X-Talonic-Cost-*` headers on `/v1/extract` responses today. On
 * extract responses, `cost.balanceCredits` is the post-call workspace
 * balance, `cost.costCredits` / `cost.costEur` are the per-call charge,
 * and the `cellsResolved*` fields explain the registry-vs-AI split.
 *
 * @public
 */
export type WithRateLimit<T> = T & {
  rateLimit: RateLimitInfo | null
  cost: CostInfo | null
}

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
