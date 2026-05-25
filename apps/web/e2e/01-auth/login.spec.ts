/**
 * E2E Tests: User Login Flow
 *
 * DualAuthWidget renders at /login in "login" mode with:
 *   - Tab buttons: "Sign In" (active), "Register" — both type="button"
 *   - Submit button: "Sign In" — type="submit", inside form[name="login"]
 *
 * Use `page.locator('button[type="submit"]')` for the submit button to avoid
 * strict-mode conflicts with the "Sign In" tab button.
 *
 * Inputs have HTML `required` and `type="email"`. To test JS/zod validation,
 * use values that pass browser validation but fail zod (e.g., test..user@example.com
 * passes HTML5 email format check but fails zod's consecutive-dot refine).
 */
import { test, expect } from '@playwright/test'

const submitBtn = (page: Parameters<Parameters<typeof test>[1]>[0]) =>
  page.locator('button[type="submit"]')

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/^password/i)).toBeVisible()
    await expect(submitBtn(page)).toBeVisible()
  })

  test('should prevent submission with empty form (browser required validation)', async ({ page }) => {
    await submitBtn(page).click()
    // HTML5 required attribute blocks submission — we stay on login page
    await expect(page).toHaveURL(/\/login/)
    await expect(page).not.toHaveURL(/\/river/)
  })

  test('should show error for invalid email format', async ({ page }) => {
    // test..user@example.com passes browser type="email" check but fails zod's
    // refine (consecutive dots in local part) → JS error "Invalid email address" appears
    await page.getByLabel(/email address/i).fill('test..user@example.com')
    await page.getByLabel(/^password/i).fill('Test123456!')
    await submitBtn(page).click()
    await expect(page.getByText(/invalid email address/i)).toBeVisible({ timeout: 5000 })
  })

  test('should show error for incorrect credentials', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('wrong@example.com')
    await page.getByLabel(/^password/i).fill('WrongPassword123!')
    await submitBtn(page).click()
    await expect(page.getByText(/invalid|incorrect|wrong|failed/i)).toBeVisible({ timeout: 12000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Login Test User',
      email: `login-test-${timestamp}@example.com`,
      password: 'Test123456!',
    }

    // Create account first
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill(testUser.name)
    await page.getByLabel(/email address/i).fill(testUser.email)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/river/, { timeout: 15000 })

    // Clear auth state and login
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')
    await page.getByLabel(/email address/i).fill(testUser.email)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await submitBtn(page).click()
    await page.waitForURL(/\/river/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/river/)
  })

  test('should switch to register form via Register tab', async ({ page }) => {
    await page.getByRole('button', { name: /register/i }).click()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText(/create account/i)
  })

  test('should remember user after page refresh', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Persist Test User',
      email: `persist-${timestamp}@example.com`,
      password: 'Test123456!',
    }

    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill(testUser.name)
    await page.getByLabel(/email address/i).fill(testUser.email)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/river/, { timeout: 15000 })

    await page.reload()
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('should disable submit button while submitting', async ({ page }) => {
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/^password/i).fill('Test123456!')
    await submitBtn(page).click()
    await expect(submitBtn(page)).toBeDisabled()
  })
})
