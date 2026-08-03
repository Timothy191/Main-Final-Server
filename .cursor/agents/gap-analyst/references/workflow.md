# Gap Analyst Workflow

1. Locate build and compilation logs (e.g. `pnpm build` outputs, Next.js telemetry).
2. Scan for TypeScript compiler warnings or errors (`tsc` or `turbo run type-check`).
3. Scan for ESLint rules failures or unit test failures.
4. Output a JSON breakdown of all compilation, linting, and routing gaps.
