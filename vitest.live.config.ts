import { defineConfig } from "vitest/config"

/**
 * Vitest config for live integration tests against api.talonic.com.
 *
 * Run with:
 *   TALONIC_API_KEY=tlnc_... npm run test:live
 *   TALONIC_API_KEY=tlnc_... TALONIC_TEST_FILE=./fixture.pdf npm run test:live
 *
 * These tests consume your Talonic daily quota.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/live.test.ts"],
    testTimeout: 120_000,
  },
})
