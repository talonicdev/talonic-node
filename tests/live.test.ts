import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { Talonic } from "../src/client"

const apiKey = process.env["TALONIC_API_KEY"]
const baseUrl = process.env["TALONIC_BASE_URL"]
const testFile = process.env["TALONIC_TEST_FILE"]

const liveDescribe = apiKey ? describe : describe.skip
const itIfFile = testFile && existsSync(testFile) ? it : it.skip

liveDescribe("LIVE: against api.talonic.com (skipped without TALONIC_API_KEY)", () => {
  const talonic = new Talonic({
    apiKey: apiKey!,
    ...(baseUrl ? { baseUrl } : {}),
  })

  it("schemas.list returns an array", async () => {
    const result = await talonic.schemas.list()
    expect(Array.isArray(result.data)).toBe(true)
    console.log(`[live] schemas.list -> ${result.data.length} schema(s)`)
  }, 60_000)

  it("documents.list returns an array", async () => {
    const result = await talonic.documents.list({ per_page: 5 })
    expect(Array.isArray(result.data)).toBe(true)
    console.log(`[live] documents.list -> ${result.data.length} document(s)`)
  }, 60_000)

  itIfFile(
    "extract from a real PDF with a flat-map schema",
    async () => {
      // Auto-discovery (no schema) currently 500s on production. The
      // simplified-fields shape sometimes hangs. Flat-map is the format
      // we have proven works end to end.
      const result = await talonic.extract({
        file_path: testFile!,
        schema: { title: "string", summary: "string" },
      })
      expect(result.extraction_id).toBeTruthy()
      expect(result.document.id).toBeTruthy()
      expect(typeof result.data).toBe("object")
      console.log("[live] extract succeeded:", {
        extraction_id: result.extraction_id,
        document_id: result.document.id,
        type_detected: result.document.type_detected,
        confidence: result.confidence?.overall,
        data_keys: Object.keys(result.data ?? {}),
      })
    },
    120_000,
  )
})
