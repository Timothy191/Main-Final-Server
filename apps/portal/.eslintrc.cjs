/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    "public/",
    "coverage/",
    "src.backup/",
    ".eslintrc.js",
    "jest.config.js",
    "postcss.config.mjs",
    "next.config.mjs",
    "storybook.d.ts",
    "e2e/",
  ],
  extends: ["@repo/eslint-config/next"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  rules: {
    // Next.js monorepo convention: consistent type imports
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
      },
    ],
    "@typescript-eslint/no-import-type-side-effects": "error",
    // Next.js convention: strict unused vars with underscore prefix
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "none",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      },
    ],
    // React hooks exhaustive deps (from Next.js's react-hooks/recommended)
    "react-hooks/exhaustive-deps": "error",
  },
  overrides: [
    {
      files: ["scripts/*.js", "e2e/**/*.ts"],
      env: { node: true },
      parserOptions: {
        project: null,
      },
      rules: {
        "no-console": "off",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/setupTests.ts"],
      env: { jest: true },
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
      },
    },
    {
      files: ["lib/env.ts", "lib/ai/tools.ts"],
      rules: {
        "no-restricted-imports": "off",
      },
    },
    {
      files: ["src/components/**/*.tsx", "src/hooks/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "@react-pdf/renderer",
                message: "Server-only package @react-pdf/renderer must not be statically imported into Client Components.",
              },
              {
                name: "server-only",
                message: "server-only package cannot be imported into Client Components.",
              },
            ],
          },
        ],
      },
    },
  ],
};
