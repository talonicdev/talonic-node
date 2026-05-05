# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.7] - 2026-05-02

### Added

- **`WithRateLimit<T>` wrapper on every resource method.** Every successful response now includes a `rateLimit` block (`{ limit, remaining, resetAt }`) parsed from the `X-RateLimit-*` response headers. `talonic.extract()`, `talonic.documents.list()`, `talonic.schemas.list()`, etc. all return `WithRateLimit<T>` instead of `T`.
- **`autoPopulateRequired` guardrail in `extract()`.** When you pass a JSON Schema with `properties` but no `required` array, the SDK auto-fills `required` with the property keys before sending. Prevents the silent-empty-data footgun where the API returns `null` and confidence 0 for fields that were not explicitly required.
- New `TalonicRateLimitError` class with a typed `rateLimit` field for use after retries are exhausted on 429.

### Known issues

- The `rateLimit` values currently come back as sentinel zeros (`{limit: 0, remaining: 0, resetAt: 1970-01-01T00:00:00.000Z}`). Either the API is not emitting `X-RateLimit-*` headers or the transport layer is not parsing them. The wrapper is shipped; the values are not yet meaningful. Tracked for a fix.

## [0.1.6] - 2026-05-02

### Changed

- `src/version.ts` derives the version from `package.json` at build time instead of being hardcoded. The status line in the README no longer carries a pinned version number.

### Fixed

- Platform docs sync workflow: the dispatch step now uses the correct version output.

## [0.1.5] - 2026-05-02

### Added

- `docs/sections.json` and a platform docs sync pipeline. Every change in `src/content/sections/` flows automatically into the website at publish time, becoming SEO-friendly doc pages.

### Fixed

- Strict null-check warning in `src/content/helpers.ts`.

## [0.1.4] - 2026-05-01

### Added

- **`/content` export** from `package.json`. The SDK now ships a structured docs payload (`overview`, `cli`, `configuration`, `errors`, `known-issues`, `api-surface`) consumable by the website's docs build. Docs in code, single source of truth.
- Publish workflow that triggers `update-docs.yml` on the website repo on every npm release, so the website's `package-lock.json` stays in sync with whatever's on npm.

## [0.1.3] - 2026-04-30

### Changed

- `documents.filter()` no longer pre-resolves field names locally via `/v1/fields?search=`. Canonical names like `"vendor.name"` or `"policy.0_coverage_type"` are now passed directly to the API, which resolves them server-side. This removes a redundant network roundtrip per filter call and stops the SDK from short-circuiting valid names that the API can resolve. Calls that previously failed with a local `field_not_found` now reach the API and surface its `VALIDATION_ERROR` response with `request_id` and `message`.
- The `Documents` resource constructor no longer takes a `Fields` dependency.

### Added

- `Schema.short_id` field. The API now returns a human-readable identifier (`"SCH-XXXXXXXX"`) alongside the UUID. Both forms are accepted on `/v1/schemas/:id` reads.

### Removed

- The local field-name resolution loop, including the `UUID_REGEX` shortcut and the in-flight resolution cache. With server-side resolution, none of this is needed.

## [0.1.2] - 2026-04-29

### Fixed

- CLI bin (`talonic`) no longer exits silently when invoked through the npm-managed `node_modules/.bin/` symlink (the way every end user invokes it, including via `npx`). The auto-run guard previously compared `import.meta.url` to `file://${process.argv[1]}` as strings; on macOS those two strings disagree when the binary is reached via a symlink, so `run()` never executed and the process exited with code 0 and no output. The guard now resolves both sides with `fs.realpathSync` before comparing, so symlink and direct invocations both work.

### Added

- Regression test (`tests/cli-symlink.test.ts`) that spawns the bundled CLI through a symlink and asserts `--version` prints `VERSION`. Catches future regressions of the auto-run guard before publish.

## [Unreleased prior to 0.1.2]

### Added

- Project skeleton: TypeScript strict mode, `tsup` dual ESM and CJS build, Vitest test runner, GitHub Actions CI matrix on Node 18, 20, 22.
- Prettier and EditorConfig for consistent formatting.
- MIT license.
- `npm run check:spec` script that verifies every SDK call site against the official Talonic OpenAPI spec (`@talonic/docs/openapi.json`). Wired into CI as a separate step. Catches drift like the `/search` vs `/v1/search` and `/filter/documents` vs `/v1/documents/filter` mismatches we hit during v0.1 development.

### Removed

- Internal `talonic-api-reference.md` reference file. The OpenAPI spec shipped via `@talonic/docs` is now the single source of truth.
