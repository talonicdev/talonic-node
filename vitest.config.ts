import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Live tests hit the real Talonic API and consume daily quota. Run
    // them explicitly via `npm run test:live`, never as part of
    // `npm test`.
    exclude: ["tests/live.test.ts", "**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
})
