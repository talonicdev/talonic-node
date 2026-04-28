import { describe, expect, it } from "vitest"
import {
  TalonicAuthError,
  TalonicError,
  TalonicNetworkError,
  TalonicNotFoundError,
  TalonicRateLimitError,
  TalonicServerError,
  TalonicTimeoutError,
  TalonicValidationError,
  errorFromResponse,
} from "../src/errors"

const apiBody = (code: string, message: string, retryable = false) => ({
  error: { code, message, retryable, request_id: "req_test" },
})

describe("TalonicError class hierarchy", () => {
  it("base class carries all expected fields", () => {
    const err = new TalonicError({
      code: "test_error",
      message: "test message",
      status: 500,
      retryable: true,
      requestId: "req_abc",
    })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(TalonicError)
    expect(err.name).toBe("TalonicError")
    expect(err.code).toBe("test_error")
    expect(err.message).toBe("test message")
    expect(err.status).toBe(500)
    expect(err.retryable).toBe(true)
    expect(err.requestId).toBe("req_abc")
  })

  it("subclasses identify themselves by name", () => {
    const auth = new TalonicAuthError({
      code: "unauthorized",
      message: "no",
      status: 401,
      retryable: false,
    })
    expect(auth).toBeInstanceOf(TalonicError)
    expect(auth).toBeInstanceOf(TalonicAuthError)
    expect(auth.name).toBe("TalonicAuthError")
  })
})

describe("errorFromResponse status mapping (nested envelope)", () => {
  it("401 -> TalonicAuthError", () => {
    const err = errorFromResponse({ status: 401, body: apiBody("unauthorized", "bad key") })
    expect(err).toBeInstanceOf(TalonicAuthError)
    expect(err.code).toBe("unauthorized")
    expect(err.requestId).toBe("req_test")
  })

  it("403 -> TalonicAuthError", () => {
    const err = errorFromResponse({ status: 403, body: apiBody("forbidden", "no perms") })
    expect(err).toBeInstanceOf(TalonicAuthError)
  })

  it("404 -> TalonicNotFoundError", () => {
    const err = errorFromResponse({ status: 404, body: apiBody("not_found", "missing") })
    expect(err).toBeInstanceOf(TalonicNotFoundError)
  })

  it("400 -> TalonicValidationError", () => {
    const err = errorFromResponse({ status: 400, body: apiBody("bad_request", "malformed") })
    expect(err).toBeInstanceOf(TalonicValidationError)
  })

  it("422 -> TalonicValidationError", () => {
    const err = errorFromResponse({ status: 422, body: apiBody("unprocessable", "bad doc") })
    expect(err).toBeInstanceOf(TalonicValidationError)
  })

  it("409 -> TalonicValidationError", () => {
    const err = errorFromResponse({ status: 409, body: apiBody("conflict", "race") })
    expect(err).toBeInstanceOf(TalonicValidationError)
  })

  it("413 -> TalonicValidationError", () => {
    const err = errorFromResponse({ status: 413, body: apiBody("file_too_large", "too big") })
    expect(err).toBeInstanceOf(TalonicValidationError)
  })

  it("429 -> TalonicRateLimitError with rate-limit info", () => {
    const err = errorFromResponse({
      status: 429,
      body: apiBody("rate_limited", "slow down", true),
      rateLimit: { limit: 50, remaining: 0, resetAt: new Date(1234567890 * 1000) },
    })
    expect(err).toBeInstanceOf(TalonicRateLimitError)
    if (err instanceof TalonicRateLimitError) {
      expect(err.rateLimit.limit).toBe(50)
      expect(err.rateLimit.remaining).toBe(0)
      expect(err.rateLimit.resetAt.getTime()).toBe(1234567890 * 1000)
    }
  })

  it("500 -> TalonicServerError, retryable", () => {
    const err = errorFromResponse({ status: 500, body: apiBody("internal_error", "boom", true) })
    expect(err).toBeInstanceOf(TalonicServerError)
    expect(err.retryable).toBe(true)
  })

  it("503 -> TalonicServerError", () => {
    const err = errorFromResponse({
      status: 503,
      body: apiBody("service_unavailable", "down", true),
    })
    expect(err).toBeInstanceOf(TalonicServerError)
  })

  it("502 and 504 also map to TalonicServerError", () => {
    expect(errorFromResponse({ status: 502, body: undefined })).toBeInstanceOf(TalonicServerError)
    expect(errorFromResponse({ status: 504, body: undefined })).toBeInstanceOf(TalonicServerError)
  })

  it("falls back gracefully when body is missing or not an error envelope", () => {
    const err = errorFromResponse({ status: 500, body: undefined })
    expect(err).toBeInstanceOf(TalonicServerError)
    expect(err.code).toBe("internal_error")
    expect(err.retryable).toBe(true)

    const err2 = errorFromResponse({ status: 400, body: { not: "an error" } })
    expect(err2).toBeInstanceOf(TalonicValidationError)
    expect(err2.code).toBe("bad_request")
  })

  it("prefers retryable from API body when present", () => {
    const err = errorFromResponse({
      status: 500,
      body: { error: { code: "boom", message: "boom", retryable: false } },
    })
    expect(err.retryable).toBe(false)
  })
})

