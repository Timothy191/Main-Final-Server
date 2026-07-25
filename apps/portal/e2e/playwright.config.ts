import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*.visual.test.ts',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  // Do NOT start webServer here — the dev server is expected to be running
  // separately via `pnpm dev` for these visual regression tests.
})
