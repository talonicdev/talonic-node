/**
 * Cursor-based pagination envelope returned by list endpoints.
 *
 * Mirrors the production API response shape:
 * `{ total, limit, has_more, next_cursor }`. To page forward, pass
 * `next_cursor` as the `cursor` query parameter on the next request.
 *
 * @public
 */
export interface Pagination {
  /** Total number of items across all pages. */
  total: number
  /** Maximum number of items returned per page. */
  limit: number
  /** Whether more items are available beyond this page. */
  has_more: boolean
  /** Cursor token for the next page, or null if there are no more pages. */
  next_cursor: string | null
}