describe("errorFromResponse status mapping (flat envelope, prod shape)", () => {
  // The Talonic API returns errors in a flat shape with top-level
  // `code`, `message`, `error` (string), `retryable`, `timestamp`, `path`.
  const flatBody = (status: number, code: string, message: string, retryable = false) => ({
    statusCode: status,
    code,
    error: defaultErrorString(status),
    message,
    retryable,
    timestamp: "2026-04-28T14:35:13.410Z",
    path: "/v1/something",
  })

  it("400 -> TalonicValidationError, surfaces real message", () => {
    const err = errorFromResponse({
      status: 400,
      body: flatBody(400, "BAD_REQUEST", "Invalid schema definition"),
    })
    expect(err).toBeInstanceOf(TalonicValidationError)
    expect(err.code).toBe("BAD_REQUEST")
    expect(err.message).toBe("Invalid schema definition")
  })

  it("401 -> TalonicAuthError with code AUTH_REQUIRED", () => {
    const err = errorFromResponse({
      status: 401,
      body: flatBody(401, "AUTH_REQUIRED", "Unauthorized"),
    })
    expect(err).toBeInstanceOf(TalonicAuthError)
    expect(err.code).toBe("AUTH_REQUIRED")
    expect(err.message).toBe("Unauthorized")
  })

  it("500 -> TalonicServerError with INTERNAL_ERROR", () => {
    const err = errorFromResponse({
      status: 500,
      body: flatBody(500, "INTERNAL_ERROR", "Internal server error", false),
    })
    expect(err).toBeInstanceOf(TalonicServerError)
    expect(err.code).toBe("INTERNAL_ERROR")
    expect(err.message).toBe("Internal server error")
  })

  it("respects retryable: false from a flat envelope", () => {
    const err = errorFromResponse({
      status: 500,
      body: flatBody(500, "INTERNAL_ERROR", "Internal server error", false),
    })
    expect(err.retryable).toBe(false)
  })

  it("respects retryable: true from a flat envelope", () => {
    const err = errorFromResponse({
      status: 503,
      body: flatBody(503, "SERVICE_UNAVAILABLE", "Service unavailable", true),
    })
    expect(err.retryable).toBe(true)
  })
})

function defaultErrorString(status: number): string {
  if (status === 400) return "Bad Request"
  if (status === 401) return "Unauthorized"
  if (status === 404) return "Not Found"
  if (status === 422) return "Unprocessable Entity"
  if (status === 429) return "Too Many Requests"
  if (status === 500) return "Internal Server Error"
  if (status === 503) return "Service Unavailable"
  return "Error"
}

describe("TalonicNetworkError", () => {
  it("is retryable with status 0", () => {
    const err = new TalonicNetworkError({ message: "DNS failure" })
    expect(err.retryable).toBe(true)
    expect(err.status).toBe(0)
    expect(err.code).toBe("network_error")
  })

  it("preserves the cause for debugging", () => {
    const original = new Error("ECONNRESET")
    const err = new TalonicNetworkError({ message: "wrapped", cause: original })
    expect((err as { cause?: unknown }).cause).toBe(original)
  })
})

describe("TalonicTimeoutError", () => {
  it("is retryable, status 0, and exposes the timeout value", () => {
    const err = new TalonicTimeoutError({ message: "timed out", timeoutMs: 60000 })
    expect(err.retryable).toBe(true)
    expect(err.status).toBe(0)
    expect(err.code).toBe("timeout")
    expect(err.timeoutMs).toBe(60000)
  })
})
