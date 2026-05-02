// @ts-ignore — JSON import resolved by bundler (tsup/esbuild)
import pkg from "../package.json" with { type: "json" }

/**
 * The current SDK version. Sent in the User-Agent header so the API can
 * correlate requests with SDK versions during support and debugging.
 *
 * Derived from package.json at build time.
 *
 * @public
 */
export const VERSION: string = pkg.version
