const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    browser: true,
    jest: true
  },
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: project
  },
  globals: {
    React: true,
    JSX: true
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true
      }
    ]
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      env: {
        jest: true
      }
    }
  ],
  ignorePatterns: [
    ".*.js",
    "node_modules/",
    "dist/",
    "src/tokens/generated.ts",
    "src/tokens/generated-sd.ts"
  ]
};