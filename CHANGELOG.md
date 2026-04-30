# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
