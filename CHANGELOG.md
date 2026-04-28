# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project skeleton: TypeScript strict mode, `tsup` dual ESM and CJS build, Vitest test runner, GitHub Actions CI matrix on Node 18, 20, 22.
- Prettier and EditorConfig for consistent formatting.
- MIT license.
- `npm run check:spec` script that verifies every SDK call site against the official Talonic OpenAPI spec (`@talonic/docs/openapi.json`). Wired into CI as a separate step. Catches drift like the `/search` vs `/v1/search` and `/filter/documents` vs `/v1/documents/filter` mismatches we hit during v0.1 development.

### Removed

- Internal `talonic-api-reference.md` reference file. The OpenAPI spec shipped via `@talonic/docs` is now the single source of truth.
