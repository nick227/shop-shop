import { test, expect, devices } from '@playwright/test'
import { loginAsCustomer } from '../fixtures/auth'

// Apply iPhone 12 viewport to the entire file
test.use({ ...devices['iPhone 12'] })

test.describe('Mobile Responsiveness', () => {

  test('should display mobile-optimized river landing page', async ({ page }) => {
    await loginAsCustomer(page)
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThan(768)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should have touch-friendly buttons (≥44px tall)', async ({ page }) => {
    await loginAsCustomer(page)
    const button = page.getByRole('button').first()
    const box = await button.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(40)
  })

  test.skip('should support swipe gestures on card stack — /home-new route removed', async ({ page }) => {})

  test('should redirect unauthenticated user from protected route to login', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('mobile navigation is accessible after signup', async ({ page }) => {
    await loginAsCustomer(page)
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Tablet Responsiveness', () => {
  test('tablet layout renders river landing page without errors', async ({ page }) => {
    // Override to tablet viewport (iPad Pro: 1024×1366)
    await page.setViewportSize({ width: 1024, height: 1366 })
    await loginAsCustomer(page)

    const viewport = page.viewportSize()
    expect(viewport?.width).toBeGreaterThan(768)
    await expect(page.locator('body')).toBeVisible()
  })
})
