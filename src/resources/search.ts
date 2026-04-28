/**
 * Result of a global omnisearch across documents, fields, sources,
 * and schemas.
 *
 * @public
 */
export interface SearchResult {
  documents: SearchDocumentHit[]
  fieldMatches: SearchFieldMatch[]
  sources: SearchSourceHit[]
  schemas: SearchSchemaHit[]
  fields: SearchFieldHit[]
}

/**
 * @public
 */
export interface SearchDocumentHit {
  id: string
  name?: string
  filename?: string
  sourceId?: string
  sourceName?: string
}

/**
 * @public
 */
export interface SearchFieldMatch {
  resolvedFieldId: string
  displayName: string
  matchedValue?: string
  documentCount?: number
}

/**
 * @public
 */
export interface SearchSourceHit {
  id: string
  name: string
}

/**
 * @public
 */
export interface SearchSchemaHit {
  id: string
  name: string
}

/**
 * @public
 */
export interface SearchFieldHit {
  id: string
  canonicalName: string
  displayName: string
  documentCount?: number
}

/**
 * Options for `talonic.search()`.
 *
 * @public
 */
export interface SearchOptions {
  /** Maximum results per entity type. Default: 5. */
  limit?: number
}
