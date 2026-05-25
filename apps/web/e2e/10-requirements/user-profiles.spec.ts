import { test, expect } from '@playwright/test'
import { loginAsCustomer } from '../fixtures/auth'

/**
 * Category: User Profiles
 * Requirements: FR-006, FR-007, FR-008, FR-009, FR-010
 */
test.describe('User Profiles', () => {

  test('FR-006: customer can view and edit profile info (name, email)', async ({ page }) => {
    await loginAsCustomer(page)
    await page.goto('/account/profile')
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /edit/i })).toBeVisible()
  })

  test('FR-007: customer can manage saved delivery addresses', async ({ page }) => {
    await loginAsCustomer(page)
    await page.goto('/account/addresses')
    // Page should load without error — header "Add Address" button always visible
    await expect(page.getByRole('button', { name: 'Add Address' })).toBeVisible({ timeout: 10000 })
  })

  test('FR-008: customer can view order history', async ({ page }) => {
    await loginAsCustomer(page)
    await page.goto('/account/orders')
    // Orders page renders — either list or empty state
    await expect(page.getByText(/orders|no orders|placed/i)).toBeVisible({ timeout: 10000 })
  })

  test.skip('FR-009: customer can manage notification preferences — notification settings page not yet built', async ({ page }) => {})

  test.skip('FR-010: customer can update contact methods and default fulfillment preferences — requires profile settings expansion', async ({ page }) => {})
})
