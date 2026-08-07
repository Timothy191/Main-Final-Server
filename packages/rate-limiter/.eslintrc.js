/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: { node: true },
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@repo/redis",
            message: "UI package @repo/departments/ui must not import server cache packages.",
          },
          {
            name: "@repo/database",
            message: "UI package @repo/departments/ui must not import server database packages.",
          },
          {
            name: "@repo/supabase/server",
            message: "UI package @repo/departments/ui must not import server Supabase auth clients.",
          },
        ],
      },
    ],
  },
};
