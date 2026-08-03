import { test, expect } from '@playwright/test'

test.describe('Primitives Showcase Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/docs/components')
    await page.waitForLoadState('networkidle')
  })

  test('full page screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('primitives-showcase-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    })
  })

  test('avatar primitive', async ({ page }) => {
    const avatarCard = page.locator('text=Avatar Primitive').locator('..').locator('..')
    await expect(avatarCard).toBeVisible()
    await expect(avatarCard).toHaveScreenshot('avatar-primitive.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('kbd primitive', async ({ page }) => {
    const kbdCard = page.locator('text=Kbd Primitive').locator('..').locator('..')
    await expect(kbdCard).toBeVisible()
    await expect(kbdCard).toHaveScreenshot('kbd-primitive.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('spinner primitive', async ({ page }) => {
    const spinnerCard = page.locator('text=Spinner Primitive').locator('..').locator('..')
    await expect(spinnerCard).toBeVisible()
    await expect(spinnerCard).toHaveScreenshot('spinner-primitive.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('UI Primitives Showcase')
    await expect(page.locator('text=@repo/ui')).toBeVisible()
    await expect(page.locator('text=Live showcase of primitives')).toBeVisible()
  })

  test('all three primitive cards are visible', async ({ page }) => {
    await expect(page.locator('text=Avatar Primitive')).toBeVisible()
    await expect(page.locator('text=Kbd Primitive')).toBeVisible()
    await expect(page.locator('text=Spinner Primitive')).toBeVisible()
  })
})
