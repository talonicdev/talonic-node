import type { Transport } from "../transport.js"
import type { Pagination } from "./pagination.js"

/**
 * Asynchronous extraction work tracked by Talonic.
 *
 * @public
 */
export interface Job {
  id: string
  status: string
  extraction_id?: string
  progress?: number
  current_phase?: string
  total_documents?: number
  completed_documents?: number
  failed_documents?: number
  grid_stats?: {
    total_cells: number
    filled: number
    empty: number
    fill_rate: number
  }
  message?: string
  links?: {
    self: string
    results: string
  }
  created_at?: string
  completed_at?: string
  cancelled_at?: string
  estimated_completion?: string
}

/**
 * Paginated list of jobs.
 *
 * @public
 */
export interface JobList {
  data: Job[]
  pagination: Pagination
}

/**
 * Body for creating a job.
 *
 * @public
 */
export interface CreateJobParams {
  schema_id: string
  /** Specific documents. Omit to use all unprocessed documents. */
  document_ids?: string[]
  name?: string
}

/**
 * Filter and pagination options for listing jobs.
 *
 * @public
 */
export interface ListJobsParams {
  status?: "queued" | "processing" | "completed" | "failed" | "cancelled"
  page?: number
  per_page?: number
}

/**
 * Structured results returned from a completed job.
 *
 * @public
 */
export interface JobResults {
  data: Array<{
    document_id: string
    document_filename: string
    values: Record<string, unknown>
  }>
}

/**
 * Jobs resource. Accessed via `talonic.jobs`.
 *
 * @public
 */
export class Jobs {
  /** @internal */
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /** Create and run an extraction job. */
  async create(params: CreateJobParams): Promise<Job> {
    const result = await this.#transport.request<Job>({
      method: "POST",
      path: "/v1/jobs",
      body: params,
    })
    return result.data
  }

  /** List jobs with optional filtering. */
  async list(params?: ListJobsParams): Promise<JobList> {
    const result = await this.#transport.request<JobList>({
      method: "GET",
      path: "/v1/jobs",
      query: params as Record<string, string | number | boolean | undefined> | undefined,
    })
    return result.data
  }

  /** Get job status, progress, and result summary. */
  async get(id: string): Promise<Job> {
    const result = await this.#transport.request<Job>({
      method: "GET",
      path: `/v1/jobs/${encodeURIComponent(id)}`,
    })
    return result.data
  }

  /** Get the structured extraction results from a completed job. */
  async getResults(id: string): Promise<JobResults> {
    const result = await this.#transport.request<JobResults>({
      method: "GET",
      path: `/v1/jobs/${encodeURIComponent(id)}/results`,
    })
    return result.data
  }

  /** Cancel a running job. Partial results are retained. */
  async cancel(id: string): Promise<Job> {
    const result = await this.#transport.request<Job>({
      method: "POST",
      path: `/v1/jobs/${encodeURIComponent(id)}/cancel`,
    })
    return result.data
  }
}
