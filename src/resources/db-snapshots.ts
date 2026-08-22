import type { Transport } from "../transport.js"

/**
 * Automatic capture schedule for one connected database.
 *
 * @public
 */
export interface SnapshotCadence {
  /** Whether scheduled capture is currently armed. */
  enabled: boolean
  /** Hours between scheduled captures. */
  interval_hours: number
  /** Capture strategy the schedule runs (e.g. `full`, `incremental`). */
  capture_mode: string
}

/**
 * Summary of a single capture run.
 *
 * @public
 */
export interface SnapshotSummary {
  /** Snapshot id. */
  id: string
  /** Capture status (e.g. `running`, `complete`, `failed`). */
  status: string
  /** Capture strategy used for this run. */
  capture_mode: string
  /** When the capture started. */
  captured_at: string
  /** When the capture finished, or null while it is still running. */
  completed_at: string | null
  /** Failure message, or null when the capture did not fail. */
  error: string | null
}

/**
 * Aggregate row-change counts for one delta.
 *
 * IMPORTANT: when the parent delta's `status` is `"partial"`, every number
 * here is a FLOOR, not a result — the capture that feeds the delta is still
 * running. A partial delta routinely reads `added: 0, modified: 0,
 * removed: 0, tables_touched: 0` while hundreds of thousands of rows are in
 * fact changing. Never read a partial total as "nothing changed".
 *
 * @public
 */
export interface DeltaTotals {
  /** Rows added between the two snapshots. */
  added: number
  /** Rows modified between the two snapshots. */
  modified: number
  /** Rows removed between the two snapshots. */
  removed: number
  /** Number of tables with at least one detected change. */
  tables_touched: number
  /** Number of tables in the source. */
  tables_total: number
  /** Number of tables the scan policy skipped, when reported. */
  tables_skipped?: number
  /** Whether schema drift (added/removed columns) was detected. */
  drift: boolean
}

/**
 * Pointer to the most recently computed delta for a source.
 *
 * @public
 */
export interface DeltaSummary {
  /** Delta id. */
  id: string
  /**
   * `"complete"` means the delta is final and its totals can be trusted.
   * `"partial"` means the capture writing it is STILL RUNNING and the
   * totals are a floor only.
   */
  status: "partial" | "complete"
  /** When the delta was computed. */
  computed_at: string
  /** Aggregate counts. Only trustworthy when `status` is `"complete"`. */
  totals: DeltaTotals
}

/**
 * One connected customer database that Talonic snapshots.
 *
 * @public
 */
export interface SnapshotSource {
  /** Connection id — the handle for every other db-snapshot call. */
  connection_id: string
  /** Display name of the connection. */
  name: string
  /** Database engine (e.g. `postgres`, `mssql`). */
  engine: string
  /** Number of snapshots captured so far. */
  snapshot_count: number
  /** True when a capture is in flight right now. */
  capturing: boolean
  /** Scheduled-capture configuration, or null when none is configured. */
  cadence: SnapshotCadence | null
  /** Most recent capture run, or null when nothing has been captured. */
  latest_snapshot: SnapshotSummary | null
  /**
   * Most recent delta, which may be `status: "partial"` (still being
   * written), or null when no delta exists yet.
   */
  latest_delta: DeltaSummary | null
  /**
   * Id of the newest delta whose `status` is `"complete"`. This is the one
   * to read when the answer has to be trustworthy.
   */
  last_complete_delta_id: string | null
}

/**
 * Sources list returned by `GET /v1/db-snapshots/sources`.
 *
 * @public
 */
export interface SnapshotSourceList {
  /** Every connected database visible to this API key. */
  data: SnapshotSource[]
}

/**
 * One capture in a source's history.
 *
 * @public
 */
export interface SnapshotTimelineEntry {
  /** Snapshot id of this capture. */
  snapshot_id: string
  /** When the capture started. */
  captured_at: string
  /** Capture status. */
  status: string
  /** Rows changed versus the previous capture, or null when not computed. */
  rows_changed: number | null
  /** Whether schema drift was detected at this capture. */
  drift: boolean
  /** Delta computed against the previous capture, or null when none. */
  delta_id: string | null
}

