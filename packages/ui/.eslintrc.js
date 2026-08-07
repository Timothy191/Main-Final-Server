/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@repo/eslint-config/react-internal"],
  parser: "@typescript-eslint/parser",
  rules: {
    "no-redeclare": "off",
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@repo/redis",
            message: "UI package @repo/ui must not import server cache packages.",
          },
          {
            name: "@repo/database",
            message: "UI package @repo/ui must not import server database packages.",
          },
          {
            name: "@repo/supabase/server",
            message: "UI package @repo/ui must not import server Supabase auth clients.",
          },
        ],
      },
    ],
  },
};
