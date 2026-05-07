import type { Transport } from "../transport.js"
import type { WithRateLimit } from "../types.js"

/**
 * Enriched credit balance returned by `GET /v1/credits/balance`.
 *
 * Mirrors the API's `EnhancedBalance` shape: current balance in both
 * credits and EUR, 30-day burn rate, projected runway, and tier
 * metadata. The API computes EUR from credits using the workspace's
 * configured `credits_per_eur` rate and refreshes the runway projection
 * on every call.
 *
 * @public
 */
export interface EnhancedBalance {
  /** Current credit balance. */
  balance_credits: number
  /** Current balance expressed in EUR (rounded to two decimals). */
  balance_eur: number
  /** Total credits consumed in the trailing 30 days. */
  burn_rate_30d_credits: number
  /**
   * Projected days of runway at the current 30-day average burn rate.
   * `-1` indicates no consumption in the trailing window (cannot
   * compute a meaningful runway).
   */
  projected_runway_days: number
  /** API tier of the workspace (`free`, `pro`, `enterprise`, etc.). */
  tier: string
  /** ISO 8601 timestamp of the next monthly tier reset. */
  tier_resets_at: string
}

/**
 * Credit balance and usage queries.
 *
 * Use {@link Credits.getBalance} to fetch the current balance, EUR
 * value, burn rate, runway, and tier in a single call. This is the
 * agent-friendly entry point for budget-aware behaviour: read the
 * balance before scheduling a large batch, or after each extraction
 * to track spend.
 *
 * @public
 */
export class Credits {
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /**
   * Fetch the current enriched credit balance.
   *
   * @example
   * ```ts
   * const balance = await talonic.credits.getBalance()
   * if (balance.projected_runway_days >= 0 && balance.projected_runway_days < 7) {
   *   console.warn(`Only ${balance.projected_runway_days} days of runway left at the current burn rate`)
   * }
   * ```
   */
  async getBalance(): Promise<WithRateLimit<EnhancedBalance>> {
    const result = await this.#transport.request<EnhancedBalance>({
      method: "GET",
      path: "/v1/credits/balance",
    })
    return result.data
  }
}