/**
 * One source plus its capture history, returned by
 * `GET /v1/db-snapshots/sources/{connection_id}`.
 *
 * @public
 */
export interface SnapshotSourceDetail extends SnapshotSource {
  /**
   * Capture history in chronological order, OLDEST first — the last element
   * is the most recent capture. Retained captures only; older points are
   * dropped rather than summarized.
   */
  timeline: SnapshotTimelineEntry[]
}

/**
 * Per-table change counts inside a delta.
 *
 * Two readings that must never be conflated:
 * - A table ABSENT from `tables[]` was examined and found clean.
 * - A table PRESENT with `examined: false` was NOT examined — the scan
 *   policy deferred it. `last_full_scan_at` says when it was last really
 *   looked at.
 *
 * @public
 */
export interface DeltaTable {
  /** Fully-qualified table key (e.g. `public.orders`). */
  table_key: string
  /** Rows added in this table. */
  added: number
  /** Rows modified in this table. */
  modified: number
  /** Rows removed in this table. */
  removed: number
  /** True when the row-level change list was capped and is incomplete. */
  changes_truncated: boolean
  /** False means the scan policy DEFERRED this table — it was not examined. */
  examined: boolean
  /** When this table was last fully scanned, or null if never. */
  last_full_scan_at: string | null
  /** Scan mode used: `full`, `incremental`, `changefeed`, or `skipped`. */
  mode: string | null
  /** Why a faster path was abandoned, or null when none was. */
  fallback_reason: string | null
  /** Columns present in the newer snapshot only (schema drift). */
  columns_added: string[]
  /** Columns present in the older snapshot only (schema drift). */
  columns_removed: string[]
}

/**
 * Row-level diff between two snapshots of one connected database.
 *
 * @public
 */
export interface Delta {
  /** Delta id. */
  id: string
  /** Connection the delta belongs to. */
  connection_id: string
  /** Older snapshot (baseline). */
  from_snapshot_id: string
  /** Newer snapshot. */
  to_snapshot_id: string
  /** When the delta was computed. */
  computed_at: string
  /**
   * `"partial"` means the capture writing this delta is STILL RUNNING;
   * `totals` and `tables` are a floor, not a result. Read
   * {@link SnapshotSource.last_complete_delta_id} instead when the answer
   * must be trustworthy.
   */
  status: "partial" | "complete"
  /**
   * The connection's newest delta with final counts, served on the delta
   * itself so a `"partial"` answer needs no second call to find the
   * trustworthy read. Equals `id` when `status` is `"complete"`; null when no
   * capture has ever completed for this connection.
   */
  last_complete_delta_id: string | null
  /** Aggregate counts. Only trustworthy when `status` is `"complete"`. */
  totals: DeltaTotals
  /**
   * Per-table counts. Absent table == examined and clean. Present with
   * `examined: false` == not examined.
   */
  tables: DeltaTable[]
}

/**
 * Column-value distribution shift observed across the delta.
 *
 * @public
 */
export interface DeltaColumnProfileEntry {
  /** Table the column belongs to. */
  table_key: string
  /** Column name. */
  column: string
  /** Value before the change. */
  before: unknown
  /** Value after the change. */
  after: unknown
  /** Number of rows exhibiting this before/after pair. */
  count: number
  /** Aggregation that produced the pair (e.g. a sum or distinct-value shift). */
  aggregate: string
}

/**
 * Full delta payload returned by `GET /v1/db-snapshots/deltas/{delta_id}`.
 *
 * @public
 */
export interface DeltaDetail {
  /** The delta itself, including per-table counts. */
  delta: Delta
  /** Baseline snapshot pointer. */
  from_snapshot: { id: string; captured_at: string }
  /** Newer snapshot pointer, including its capture status. */
  to_snapshot: { id: string; captured_at: string; status: string }
  /** Column-level before/after shifts. */
  column_profile: DeltaColumnProfileEntry[]
}

