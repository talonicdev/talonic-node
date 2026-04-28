import type { RateLimitInfo } from "./types.js"

/**
 * Constructor argument shape shared by every TalonicError subclass.
 *
 * @internal
 */
interface TalonicErrorInit {
  code: string
  message: string
  status: number
  retryable: boolean
  requestId?: string
}

/**
 * Base error class for every failure raised by the Talonic SDK.
 *
 * Every subclass carries:
 * - `code`: machine-readable string from the API (e.g. `invalid_schema`).
 * - `status`: HTTP status code, or 0 for transport-level failures.
 * - `retryable`: whether the SDK considers the failure retryable.
 * - `requestId`: server-assigned request ID for support and debugging.
 *
 * Use `instanceof` against the more specific subclasses
 * (TalonicAuthError, TalonicValidationError, etc.) when you need to
 * branch on different failure modes.
 *
 * @public
 */
export class TalonicError extends Error {
  readonly code: string
  readonly status: number
  readonly retryable: boolean
  readonly requestId?: string

  constructor(init: TalonicErrorInit) {
    super(init.message)
    this.name = "TalonicError"
    this.code = init.code
    this.status = init.status
    this.retryable = init.retryable
    this.requestId = init.requestId
  }
}

/**
 * 401 unauthorized or 403 forbidden. The API key is missing, invalid,
 * or does not have permission for the requested operation.
 *
 * @public
 */
export class TalonicAuthError extends TalonicError {
  constructor(init: TalonicErrorInit) {
    super(init)
    this.name = "TalonicAuthError"
  }
}

/**
 * 404 not found. The requested resource does not exist.
 *
 * @public
 */
export class TalonicNotFoundError extends TalonicError {
  constructor(init: TalonicErrorInit) {
    super(init)
    this.name = "TalonicNotFoundError"
  }
}

/**
 * 400 bad_request, 409 conflict, 413 file_too_large, 422 unprocessable.
 * The request was understood but rejected.
 *
 * @public
 */
export class TalonicValidationError extends TalonicError {
  constructor(init: TalonicErrorInit) {
    super(init)
    this.name = "TalonicValidationError"
  }
}

/**
 * 429 rate-limited. The SDK retries automatically, respecting the
 * `X-RateLimit-Reset` header. This error is thrown only after retries
 * are exhausted.
 *
 * @public
 */
export class TalonicRateLimitError extends TalonicError {
  /** Rate-limit headers from the response that triggered this error. */
  readonly rateLimit: RateLimitInfo

  constructor(init: TalonicErrorInit & { rateLimit: RateLimitInfo }) {
    super(init)
    this.name = "TalonicRateLimitError"
    this.rateLimit = init.rateLimit
  }
}

/**
 * 500 internal_error or 503 service_unavailable, plus 502 and 504 from
 * upstream infrastructure. These are retryable; this error is thrown
 * only after retries are exhausted.
 *
 * @public
 */
export class TalonicServerError extends TalonicError {
  constructor(init: TalonicErrorInit) {
    super(init)
    this.name = "TalonicServerError"
  }
}

/**
 * The request failed before a response was received. Includes DNS
 * failures, TCP resets, and unreachable hosts. Retried automatically.
 *
 * @public
 */
export class TalonicNetworkError extends TalonicError {
  constructor(init: { message: string; cause?: unknown }) {
    super({
      code: "network_error",
      message: init.message,
      status: 0,
      retryable: true,
    })
    this.name = "TalonicNetworkError"
    if (init.cause !== undefined) {
      ;(this as { cause?: unknown }).cause = init.cause
    }
  }
}

/**
 * The request did not complete within the configured timeout.
 * Retried automatically.
 *
 * @public
 */
export class TalonicTimeoutError extends TalonicError {
  /** Configured timeout in milliseconds. */
  readonly timeoutMs: number

  constructor(init: { message: string; timeoutMs: number }) {
    super({
      code: "timeout",
      message: init.message,
      status: 0,
      retryable: true,
    })
    this.name = "TalonicTimeoutError"
    this.timeoutMs = init.timeoutMs
  }
}

/**
 * Build the appropriate TalonicError subclass from an HTTP response.
 *
 * The Talonic API returns error bodies in a flat shape:
 *   { statusCode, code, error, message, retryable, timestamp, path }
 *
 * Some older endpoints and the public API reference document a nested
 * shape:
 *   { error: { code, message, status, retryable, request_id } }
 *
 * This function understands both. The flat shape is preferred; if it
 * does not match, the nested shape is tried; if neither matches, we
 * fall back to status-derived defaults.
 *
 * @internal
 */
export function errorFromResponse(input: {
  status: number
  body: unknown
  rateLimit?: RateLimitInfo
}): TalonicError {
  const { status, body, rateLimit } = input
  const parsed = parseApiError(body)
  const code = parsed?.code ?? defaultCodeForStatus(status)
  const message = parsed?.message ?? `HTTP ${status}`
  const requestId = parsed?.requestId
  const retryable = parsed?.retryable ?? defaultRetryableForStatus(status)

  const init: TalonicErrorInit = { code, message, status, retryable, requestId }

  if (status === 401 || status === 403) return new TalonicAuthError(init)
  if (status === 404) return new TalonicNotFoundError(init)
  if (status === 400 || status === 409 || status === 413 || status === 422) {
    return new TalonicValidationError(init)
  }
  if (status === 429) {
    return new TalonicRateLimitError({
      ...init,
      rateLimit: rateLimit ?? { limit: 0, remaining: 0, resetAt: new Date(0) },
    })
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return new TalonicServerError(init)
  }
  return new TalonicError(init)
}

/**
 * Parsed error fields, regardless of which envelope shape the API used.
 *
 * @internal
 */
interface ParsedApiError {
  code: string
  message: string
  retryable?: boolean
  requestId?: string
}

function parseApiError(body: unknown): ParsedApiError | undefined {
  if (typeof body !== "object" || body === null) return undefined
  const b = body as Record<string, unknown>

  // Flat shape (production today):
  //   { statusCode, code: "INTERNAL_ERROR", error: "Internal Server Error",
  //     message: "...", retryable: bool, timestamp, path }
  if (typeof b.code === "string" && typeof b.message === "string") {
    return {
      code: b.code,
      message: b.message,
      retryable: typeof b.retryable === "boolean" ? b.retryable : undefined,
      requestId:
        typeof b.request_id === "string"
          ? b.request_id
          : typeof b.requestId === "string"
            ? b.requestId
            : undefined,
    }
  }

  // Nested shape (per the published API reference):
  //   { error: { code, message, status, retryable, request_id } }
  if (typeof b.error === "object" && b.error !== null) {
    const inner = b.error as Record<string, unknown>
    if (typeof inner.code === "string" && typeof inner.message === "string") {
      return {
        code: inner.code,
        message: inner.message,
        retryable: typeof inner.retryable === "boolean" ? inner.retryable : undefined,
        requestId:
          typeof inner.request_id === "string"
            ? inner.request_id
            : typeof inner.requestId === "string"
              ? inner.requestId
              : undefined,
      }
    }
  }

  return undefined
}

function defaultCodeForStatus(status: number): string {
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 409) return "conflict"
  if (status === 413) return "file_too_large"
  if (status === 422) return "unprocessable"
  if (status === 429) return "rate_limited"
  if (status === 503) return "service_unavailable"
  if (status >= 500) return "internal_error"
  return "bad_request"
}

function defaultRetryableForStatus(status: number): boolean {
  return status === 429 || status >= 500
}
