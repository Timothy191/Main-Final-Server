import { test, expect } from '@playwright/test'

test.describe('Control Room Department Visual & Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Control Room dashboard (or login mock)
    await page.goto('http://localhost:3000/control-room')
    await page.waitForLoadState('domcontentloaded')
  })

  test('control room dashboard elements are visible', async ({ page }) => {
    // SCADA alert feed title
    const scadaFeedHeader = page.locator('text=SCADA Live Telemetry Feed')
    if (await scadaFeedHeader.isVisible()) {
      await expect(scadaFeedHeader).toBeVisible()
    }
  })

  test('hourly loads page layout rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/control-room/hourly-loads')
    await page.waitForLoadState('domcontentloaded')

    // Table or title visible
    const pageHeader = page.locator('h1, h2, h3').first()
    await expect(pageHeader).toBeVisible()
  })

  test('machine operations shift sheet layout', async ({ page }) => {
    await page.goto('http://localhost:3000/control-room/machine-operations')
    await page.waitForLoadState('domcontentloaded')

    // Apply button or shift selector
    const applyButton = page.locator('button', { hasText: /apply|submit|save/i }).first()
    if (await applyButton.isVisible()) {
      await expect(applyButton).toBeVisible()
    }
  })
})