/**
 * One row-level change inside a delta.
 *
 * @public
 */
export interface DeltaChange {
  /** Change-record id. */
  id: string
  /** Table the row lives in. */
  table_key: string
  /** Primary key of the row, as a string. */
  pk: string
  /** What happened to the row. */
  change_type: "added" | "modified" | "removed"
  /** Row image before the change, or null for an addition. */
  before: Record<string, unknown> | null
  /** Row image after the change, or null for a removal. */
  after: Record<string, unknown> | null
}

/**
 * Parameters for {@link DbSnapshots.listChanges}.
 *
 * @public
 */
export interface ListDeltaChangesParams {
  /** Required. Table to page through (`table_key` from the delta). */
  table: string
  /** Page size (default 50, server maximum 500). */
  limit?: number
  /** Offset into the change list (default 0). */
  offset?: number
}

/**
 * Page of row-level changes returned by
 * `GET /v1/db-snapshots/deltas/{delta_id}/changes`.
 *
 * @public
 */
export interface DeltaChangeList {
  /** Changes on this page. */
  data: DeltaChange[]
  /** The requested table, echoed so a page is self-describing. */
  table: string
  /**
   * Change rows available for the requested table in this delta. On a partial
   * delta this can grow between pages, because the capture is still writing.
   */
  total: number
  /** Page size that was applied. */
  limit: number
  /** Offset that was applied. */
  offset: number
}

/**
 * One appearance of a row in the capture history.
 *
 * @public
 */
export interface EntityHistoryEvent {
  /** Delta that recorded this event. */
  delta_id: string
  /** Snapshot the event was observed in. */
  snapshot_id: string
  /** When that snapshot was captured. */
  captured_at: string
  /** What happened to the row at this capture. */
  change_type: "added" | "modified" | "removed"
  /** Row image before the change, or null. */
  before: Record<string, unknown> | null
  /** Row image after the change, or null. */
  after: Record<string, unknown> | null
}

/**
 * Parameters for {@link DbSnapshots.getEntityHistory}.
 *
 * @public
 */
export interface GetEntityHistoryParams {
  /** Table the row lives in. */
  table: string
  /** Primary key of the row. */
  pk: string
}

/**
 * One primary key's timeline across captures, returned by
 * `GET /v1/db-snapshots/sources/{connection_id}/history`.
 *
 * @public
 */
export interface EntityHistory {
  /** Table the row lives in. */
  table_key: string
  /** Primary key that was traced. */
  pk: string
  /** Columns that make up the row's identity. */
  identity_columns: string[]
  /** Latest known row image, or null when the row no longer exists. */
  current: Record<string, unknown> | null
  /** Recorded changes to the row, NEWEST first, capped at the 100 most recent. */
  events: EntityHistoryEvent[]
  /** Changes recorded across retained captures, before the cap on `events`. */
  events_total: number
  /** True when `events_total` exceeded the cap and only the newest 100 are present. */
  events_truncated: boolean
}

/**
 * Database-snapshot queries.
 *
 * Talonic periodically captures a snapshot of a connected customer database
 * and computes row-level deltas between consecutive captures. Use
 * {@link DbSnapshots.listSources} to find connections,
 * {@link DbSnapshots.getDelta} to read one diff,
 * {@link DbSnapshots.listChanges} to page individual rows, and
 * {@link DbSnapshots.getEntityHistory} to trace one primary key over time.
 *
 * Two semantics matter more than any of the numbers:
 *
 * 1. `status: "partial"` means the capture writing the delta is STILL
 *    RUNNING. The counts are a floor, never a result — a partial delta can
 *    read all zeros while the source is changing heavily. Read
 *    {@link SnapshotSource.last_complete_delta_id} for a trustworthy answer.
 * 2. A table absent from `tables[]` was examined and is clean. A table
 *    present with `examined: false` was NOT examined; the scan policy
 *    deferred it, and `last_full_scan_at` says when it was last looked at.
 *
 * @public
 */
