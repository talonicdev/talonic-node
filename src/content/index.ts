// ---------------------------------------------------------------------------
// Structured content export for @talonic/node documentation.
//
// Usage:
//   import { getSdkSection, getAllSdkSections, SDK_NAV_SECTIONS } from '@talonic/node/content'
// ---------------------------------------------------------------------------

export type {
  DocBlock,
  DocSection,
  RawSection,
  Param,
  HttpMethod,
  NavSection,
} from './types';

export { SDK_NAV_SECTIONS } from './seo';

import type { DocSection, RawSection } from './types';
import { deriveBreadcrumbs, derivePrevNext } from './helpers';
import { SDK_NAV_SECTIONS } from './seo';

// --- Section imports ---
import { sections as overview } from './sections/overview';
import { sections as apiSurface } from './sections/api-surface';
import { sections as cli } from './sections/cli';
import { sections as configuration } from './sections/configuration';
import { sections as errors } from './sections/errors';
import { sections as knownIssues } from './sections/known-issues';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const ALL_RAW: RawSection[] = [
  ...overview,
  ...apiSurface,
  ...cli,
  ...configuration,
  ...errors,
  ...knownIssues,
];

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------

function enrich(raw: RawSection[]): DocSection[] {
  return raw.map((r) => {
    const { prev, next } = derivePrevNext(SDK_NAV_SECTIONS, r.slug);
    return {
      ...r,
      breadcrumbs: deriveBreadcrumbs(SDK_NAV_SECTIONS, r.slug),
      prev,
      next,
    };
  });
}

let _sections: DocSection[] | null = null;

function getSectionsAll(): DocSection[] {
  if (!_sections) {
    _sections = enrich(ALL_RAW);
  }
  return _sections;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get a single SDK section by slug, or null if not found. */
export function getSdkSection(slug: string): DocSection | null {
  return getSectionsAll().find((s) => s.slug === slug) ?? null;
}

/** Get all SDK sections in reading order. */
export function getAllSdkSections(): DocSection[] {
  return getSectionsAll();
}
