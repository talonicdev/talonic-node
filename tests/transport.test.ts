import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  TalonicAuthError,
  TalonicNetworkError,
  TalonicRateLimitError,
  TalonicServerError,
  TalonicTimeoutError,
  TalonicValidationError,
} from "../src/errors"
import { Transport } from "../src/transport"

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  })
}

describe("Transport: constructor", () => {
  it("requires a non-empty apiKey", () => {
    expect(() => new Transport({ apiKey: "" })).toThrow(/apiKey/)
    expect(() => new Transport({ apiKey: undefined as unknown as string })).toThrow(/apiKey/)
  })

  it("accepts a custom fetch implementation", () => {
    const fetchFn = vi.fn()
    expect(
      () => new Transport({ apiKey: "k", fetch: fetchFn as unknown as typeof fetch }),
    ).not.toThrow()
  })

  it("throws when no fetch is available", () => {
    expect(
      () => new Transport({ apiKey: "k", fetch: undefined as unknown as typeof fetch }),
    ).not.toThrow() // should resolve to globalThis.fetch on Node 18+
  })
})

describe("Transport: successful requests", () => {
  it("sends a Bearer auth header and a User-Agent", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "tlnc_test",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await t.request({ method: "GET", path: "/v1/foo" })
    const init = fetchFn.mock.calls[0][1] as { headers: Record<string, string> }
    expect(init.headers["authorization"]).toBe("Bearer tlnc_test")
    expect(init.headers["user-agent"]).toMatch(/^talonic-node\//)
    expect(init.headers["accept"]).toBe("application/json")
  })

  it("parses rate-limit headers", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        { ok: true },
        {
          headers: {
            "x-ratelimit-limit": "2000",
            "x-ratelimit-remaining": "1847",
            "x-ratelimit-reset": "1726358400",
          },
        },
      ),
    )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    const result = await t.request({ method: "GET", path: "/v1/foo" })
    expect(result.rateLimit.limit).toBe(2000)
    expect(result.rateLimit.remaining).toBe(1847)
    expect(result.rateLimit.resetAt).toBeInstanceOf(Date)
    expect(result.rateLimit.resetAt.getTime()).toBe(1726358400 * 1000)
  })

  it("captures the request id from x-request-id", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true }, { headers: { "x-request-id": "req_abc" } }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    const result = await t.request({ method: "GET", path: "/v1/foo" })
    expect(result.requestId).toBe("req_abc")
  })

  it("serializes plain object bodies as JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await t.request({ method: "POST", path: "/v1/foo", body: { hello: "world" } })
    const init = fetchFn.mock.calls[0][1] as { body: unknown; headers: Record<string, string> }
    expect(init.body).toBe(JSON.stringify({ hello: "world" }))
    expect(init.headers["content-type"]).toBe("application/json")
  })

  it("passes FormData through and does not set content-type", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    const fd = new FormData()
    fd.append("name", "value")
    await t.request({ method: "POST", path: "/v1/foo", body: fd })
    const init = fetchFn.mock.calls[0][1] as { body: unknown; headers: Record<string, string> }
    expect(init.body).toBe(fd)
    expect(init.headers["content-type"]).toBeUndefined()
  })

  it("appends query parameters and skips undefined/null", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await t.request({
      method: "GET",
      path: "/v1/foo",
      query: { page: 1, status: "ok", missing: undefined, alsoMissing: null },
    })
    const url = fetchFn.mock.calls[0][0] as string
    expect(url).toContain("page=1")
    expect(url).toContain("status=ok")
    expect(url).not.toContain("missing")
    expect(url).not.toContain("alsoMissing")
  })

  it("strips a trailing slash from baseUrl", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      baseUrl: "https://api.example.com/",
    })
    await t.request({ method: "GET", path: "/v1/foo" })
    expect(fetchFn.mock.calls[0][0]).toBe("https://api.example.com/v1/foo")
  })

  it("normalizes paths missing a leading slash", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      baseUrl: "https://api.example.com",
    })
    await t.request({ method: "GET", path: "v1/foo" })
    expect(fetchFn.mock.calls[0][0]).toBe("https://api.example.com/v1/foo")
  })
})

describe("Transport: error mapping", () => {
  it("throws TalonicAuthError on 401", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "unauthorized", message: "bad key" } }, { status: 401 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicAuthError,
    )
  })

  it("throws TalonicValidationError on 422", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "unprocessable", message: "no" } }, { status: 422 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicValidationError,
    )
  })

  it("throws TalonicServerError on 500", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "internal_error", message: "boom" } }, { status: 500 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicServerError,
    )
  })

  it("preserves the request id on errors", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(
          { error: { code: "bad_request", message: "no", request_id: "req_xyz" } },
          { status: 400 },
        ),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toMatchObject({
      requestId: "req_xyz",
    })
  })
})

describe("Transport: retry behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("retries on 500 then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "internal_error", message: "boom" } }, { status: 500 }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 3,
    })

    const promise = t.request({ method: "GET", path: "/v1/foo" })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(result.data).toEqual({ ok: true })
  })

  it("does not retry on 400", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "bad_request", message: "no" } }, { status: 400 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 3,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicValidationError,
    )
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("retries on 429 respecting the rate-limit reset", async () => {
    const resetUnix = Math.floor(Date.now() / 1000) + 1
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { error: { code: "rate_limited", message: "wait" } },
          {
            status: 429,
            headers: {
              "x-ratelimit-limit": "50",
              "x-ratelimit-remaining": "0",
              "x-ratelimit-reset": String(resetUnix),
            },
          },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 3,
    })

    const promise = t.request({ method: "GET", path: "/v1/foo" })
    await vi.runAllTimersAsync()
    const result = await promise

    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(result.data).toEqual({ ok: true })
  })

  it("throws after exhausting retries", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "internal_error", message: "boom" } }, { status: 500 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 2,
    })

    // Capture the rejection up front so it is never "unhandled" in the
    // microtask queue while fake timers fast-forward the retry delays.
    const captured = t.request({ method: "GET", path: "/v1/foo" }).catch((e) => e)
    await vi.runAllTimersAsync()
    const err = await captured

    expect(err).toBeInstanceOf(TalonicServerError)
    expect(fetchFn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it("disables retries when maxRetries is 0", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: "internal_error", message: "boom" } }, { status: 500 }),
      )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })

    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicServerError,
    )
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it("does not retry on TalonicRateLimitError when retryable: false in body", async () => {
    // API explicitly marks the rate-limit error as non-retryable; SDK respects it.
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: { code: "rate_limited", message: "stop", retryable: false } },
        {
          status: 429,
          headers: {
            "x-ratelimit-limit": "50",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": "1",
          },
        },
      ),
    )
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 3,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicRateLimitError,
    )
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})

describe("Transport: network failures", () => {
  it("wraps generic errors as TalonicNetworkError", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicNetworkError,
    )
  })

  it("maps AbortError to TalonicTimeoutError", async () => {
    const fetchFn = vi.fn().mockImplementation(() => {
      const e = new Error("aborted") as Error & { name: string }
      e.name = "AbortError"
      return Promise.reject(e)
    })
    const t = new Transport({
      apiKey: "k",
      fetch: fetchFn as unknown as typeof fetch,
      maxRetries: 0,
      timeout: 100,
    })
    await expect(t.request({ method: "GET", path: "/v1/foo" })).rejects.toBeInstanceOf(
      TalonicTimeoutError,
    )
  })
})
