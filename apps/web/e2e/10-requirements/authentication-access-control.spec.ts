import { test, expect } from '@playwright/test'
import { loginAsCustomer } from '../fixtures/auth'

/**
 * Category: Authentication & Access Control
 * Requirements: FR-001, FR-002, FR-003, FR-004, FR-005
 */
test.describe('Authentication & Access Control', () => {

  test('FR-001: customer can sign up via email and land on the app', async ({ page }) => {
    const ts = Date.now()
    await page.goto('/signup')
    await page.getByLabel(/name/i).fill('FR001 User')
    await page.getByLabel(/email/i).fill(`fr001-${ts}@example.com`)
    await page.getByLabel(/^password/i).fill('Test123456!')
    await page.getByRole('button', { name: /create account/i }).click()
    await page.waitForURL(/\/river/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('FR-002: unauthenticated access to admin routes redirects to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('FR-003: authenticated session persists after page reload', async ({ page }) => {
    await loginAsCustomer(page)
    await page.reload()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('FR-004: invalid credentials show an authentication error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('nobody@example.invalid')
    await page.getByLabel(/^password/i).fill('WrongPass123!')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/invalid|incorrect|wrong|failed|error/i)).toBeVisible({ timeout: 8000 })
  })

  test.skip('FR-005: role-based access enforced for vendor and admin roles — requires seeded privileged accounts', async ({ page }) => {})
})
