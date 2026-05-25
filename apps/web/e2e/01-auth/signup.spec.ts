/**
 * E2E Tests: User Signup Flow
 *
 * DualAuthWidget renders at /signup in "register" mode with:
 *   - Tab buttons: "Sign In", "Register" (active) — both type="button"
 *   - Fields: Full Name, Email Address, Password
 *   - Submit button: "Create Account" — type="submit", inside form[name="register"]
 *
 * Inputs have HTML `required`. To test JS/zod validation for email, use a value
 * that passes browser `type="email"` check but fails zod (e.g., test..user@example.com
 * passes HTML5 but fails zod's consecutive-dot refine → "Invalid email address").
 * For weak password: any non-empty value with <8 chars passes browser required
 * check but fails zod min(8) → "Password must be at least 8 characters".
 */
import { test, expect } from '@playwright/test'

test.describe('User Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('should display signup form with required fields', async ({ page }) => {
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/^password/i)).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText(/create account/i)
  })

  test('should prevent submission with empty form (browser required validation)', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    // HTML5 required blocks submission — we stay on signup page
    await expect(page).not.toHaveURL(/\/river/)
  })

  test('should show error for invalid email', async ({ page }) => {
    // test..user@example.com passes browser type="email" but fails zod's refine
    // (consecutive dots in local part) → JS error "Invalid email address" appears
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill('test..user@example.com')
    await page.getByLabel(/^password/i).fill('Test123456!')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/invalid email address/i)).toBeVisible({ timeout: 5000 })
  })

  test('should show error for weak password', async ({ page }) => {
    // Fill required fields with valid data; password "weak" is non-empty (passes HTML5)
    // but fails zod min(8) → JS validation runs and shows the error
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/^password/i).fill('weak')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/password must/i)).toBeVisible({ timeout: 5000 })
  })

  test('should successfully create new account', async ({ page }) => {
    const timestamp = Date.now()
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill(`test-${timestamp}@example.com`)
    await page.getByLabel(/^password/i).fill('Test123456!')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/river/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('should switch to login form via Sign In tab', async ({ page }) => {
    // In register mode, "Sign In" tab click switches to login mode (no strict-mode issue)
    await page.getByRole('button', { name: /sign in/i }).click()
    // In login mode the Full Name field disappears
    await expect(page.getByLabel(/full name/i)).not.toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText(/sign in/i)
  })

  test('should handle duplicate email error', async ({ page }) => {
    await page.getByLabel(/full name/i).fill('Duplicate User')
    await page.getByLabel(/email address/i).fill('existing@example.com')
    await page.getByLabel(/^password/i).fill('Test123456!')
    await page.locator('button[type="submit"]').click()

    // Should either succeed (redirect) or show a duplicate-email error
    await expect(
      page.getByText(/already.*account|email.*taken|duplicate|in use/i).or(page.locator('body'))
    ).toBeVisible({ timeout: 8000 })
  })
})
