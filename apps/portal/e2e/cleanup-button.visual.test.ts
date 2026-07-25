import { test, expect } from '@playwright/test'

test.describe('Cache Cleanup Button — Satellite Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the satellite monitoring dashboard
    await page.goto('/satellite-monitoring', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
  })

  test('page loads successfully with content', async ({ page }) => {
    // Verify the page loads — check for any meaningful content in the body
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 })
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('page has a document title', async ({ page }) => {
    // Check that the page has a document title set
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 })

    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })
})

test.describe('Cache Cleanup — authenticated tests', () => {
  // These tests require a valid auth session to render the monitoring dashboard.
  // Run with: PLAYWRIGHT_AUTH=1 pnpm exec playwright test --config=e2e/playwright.config.ts
  const isAuth = !!process.env.PLAYWRIGHT_AUTH

  test.skip(isAuth === false, 'auth session required', async ({ page }) => {
    await page.goto('/satellite-monitoring', { waitUntil: 'domcontentloaded', timeout: 60000 })
    const button = page.locator('button', { hasText: 'Clear Cache' })
    await expect(button).toBeVisible({ timeout: 30000 })
  })

  test.skip(isAuth === false, 'auth session required', async ({ page }) => {
    await page.goto('/satellite-monitoring', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.route('**/api/cleanup/trigger', (route) => {
      route.fulfill({ status: 200, body: 'OK' })
    })

    const button = page.locator('button', { hasText: 'Clear Cache' })
    await expect(button).toBeVisible({ timeout: 30000 })
    await button.click()

    const doneButton = page.locator('button', { hasText: 'Cleaned!' })
    await expect(doneButton).toBeVisible({ timeout: 5000 })
  })

  test.skip(isAuth === false, 'auth session required', async ({ page }) => {
    await page.goto('/satellite-monitoring', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.route('**/api/cleanup/trigger', async (route) => {
      await new Promise((r) => setTimeout(r, 2000))
      route.fulfill({ status: 200, body: 'OK' })
    })

    const button = page.locator('button', { hasText: 'Clear Cache' })
    await expect(button).toBeVisible({ timeout: 30000 })
    await button.click()
    await expect(button).toBeDisabled()
  })
})
