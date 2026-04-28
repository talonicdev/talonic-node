import {
  TalonicError,
  TalonicNetworkError,
  TalonicRateLimitError,
  TalonicTimeoutError,
  errorFromResponse,
} from "./errors.js"
import type { RateLimitInfo, RequestOptions, TalonicConfig } from "./types.js"
import { VERSION } from "./version.js"

const DEFAULT_BASE_URL = "https://api.talonic.com"
const DEFAULT_TIMEOUT_MS = 60_000
const DEFAULT_MAX_RETRIES = 3
const MAX_BACKOFF_MS = 16_000
const MAX_RATE_LIMIT_WAIT_MS = 60_000

/**
 * The body shape accepted by the global fetch implementation.
 * Derived from the standard `RequestInit` interface so we do not
 * have to depend on the DOM lib or `undici-types` directly.
 *
 * @internal
 */
type FetchBody = NonNullable<RequestInit["body"]>

/**
 * Configuration with defaults applied. Used internally by Transport.
 *
 * @internal
 */
interface ResolvedConfig {
  apiKey: string
  baseUrl: string
  timeout: number
  maxRetries: number
  fetch: typeof fetch
}

/**
 * Result of a successful HTTP request, returned to higher-level methods.
 *
 * @internal
 */
export interface RequestResult<T> {
  /** Parsed response body. */
  data: T
  /** Rate-limit headers from the response. */
  rateLimit: RateLimitInfo
  /** Server-assigned request ID, if present. */
  requestId?: string
  /** HTTP status code (always 2xx for successful results). */
  status: number
}

/**
 * Low-level HTTP transport. Owns auth, retries, timeouts, error mapping,
 * and rate-limit header parsing. Higher-level Talonic methods build on this.
 *
 * @internal
 */
export class Transport {
  readonly #config: ResolvedConfig

  constructor(config: TalonicConfig) {
    if (typeof config?.apiKey !== "string" || config.apiKey.length === 0) {
      throw new TypeError("Talonic: apiKey is required")
    }

    const fetchFn = config.fetch ?? globalThis.fetch
    if (typeof fetchFn !== "function") {
      throw new TypeError(
        "Talonic: no fetch implementation available. Provide one via config.fetch on Node < 18.",
      )
    }

    this.#config = {
      apiKey: config.apiKey,
      baseUrl: stripTrailingSlash(config.baseUrl ?? DEFAULT_BASE_URL),
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES,
      fetch: fetchFn,
    }
  }

  /**
   * Perform an HTTP request, retrying transient failures (429, 5xx,
   * network errors, timeouts) up to `maxRetries` times.
   *
   * Throws a TalonicError subclass on terminal failures.
   */
  async request<T>(opts: RequestOptions): Promise<RequestResult<T>> {
    let attempt = 0
    let lastError: TalonicError | undefined

    while (attempt <= this.#config.maxRetries) {
      try {
        return await this.#requestOnce<T>(opts)
      } catch (err) {
        lastError = this.#normalizeError(err)

        if (!lastError.retryable || attempt === this.#config.maxRetries) {
          throw lastError
        }

        await sleep(computeBackoffMs(attempt, lastError))
        attempt += 1
      }
    }

    // Defensive: the loop always either returns or throws.
    throw (
      lastError ??
      new TalonicError({
        code: "unknown_error",
        message: "Request failed",
        status: 0,
        retryable: false,
      })
    )
  }

  async #requestOnce<T>(opts: RequestOptions): Promise<RequestResult<T>> {
    const url = this.#buildUrl(opts.path, opts.query)
    const headers = this.#buildHeaders(opts.headers, opts.body)
    const body = serializeBody(opts.body)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.#config.timeout)

    if (opts.signal) {
      if (opts.signal.aborted) {
        controller.abort()
      } else {
        opts.signal.addEventListener("abort", () => controller.abort(), { once: true })
      }
    }

    let response: Response
    try {
      response = await this.#config.fetch(url, {
        method: opts.method,
        headers,
        body,
        signal: controller.signal,
      })
    } catch (err) {
      if (isAbortError(err)) {
        throw new TalonicTimeoutError({
          message: `Request timed out after ${this.#config.timeout}ms`,
          timeoutMs: this.#config.timeout,
        })
      }
      throw new TalonicNetworkError({
        message: err instanceof Error ? err.message : String(err),
        cause: err,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const rateLimit = parseRateLimit(response.headers)
    const responseBody = await readResponseBody(response)
    const requestId = response.headers.get("x-request-id") ?? undefined

    if (!response.ok) {
      throw errorFromResponse({ status: response.status, body: responseBody, rateLimit })
    }

    return {
      data: responseBody as T,
      rateLimit,
      requestId,
      status: response.status,
    }
  }

  #buildUrl(path: string, query?: RequestOptions["query"]): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`
    const url = new URL(this.#config.baseUrl + normalizedPath)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  #buildHeaders(custom: Record<string, string> = {}, body: unknown): Record<string, string> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.#config.apiKey}`,
      "user-agent": `talonic-node/${VERSION}`,
      accept: "application/json",
    }
    for (const [key, value] of Object.entries(custom)) {
      headers[key.toLowerCase()] = value
    }
    if (body !== undefined && !(body instanceof FormData) && !headers["content-type"]) {
      headers["content-type"] = "application/json"
    }
    return headers
  }

  #normalizeError(err: unknown): TalonicError {
    if (err instanceof TalonicError) return err
    return new TalonicNetworkError({
      message: err instanceof Error ? err.message : String(err),
      cause: err,
    })
  }
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function serializeBody(body: unknown): FetchBody | undefined {
  if (body === undefined) return undefined
  if (body instanceof FormData) return body
  if (typeof body === "string") return body
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return body as FetchBody
  return JSON.stringify(body)
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      return undefined
    }
  }
  const text = await response.text()
  return text.length > 0 ? text : undefined
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const limit = parseIntHeader(headers.get("x-ratelimit-limit"), 0)
  const remaining = parseIntHeader(headers.get("x-ratelimit-remaining"), 0)
  const resetUnix = parseIntHeader(headers.get("x-ratelimit-reset"), 0)
  return {
    limit,
    remaining,
    resetAt: new Date(resetUnix * 1000),
  }
}

function parseIntHeader(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function computeBackoffMs(attempt: number, error: TalonicError): number {
  // For rate-limit errors, respect the server-provided reset timestamp.
  if (error instanceof TalonicRateLimitError) {
    const waitMs = error.rateLimit.resetAt.getTime() - Date.now()
    if (waitMs > 0 && waitMs < MAX_RATE_LIMIT_WAIT_MS) {
      return waitMs + 100
    }
  }
  // Otherwise exponential backoff with jitter: 1s, 2s, 4s, capped at 16s.
  const base = Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS)
  const jitter = Math.random() * 250
  return base + jitter
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && (err as { name?: unknown }).name === "AbortError"
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
