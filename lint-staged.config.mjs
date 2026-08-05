/**
 * lint-staged config — Next.js convention: Prettier first, then ESLint.
 * Excludes backup directories and Rust bindings.
 * @param {string[]} filenames
 */
function filterFiles(filenames) {
  return filenames.filter(
    (f) =>
      !f.includes("/src.backup/") &&
      !f.includes("/packages/rust-bindings/"),
  );
}

export default {
  "*.{js,jsx,ts,tsx,mts,cjs,mjs}": (filenames) => {
    const files = filterFiles(filenames);
    if (files.length === 0) return [];
    const quoted = files.map((f) => `"${f}"`).join(" ");
    return [
      `prettier --write --ignore-unknown ${quoted}`,
      `eslint --fix --cache ${quoted}`,
    ];
  },
  "*.{json,md,css,html,yml,yaml}": "prettier --write --ignore-unknown",
  ".agents/knowledge/**/*.md": "markdownlint --fix",
  "packages/supabase/migrations/*.sql": () => "pnpm db:codegen",
};