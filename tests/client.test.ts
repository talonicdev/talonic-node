import { describe, expect, it, vi } from "vitest"
import { Talonic } from "../src/client"

describe("Talonic class", () => {
  it("constructs with a valid apiKey", () => {
    expect(() => new Talonic({ apiKey: "tlnc_test" })).not.toThrow()
  })

  it("rejects an empty apiKey", () => {
    expect(() => new Talonic({ apiKey: "" })).toThrow(/apiKey/)
  })

  it("rejects a missing apiKey", () => {
    expect(() => new Talonic({} as unknown as { apiKey: string })).toThrow(/apiKey/)
  })

  it("accepts a custom fetch", () => {
    const fetchFn = vi.fn()
    expect(
      () => new Talonic({ apiKey: "k", fetch: fetchFn as unknown as typeof fetch }),
    ).not.toThrow()
  })

  it("accepts custom baseUrl, timeout, and maxRetries", () => {
    expect(
      () =>
        new Talonic({
          apiKey: "k",
          baseUrl: "https://staging.api.talonic.com",
          timeout: 30_000,
          maxRetries: 5,
        }),
    ).not.toThrow()
  })

  it("does not expose internal transport in the public type surface", () => {
    // The `#transport` field is truly private and must not appear on
    // the runtime object surface either.
    const t = new Talonic({ apiKey: "k" }) as unknown as Record<string, unknown>
    expect(t.transport).toBeUndefined()
    expect(t["#transport"]).toBeUndefined()
  })
})
