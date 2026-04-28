import { describe, expect, it } from "vitest"
import { VERSION } from "../src/index"

describe("@talonic/node skeleton", () => {
  it("exports a VERSION constant", () => {
    expect(VERSION).toBe("0.1.0")
  })

  it("VERSION is a string", () => {
    expect(typeof VERSION).toBe("string")
  })
})
