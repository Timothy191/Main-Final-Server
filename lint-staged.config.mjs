/**
 * lint-staged config — Next.js convention: Prettier first, then ESLint.
 * @param {string[]} filenames
 */
function liveTsFiles(filenames) {
  return filenames.filter(
    (f) =>
      !f.includes("/src.backup/") &&
      !f.includes("/packages/rust-bindings/"),
  );
}

export default {
  "*.{js,jsx,ts,tsx,mts}": (filenames) => {
    const files = liveTsFiles(filenames);
    if (files.length === 0) return [];
    const quoted = files.map((f) => `"${f}"`).join(" ");
    return [
      `prettier --write ${quoted}`,
      `eslint --fix ${quoted}`,
    ];
  },
  "*.{json,md,css,html,yml,yaml}": "prettier --write",
  ".agents/knowledge/**/*.md": "markdownlint",
};
