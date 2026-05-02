import { describe, expect, it } from "vitest"
import { VERSION } from "../src/index"

describe("@talonic/node skeleton", () => {
  it("exports a VERSION constant matching package.json", async () => {
    // @ts-ignore — JSON import
    const pkg = await import("../package.json")
    expect(VERSION).toBe(pkg.version)
  })

  it("VERSION is a string", () => {
    expect(typeof VERSION).toBe("string")
  })
})