export class DbSnapshots {
  readonly #transport: Transport

  /** @internal */
  constructor(transport: Transport) {
    this.#transport = transport
  }

  /**
   * List every connected database, with its cadence, latest capture, and
   * whether a capture is running right now.
   *
   * @example
   * ```ts
   * const { data } = await talonic.dbSnapshots.listSources()
   * for (const source of data) {
   *   console.log(source.name, source.capturing ? "(capturing)" : "", source.last_complete_delta_id)
   * }
   * ```
   */
  async listSources(): Promise<SnapshotSourceList> {
    const result = await this.#transport.request<SnapshotSourceList>({
      method: "GET",
      path: "/v1/db-snapshots/sources",
    })
    return result.data
  }

  /**
   * Fetch one connected database plus its capture timeline.
   *
   * @param connectionId Connection id from {@link DbSnapshots.listSources}.
   *
   * @example
   * ```ts
   * const source = await talonic.dbSnapshots.getSource("conn_123")
   * console.log(source.timeline.length, "captures")
   * ```
   */
  async getSource(connectionId: string): Promise<SnapshotSourceDetail> {
    const result = await this.#transport.request<SnapshotSourceDetail>({
      method: "GET",
      path: `/v1/db-snapshots/sources/${encodeURIComponent(connectionId)}`,
    })
    return result.data
  }

  /**
   * Fetch one delta: aggregate totals, per-table counts, and the column
   * profile.
   *
   * Check `delta.status` first. `"partial"` means the capture is still
   * running and the counts are a floor.
   *
   * @param deltaId Delta id, e.g. from `latest_delta.id` or
   * `last_complete_delta_id`.
   *
   * @example
   * ```ts
   * const { delta } = await talonic.dbSnapshots.getDelta(deltaId)
   * if (delta.status === "partial") console.warn("counts are a floor; capture still running")
   * ```
   */
  async getDelta(deltaId: string): Promise<DeltaDetail> {
    const result = await this.#transport.request<DeltaDetail>({
      method: "GET",
      path: `/v1/db-snapshots/deltas/${encodeURIComponent(deltaId)}`,
    })
    return result.data
  }

  /**
   * Page the row-level changes of one table inside one delta.
   *
   * A production delta can hold hundreds of thousands of changed rows, so
   * `table` is required and pages are small: `limit` defaults to 50 and the
   * server caps it at 500.
   *
   * @param deltaId Delta id.
   * @param params `table` (required), plus `limit` and `offset`.
   *
   * @example
   * ```ts
   * const page = await talonic.dbSnapshots.listChanges(deltaId, {
   *   table: "public.orders",
   *   limit: 50,
   * })
   * console.log(`${page.data.length} of ${page.total}`)
   * ```
   */
  async listChanges(deltaId: string, params: ListDeltaChangesParams): Promise<DeltaChangeList> {
    const result = await this.#transport.request<DeltaChangeList>({
      method: "GET",
      path: `/v1/db-snapshots/deltas/${encodeURIComponent(deltaId)}/changes`,
      query: {
        table: params.table,
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
        ...(params.offset !== undefined ? { offset: params.offset } : {}),
      },
    })
    return result.data
  }

  /**
   * Trace one primary key across every capture of a source.
   *
   * @param connectionId Connection id.
   * @param params `table` and `pk` of the row to trace.
   *
   * @example
   * ```ts
   * const history = await talonic.dbSnapshots.getEntityHistory("conn_123", {
   *   table: "public.orders",
   *   pk: "42",
   * })
   * console.log(history.events.map((e) => e.change_type))
   * ```
   */
  async getEntityHistory(
    connectionId: string,
    params: GetEntityHistoryParams,
  ): Promise<EntityHistory> {
    const result = await this.#transport.request<EntityHistory>({
      method: "GET",
      path: `/v1/db-snapshots/sources/${encodeURIComponent(connectionId)}/history`,
      query: { table: params.table, pk: params.pk },
    })
    return result.data
  }
}
