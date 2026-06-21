import type { Transport } from "../transport.js"

/**
 * A single line in the public credit pricing catalog.
 *
 * @public
 */
export interface PricingLine {
  /** Billable unit identifier (e.g. `page_ingest`, `structuring_cell`). */
  unit: string
  /** Human-readable label for the unit. */
  label: string
  /** Credits charged per single unit (0 = free). */
  credits: number
  /** EUR equivalent of one unit at the workspace conversion rate. */
  eur: number
  /** Whether the unit is free. */
  free: boolean
}

/**
 * Machine-readable credit pricing catalog returned by `GET /v1/pricing`.
 *
 * Fixed per-unit rates an agent can read to predict spend before it runs
 * anything. Mirrors the published pricing page; the conversion rate
 * (`credits_per_eur`) and processing-mode multipliers (e.g. batch at 0.5x)
 * are included so a caller can compute a full quote client-side.
 *
 * @public
 */
export interface PricingCatalog {
  /** Always `EUR`. */
  currency: "EUR"
  /** Credits per EUR (e.g. 1000 means 1000 credits = €1). */
  credits_per_eur: number
  /** Processing-mode multipliers applied on top of per-unit cost. */
  multipliers: Record<string, number>
  /** The per-unit catalog. */
  units: PricingLine[]
}

/**
 * Credit pricing catalog queries.
 *
 * Use {@link Pricing.get} to fetch fixed per-unit rates BEFORE spending, so an
 * agent can predict the cost of a planned operation. The endpoint is public
 * (no API key required).
 *
 * @public
 */
export class Pricing {
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /**
   * Fetch the machine-readable credit pricing catalog.
   *
   * @example
   * ```ts
   * const pricing = await talonic.pricing.get()
   * const perPage = pricing.units.find((u) => u.unit === "page_ingest")
   * console.log(`Each page costs ${perPage?.credits} credits (€${perPage?.eur})`)
   * ```
   */
  async get(): Promise<PricingCatalog> {
    const result = await this.#transport.request<PricingCatalog>({
      method: "GET",
      path: "/v1/pricing",
    })
    return result.data
  }
}
