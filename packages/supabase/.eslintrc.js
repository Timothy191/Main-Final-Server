/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["src/database.types.ts"],
  env: { browser: true, node: true, jest: true },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.spec.ts"],
      env: { jest: true },
    },
  ],
};
