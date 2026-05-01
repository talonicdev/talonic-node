import { defineConfig } from "tsup"

export default defineConfig([
  // Library bundle (ESM + CJS + types).
  {
    entry: { index: "src/index.ts", content: "src/content/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node18",
    outDir: "dist",
    splitting: false,
    treeshake: true,
    minify: false,
  },
  // CLI bundle (ESM-only, executable).
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    sourcemap: true,
    target: "node18",
    outDir: "dist",
    splitting: false,
    treeshake: true,
    minify: false,
    banner: { js: "#!/usr/bin/env node" },
  },
])
