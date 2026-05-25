import { test, expect } from '@playwright/test'
import { loginAsVendor } from '../fixtures/auth'

/**
 * Category: Catalog Management
 * Requirements: FR-021, FR-022, FR-023, FR-024, FR-025
 */
test.describe('Catalog Management', () => {

  test('FR-021: vendor can access dashboard to manage their store catalog', async ({ page }) => {
    await loginAsVendor(page)
    await page.goto('/vendor/dashboard')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test.skip('FR-022: item variants (size, flavor, pack) with independent SKUs — requires a seeded store with items', async ({ page }) => {})

  test.skip('FR-023: item modifiers and add-ons with rules (required, max, min) — requires a seeded store with items', async ({ page }) => {})

  test.skip('FR-024: bulk catalog import/export via CSV — requires a seeded store', async ({ page }) => {})

  test.skip('FR-025: draft catalog changes with preview and scheduled publish — requires catalog publish workflow UI', async ({ page }) => {})
})
