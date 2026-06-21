// App-level test using Zapier's createAppTester. We stub the SDK's
// network call by replacing Talonic.prototype.extract, so no live key is
// needed and no real HTTP happens. This exercises the full app definition
// (auth shape, input mapping, output trimming) end to end.

const zapier = require("zapier-platform-core")
const { Talonic } = require("@talonic/node")
const App = require("../src/index")
const appTester = zapier.createAppTester(App)

function cannedResult() {
  return {
    extraction_id: "ext_123",
    status: "completed",
    document: { id: "doc_1", filename: "invoice.pdf", type_detected: "invoice", language_detected: "en", pages: 2 },
    data: { vendor_name: "ACME", total_amount: 42 },
    schema: { definition: { vendor_name: "string", total_amount: "number" } },
    confidence: { overall: 0.97, fields: { vendor_name: 0.99 } },
  }
}

let extractSpy

beforeEach(() => {
  extractSpy = vi.spyOn(Talonic.prototype, "extract").mockResolvedValue(cannedResult())
})

afterEach(() => {
  extractSpy.mockRestore()
})

describe("Talonic Zapier app", () => {
  it("registers a custom API-key auth and one create", () => {
    expect(App.authentication.type).toBe("custom")
    expect(App.authentication.fields[0].key).toBe("apiKey")
    expect(App.creates.extract_document).toBeDefined()
    expect(App.creates.extract_document.display.label).toBe("Extract Structured Data")
  })

  it("perform maps file_url + schema through the SDK and returns trimmed output", async () => {
    const bundle = {
      authData: { apiKey: "tlnc_test" },
      inputData: { file_url: "https://example.com/invoice.pdf", schema: '{"vendor_name":"string"}' },
    }
    const result = await appTester(App.creates.extract_document.operation.perform, bundle)

    expect(extractSpy).toHaveBeenCalledWith({
      file_url: "https://example.com/invoice.pdf",
      schema: { vendor_name: "string" },
    })
    expect(result).toMatchObject({
      extraction_id: "ext_123",
      data: { vendor_name: "ACME", total_amount: 42 },
      schema: { vendor_name: "string", total_amount: "number" },
      document: { id: "doc_1" },
    })
  })

  it("supports auto-schema (no schema) and document_id source", async () => {
    const bundle = { authData: { apiKey: "tlnc_test" }, inputData: { document_id: "doc_99" } }
    await appTester(App.creates.extract_document.operation.perform, bundle)
    expect(extractSpy).toHaveBeenCalledWith({ document_id: "doc_99" })
  })

  it("treats a Zapier hydrate file URL as file_url", async () => {
    const bundle = {
      authData: { apiKey: "tlnc_test" },
      inputData: { file: "https://zapier-hydrate.example/file.pdf" },
    }
    await appTester(App.creates.extract_document.operation.perform, bundle)
    expect(extractSpy).toHaveBeenCalledWith({ file_url: "https://zapier-hydrate.example/file.pdf" })
  })

  it("rejects when no document source is provided", async () => {
    const bundle = { authData: { apiKey: "tlnc_test" }, inputData: { schema: '{"a":"string"}' } }
    await expect(
      appTester(App.creates.extract_document.operation.perform, bundle),
    ).rejects.toThrow(/document source/)
    expect(extractSpy).not.toHaveBeenCalled()
  })
})
