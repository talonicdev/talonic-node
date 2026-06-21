import type { Transport } from "../transport.js"

/**
 * Credit consumption for one platform function over the reporting window.
 *
 * @public
 */
export interface UsageByFunctionLine {
  /** The platform function / billable operation type (e.g. `page_ingest`). */
  operation_type: string
  /** Number of charged operations of this type in the window. */
  operations: number
  /** Total credits consumed by this function in the window. */
  credits: number
}

/**
 * Per-function credit consumption returned by `GET /v1/usage`.
 *
 * @public
 */
export interface UsageByFunction {
  /** Length of the reporting window in days. */
  period_days: number
  /** Total credits consumed across all functions in the window. */
  total_credits: number
  /** Per-function breakdown, highest spend first. */
  by_function: UsageByFunctionLine[]
}

/**
 * Credit usage queries.
 *
 * Use {@link Usage.getByFunction} to see where the workspace's credits went
 * (extraction vs structuring vs intelligence operations) over a trailing
 * window. Complements {@link Credits.getBalance} (the balance + runway view).
 *
 * @public
 */
export class Usage {
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /**
   * Fetch per-function credit consumption.
   *
   * @param days Trailing window in days (default 30, clamped server-side to 1–365).
   *
   * @example
   * ```ts
   * const usage = await talonic.usage.getByFunction(30)
   * for (const fn of usage.by_function) {
   *   console.log(`${fn.operation_type}: ${fn.credits} credits over ${fn.operations} ops`)
   * }
   * ```
   */
  async getByFunction(days?: number): Promise<UsageByFunction> {
    const result = await this.#transport.request<UsageByFunction>({
      method: "GET",
      path: "/v1/usage",
      query: days != null ? { days: String(days) } : undefined,
    })
    return result.data
  }
}
