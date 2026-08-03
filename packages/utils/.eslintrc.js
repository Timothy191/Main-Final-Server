/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  env: { browser: true, node: true },
  globals: { RequestInit: "readonly", Response: "readonly", fetch: "readonly" },
  rules: {
    "no-undef": "off", // @typescript-eslint/parser handles TypeScript types
  },
};
