import { beforeEach, describe, expect, it, vi } from "vitest"
import { Talonic } from "../src/client"

type MockedFetch = ReturnType<typeof vi.fn>

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}

function makeClient(responseBody: unknown = { data: [], pagination: {} }) {
  const fetchFn = vi.fn().mockResolvedValue(jsonResponse(responseBody)) as MockedFetch
  const talonic = new Talonic({
    apiKey: "tlnc_test",
    fetch: fetchFn as unknown as typeof fetch,
    maxRetries: 0,
  })
  return { talonic, fetchFn }
}

function lastCall(fetchFn: MockedFetch) {
  const calls = fetchFn.mock.calls
  return calls[calls.length - 1] as [string, RequestInit]
}

describe("Talonic.extract", () => {
  let client: ReturnType<typeof makeClient>
  beforeEach(() => {
    client = makeClient({ id: "ext_1", document_id: "doc_1", status: "complete", data: {} })
  })

  it("rejects when no file source is provided", async () => {
    await expect(client.talonic.extract({})).rejects.toThrow(/file source/)
  })

  it("rejects when multiple file sources are provided", async () => {
    await expect(
      client.talonic.extract({ file_url: "https://x", document_id: "doc_1" }),
    ).rejects.toThrow(/exactly one file source/)
  })

  it("rejects when both schema and schema_id provided", async () => {
    await expect(
      client.talonic.extract({ document_id: "d", schema: {}, schema_id: "s" }),
    ).rejects.toThrow(/schema OR schema_id/)
  })

  it("posts multipart/form-data to /v1/extract", async () => {
    await client.talonic.extract({ document_id: "doc_abc", schema_id: "sch_xyz" })
    const [url, init] = lastCall(client.fetchFn)
    expect(url).toContain("/v1/extract")
    expect(init.method).toBe("POST")
    expect(init.body).toBeInstanceOf(FormData)
  })

  it("serializes inline schema as JSON in the form body", async () => {
    await client.talonic.extract({
      document_id: "doc_abc",
      schema: { vendor_name: "string" },
    })
    const [, init] = lastCall(client.fetchFn)
    const fd = init.body as FormData
    expect(fd.get("schema")).toBe(JSON.stringify({ vendor_name: "string" }))
    expect(fd.get("document_id")).toBe("doc_abc")
  })

  it("auto-populates required when schema has properties but no required", async () => {
    await client.talonic.extract({
      document_id: "doc_abc",
      schema: {
        type: "object",
        properties: {
          vendor_name: { type: "string" },
          total: { type: "number" },
        },
      },
    })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const sent = JSON.parse(fd.get("schema") as string) as {
      required: string[]
      properties: object
    }
    expect(sent.required).toEqual(["vendor_name", "total"])
    expect(sent.properties).toBeDefined()
  })

  it("does not overwrite existing required array", async () => {
    await client.talonic.extract({
      document_id: "doc_abc",
      schema: {
        type: "object",
        properties: {
          vendor_name: { type: "string" },
          total: { type: "number" },
        },
        required: ["vendor_name"],
      },
    })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const sent = JSON.parse(fd.get("schema") as string) as { required: string[] }
    expect(sent.required).toEqual(["vendor_name"])
  })

  it("skips required auto-population for non-JSON-Schema objects", async () => {
    await client.talonic.extract({
      document_id: "doc_abc",
      schema: { vendor_name: "string", total: "number" },
    })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const sent = JSON.parse(fd.get("schema") as string) as Record<string, unknown>
    expect(sent["required"]).toBeUndefined()
  })

  it("forwards instructions, options, and include_markdown", async () => {
    await client.talonic.extract({
      document_id: "doc_abc",
      instructions: "Focus on the billing section.",
      include_markdown: true,
      options: { page_range: "1-3", language_hint: "en" },
    })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    expect(fd.get("instructions")).toBe("Focus on the billing section.")
    expect(fd.get("include_markdown")).toBe("true")
    expect(JSON.parse(fd.get("options") as string)).toEqual({
      page_range: "1-3",
      language_hint: "en",
    })
  })

  it("accepts file as Uint8Array with filename", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({ file: buf, filename: "test.pdf" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const file = fd.get("file")
    expect(file).toBeInstanceOf(Blob)
    expect((file as Blob).size).toBe(4)
  })

  it("infers content-type from .pdf filename", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({ file: buf, filename: "invoice.pdf" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const file = fd.get("file") as Blob
    expect(file.type).toBe("application/pdf")
  })

  it("infers content-type from .docx filename", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({ file: buf, filename: "report.docx" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    const file = fd.get("file") as Blob
    expect(file.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  })

  it("infers content-type from .png filename", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({ file: buf, filename: "scan.png" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    expect((fd.get("file") as Blob).type).toBe("image/png")
  })

  it("falls back to application/octet-stream for unknown extensions", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({ file: buf, filename: "weird.xyz" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    expect((fd.get("file") as Blob).type).toBe("application/octet-stream")
  })

  it("explicit content_type overrides extension inference", async () => {
    const buf = new Uint8Array([1, 2, 3, 4])
    await client.talonic.extract({
      file: buf,
      filename: "document.bin",
      content_type: "application/pdf",
    })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    expect((fd.get("file") as Blob).type).toBe("application/pdf")
  })

  it("preserves type on a Blob that already has one", async () => {
    const blob = new Blob([new Uint8Array([1, 2])], { type: "image/jpeg" })
    await client.talonic.extract({ file: blob, filename: "anything.txt" })
    const fd = lastCall(client.fetchFn)[1].body as FormData
    // The original Blob's type wins when set; filename is informational.
    expect((fd.get("file") as Blob).type).toBe("image/jpeg")
  })

  it("does not set content-type header (FormData picks its own boundary)", async () => {
    await client.talonic.extract({ document_id: "doc_abc" })
    const init = lastCall(client.fetchFn)[1] as { headers: Record<string, string> }
    expect(init.headers["content-type"]).toBeUndefined()
  })
})

describe("talonic.documents", () => {
  it("list -> GET /v1/documents with query", async () => {
    const { talonic, fetchFn } = makeClient()
    await talonic.documents.list({ status: "completed", page: 2, per_page: 10 })
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/documents")
    expect(url).toContain("status=completed")
    expect(url).toContain("page=2")
    expect(url).toContain("per_page=10")
    expect(init.method).toBe("GET")
  })

  it("get -> GET /v1/documents/:id with URL-encoded id", async () => {
    const { talonic, fetchFn } = makeClient({ id: "doc/abc" })
    await talonic.documents.get("doc/abc")
    expect(lastCall(fetchFn)[0]).toContain("/v1/documents/doc%2Fabc")
  })

  it("getMarkdown -> GET /v1/documents/:id/markdown", async () => {
    const { talonic, fetchFn } = makeClient({ document_id: "doc_1", markdown: "# x" })
    const result = await talonic.documents.getMarkdown("doc_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/documents/doc_1/markdown")
    expect(result.markdown).toBe("# x")
  })

  it("reExtract -> POST /v1/documents/:id/re-extract", async () => {
    const { talonic, fetchFn } = makeClient({ id: "doc_1", status: "extracting", message: "" })
    await talonic.documents.reExtract("doc_1")
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/documents/doc_1/re-extract")
    expect(init.method).toBe("POST")
  })

  it("delete -> DELETE /v1/documents/:id", async () => {
    const { talonic, fetchFn } = makeClient({ deleted: true })
    const result = await talonic.documents.delete("doc_1")
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/documents/doc_1")
    expect(init.method).toBe("DELETE")
    expect(result.deleted).toBe(true)
  })
})

describe("talonic.extractions", () => {
  it("list -> GET /v1/extractions with filters", async () => {
    const { talonic, fetchFn } = makeClient()
    await talonic.extractions.list({ document_id: "doc_1", schema_id: "sch_1" })
    const url = lastCall(fetchFn)[0]
    expect(url).toContain("/v1/extractions")
    expect(url).toContain("document_id=doc_1")
    expect(url).toContain("schema_id=sch_1")
  })

  it("get -> GET /v1/extractions/:id", async () => {
    const { talonic, fetchFn } = makeClient({
      id: "ext_1",
      document_id: "d",
      status: "complete",
      created_at: "2024",
    })
    const result = await talonic.extractions.get("ext_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/extractions/ext_1")
    expect(result.id).toBe("ext_1")
  })

  it("getData (default json) -> GET /v1/extractions/:id/data", async () => {
    const { talonic, fetchFn } = makeClient({ field: "value" })
    await talonic.extractions.getData("ext_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/extractions/ext_1/data")
  })

  it("getData with format=csv passes the query parameter", async () => {
    const { talonic, fetchFn } = makeClient("csv,data\n1,2")
    await talonic.extractions.getData("ext_1", { format: "csv" })
    expect(lastCall(fetchFn)[0]).toContain("format=csv")
  })

  it("patch -> PATCH /v1/extractions/:id/data with JSON body", async () => {
    const { talonic, fetchFn } = makeClient({ id: "ext_1" })
    await talonic.extractions.patch("ext_1", {
      corrections: [{ field: "total_amount", value: 14500, reason: "tax" }],
      propagate: "all_similar",
    })
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/extractions/ext_1/data")
    expect(init.method).toBe("PATCH")
    const body = JSON.parse(init.body as string) as { corrections: unknown[]; propagate: string }
    expect(body.corrections).toHaveLength(1)
    expect(body.propagate).toBe("all_similar")
  })
})

describe("talonic.schemas", () => {
  it("list -> GET /v1/schemas", async () => {
    const { talonic, fetchFn } = makeClient()
    await talonic.schemas.list()
    expect(lastCall(fetchFn)[0]).toContain("/v1/schemas")
    expect(lastCall(fetchFn)[1].method).toBe("GET")
  })

  it("list returns Schema with version and links fields", async () => {
    const { talonic } = makeClient({
      data: [
        {
          id: "sch_1",
          name: "Invoice",
          version: 3,
          definition: { vendor: "string" },
          links: {
            self: "/v1/schemas/sch_1",
            extractions: "/v1/extractions?schema_id=sch_1",
            dashboard: "https://app.talonic.com/schemas/user/sch_1",
          },
        },
      ],
      pagination: { total: 1, limit: 20, has_more: false, next_cursor: null },
    })
    const result = await talonic.schemas.list()
    expect(result.data[0]?.version).toBe(3)
    expect(result.data[0]?.links?.self).toBe("/v1/schemas/sch_1")
    expect(result.pagination?.has_more).toBe(false)
    expect(result.pagination?.next_cursor).toBeNull()
  })

  it("get -> GET /v1/schemas/:id", async () => {
    const { talonic, fetchFn } = makeClient({ id: "sch_1", name: "X", created_at: "2024" })
    await talonic.schemas.get("sch_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/schemas/sch_1")
  })

  it("create -> POST /v1/schemas with JSON body", async () => {
    const { talonic, fetchFn } = makeClient({ id: "sch_new", name: "Invoice", created_at: "2024" })
    await talonic.schemas.create({
      name: "Invoice",
      definition: { vendor_name: "string" },
      description: "Standard invoice",
    })
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/schemas")
    expect(init.method).toBe("POST")
    const body = JSON.parse(init.body as string) as { name: string; definition: object }
    expect(body.name).toBe("Invoice")
    expect(body.definition).toEqual({ vendor_name: "string" })
  })

  it("update -> PUT /v1/schemas/:id with JSON body", async () => {
    const { talonic, fetchFn } = makeClient({ id: "sch_1", name: "Updated", created_at: "2024" })
    await talonic.schemas.update("sch_1", { name: "Updated" })
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/schemas/sch_1")
    expect(init.method).toBe("PUT")
  })

  it("delete -> DELETE /v1/schemas/:id", async () => {
    const { talonic, fetchFn } = makeClient({ deleted: true })
    await talonic.schemas.delete("sch_1")
    const [, init] = lastCall(fetchFn)
    expect(init.method).toBe("DELETE")
  })
})

describe("talonic.search", () => {
  it("calls GET /v1/search with q and limit", async () => {
    const { talonic, fetchFn } = makeClient({
      documents: [],
      fieldMatches: [],
      sources: [],
      schemas: [],
      fields: [],
    })
    await talonic.search("indemnification", { limit: 5 })
    const url = lastCall(fetchFn)[0]
    expect(url).toContain("/v1/search")
    expect(url).toContain("q=indemnification")
    expect(url).toContain("limit=5")
  })

  it("omits limit when not provided", async () => {
    const { talonic, fetchFn } = makeClient({
      documents: [],
      fieldMatches: [],
      sources: [],
      schemas: [],
      fields: [],
    })
    await talonic.search("test")
    const url = lastCall(fetchFn)[0]
    expect(url).toContain("q=test")
    expect(url).not.toContain("limit=")
  })
})

describe("talonic.fields", () => {
  it("list -> GET /v1/fields with search, tier, limit, cursor", async () => {
    const { talonic, fetchFn } = makeClient({ data: [] })
    await talonic.fields.list({ search: "vendor", tier: 2, limit: 10, cursor: "abc" })
    const url = lastCall(fetchFn)[0]
    expect(url).toContain("/v1/fields")
    expect(url).toContain("search=vendor")
    expect(url).toContain("tier=2")
    expect(url).toContain("limit=10")
    expect(url).toContain("cursor=abc")
  })

  it("get -> GET /v1/fields/:id", async () => {
    const { talonic, fetchFn } = makeClient({
      id: "fld_1",
      canonical_name: "vendor_name",
      data_type: "string",
    })
    await talonic.fields.get("fld_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/fields/fld_1")
  })

  it("similar -> GET /v1/fields/:id/similar", async () => {
    const { talonic, fetchFn } = makeClient({ data: [] })
    await talonic.fields.similar("fld_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/fields/fld_1/similar")
  })
})

describe("talonic.documents.filter", () => {
  it("passes a canonical field name straight through to the API in fieldId", async () => {
    const { talonic, fetchFn } = makeClient({ documents: [], total: 0 })
    await talonic.documents.filter({
      conditions: [{ field: "vendor.name", operator: "eq", value: "Acme" }],
    })

    // No /v1/fields lookup: the API resolves the canonical name itself.
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(lastCall(fetchFn)[0]).toContain("/v1/documents/filter")
    const body = JSON.parse(lastCall(fetchFn)[1].body as string) as {
      conditions: Array<{ fieldId: string }>
    }
    expect(body.conditions[0]?.fieldId).toBe("vendor.name")
  })

  it("passes through explicit fieldId UUID unchanged", async () => {
    const { talonic, fetchFn } = makeClient({ documents: [], total: 0 })
    await talonic.documents.filter({
      conditions: [
        {
          fieldId: "11111111-2222-3333-4444-555555555555",
          operator: "between",
          value: 100,
          valueTo: 500,
        },
      ],
    })
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(lastCall(fetchFn)[0]).toContain("/v1/documents/filter")
    const body = JSON.parse(lastCall(fetchFn)[1].body as string) as {
      conditions: Array<{ fieldId: string; operator: string; value: number; valueTo: number }>
    }
    expect(body.conditions[0]?.fieldId).toBe("11111111-2222-3333-4444-555555555555")
    expect(body.conditions[0]?.operator).toBe("between")
  })

  it("passes a UUID-shaped value in `field` straight through too", async () => {
    const { talonic, fetchFn } = makeClient({ documents: [], total: 0 })
    await talonic.documents.filter({
      conditions: [{ field: "11111111-2222-3333-4444-555555555555", operator: "is_not_empty" }],
    })
    expect(fetchFn).toHaveBeenCalledOnce()
    const body = JSON.parse(lastCall(fetchFn)[1].body as string) as {
      conditions: Array<{ fieldId: string }>
    }
    expect(body.conditions[0]?.fieldId).toBe("11111111-2222-3333-4444-555555555555")
  })

  it("multiple conditions with the same name still produce a single filter call", async () => {
    const { talonic, fetchFn } = makeClient({ documents: [], total: 0 })
    await talonic.documents.filter({
      conditions: [
        { field: "amount", operator: "gt", value: 100 },
        { field: "amount", operator: "lt", value: 1000 },
      ],
    })

    // No /v1/fields pre-resolution; just the single filter POST.
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(lastCall(fetchFn)[0]).toContain("/v1/documents/filter")
    const body = JSON.parse(lastCall(fetchFn)[1].body as string) as {
      conditions: Array<{ fieldId: string; operator: string }>
    }
    expect(body.conditions).toHaveLength(2)
    expect(body.conditions[0]?.fieldId).toBe("amount")
    expect(body.conditions[1]?.fieldId).toBe("amount")
  })

  it("throws when condition has neither field nor fieldId", async () => {
    const { talonic } = makeClient()
    await expect(
      talonic.documents.filter({
        conditions: [{ operator: "eq", value: "x" }] as never,
      }),
    ).rejects.toThrow(/needs either/)
  })

  it("forwards search, sort, page, limit, and source as source_id (not sourceConnectionId)", async () => {
    const { talonic, fetchFn } = makeClient({ documents: [], total: 0 })
    // Use UUIDs so we skip the autocomplete resolver entirely.
    await talonic.documents.filter({
      conditions: [
        {
          fieldId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          operator: "gt",
          value: 1000,
        },
      ],
      search: "invoice",
      sort: { fieldId: "11111111-2222-3333-4444-555555555555", direction: "desc" },
      page: 2,
      limit: 50,
      source_connection_id: "src_1",
    })
    const body = JSON.parse(lastCall(fetchFn)[1].body as string) as Record<string, unknown>
    expect(body["search"]).toBe("invoice")
    expect(body["sort"]).toEqual({
      fieldId: "11111111-2222-3333-4444-555555555555",
      direction: "desc",
    })
    expect(body["page"]).toBe(2)
    expect(body["limit"]).toBe(50)
    // OpenAPI spec uses `source_id`, not `sourceConnectionId`.
    expect(body["source_id"]).toBe("src_1")
  })
})

describe("talonic.jobs", () => {
  it("create -> POST /v1/jobs with JSON body", async () => {
    const { talonic, fetchFn } = makeClient({ id: "job_1", status: "pending" })
    await talonic.jobs.create({ schema_id: "sch_1", document_ids: ["d1", "d2"], name: "Batch" })
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/jobs")
    expect(init.method).toBe("POST")
    const body = JSON.parse(init.body as string) as { schema_id: string; document_ids: string[] }
    expect(body.schema_id).toBe("sch_1")
    expect(body.document_ids).toEqual(["d1", "d2"])
  })

  it("list -> GET /v1/jobs with status filter", async () => {
    const { talonic, fetchFn } = makeClient()
    await talonic.jobs.list({ status: "completed", page: 1 })
    const url = lastCall(fetchFn)[0]
    expect(url).toContain("/v1/jobs")
    expect(url).toContain("status=completed")
  })

  it("get -> GET /v1/jobs/:id", async () => {
    const { talonic, fetchFn } = makeClient({ id: "job_1", status: "processing" })
    await talonic.jobs.get("job_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/jobs/job_1")
  })

  it("getResults -> GET /v1/jobs/:id/results", async () => {
    const { talonic, fetchFn } = makeClient({ data: [] })
    await talonic.jobs.getResults("job_1")
    expect(lastCall(fetchFn)[0]).toContain("/v1/jobs/job_1/results")
  })

  it("cancel -> POST /v1/jobs/:id/cancel", async () => {
    const { talonic, fetchFn } = makeClient({ id: "job_1", status: "cancelled" })
    await talonic.jobs.cancel("job_1")
    const [url, init] = lastCall(fetchFn)
    expect(url).toContain("/v1/jobs/job_1/cancel")
    expect(init.method).toBe("POST")
  })
})
