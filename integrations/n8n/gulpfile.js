/**
 * Copies node/credential SVG icons into dist/ next to the compiled JS,
 * following the n8n community-node convention. tsc handles the .ts -> .js
 * compilation; this task only mirrors the static icon assets.
 */
const { src, dest } = require("gulp")

function buildIcons() {
  return src("nodes/**/*.{png,svg}", { base: "." }).pipe(dest("dist"))
}

exports["build:icons"] = buildIcons
exports.default = buildIcons
