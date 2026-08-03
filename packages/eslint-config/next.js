/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/no-unescaped-entities': 'off',
  },
  overrides: [
    {
      // Server action files that may be imported by 'use client' components.
      // Static imports of @repo/supabase/server in these files cause Turbopack
      // "module factory not available" errors because server-only deps
      // (@supabase/ssr, 'server-only', next/headers) leak into client chunks.
      // Use dynamic `await import('@repo/supabase/server')` instead.
      files: [
        '**/app/**/actions.ts',
        '**/app/**/actions/*.ts',
        '**/app/logout-action.ts',
        '**/lib/audit.ts',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@repo/supabase/server',
                message:
                  "Use dynamic `await import('@repo/supabase/server')` inside each function body. " +
                  'Static imports of server-only packages in action files cause Turbopack ' +
                  "'module factory not available' errors when client components import these actions.",
              },
              {
                name: 'server-only',
                message:
                  "Do not import 'server-only' in action files — use dynamic imports instead.",
              },
            ],
          },
        ],
      },
    },
  ],
}
