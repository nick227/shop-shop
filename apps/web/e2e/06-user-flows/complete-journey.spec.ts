import { test, expect } from '@playwright/test'

async function createAccount(page: Parameters<Parameters<typeof test>[1]>[0], user: { name: string; email: string; password: string }) {
  await page.goto('/signup')
  await page.getByLabel(/name/i).fill(user.name)
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/^password/i).fill(user.password)
  await page.getByRole('button', { name: /create account/i }).click()
  await page.waitForURL(/\/river/, { timeout: 15000 })
}

test.describe('Complete Customer Journey', () => {
  test('new user: signup → land on river → navigate to orders', async ({ page }) => {
    const timestamp = Date.now()
    await createAccount(page, {
      name: 'Journey Test User',
      email: `journey-${timestamp}@example.com`,
      password: 'Journey123456!',
    })

    await expect(page.locator('body')).toBeVisible()

    await page.goto('/orders')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByText(/orders|no orders/i)).toBeVisible({ timeout: 10000 })
  })

  test('returning user: signup then login via credentials', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Returning User',
      email: `returning-${timestamp}@example.com`,
      password: 'Returning123!',
    }

    await createAccount(page, testUser)

    // Clear auth state
    await page.evaluate(() => localStorage.clear())

    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/river/, { timeout: 15000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('guest attempt: accessing a protected route redirects to login', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('session persistence: auth survives page reload', async ({ page }) => {
    const timestamp = Date.now()
    await createAccount(page, {
      name: 'Persist User',
      email: `persist-${timestamp}@example.com`,
      password: 'Persist123!',
    })

    await page.reload()
    await expect(page).not.toHaveURL(/\/login/)
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully on login', async ({ page }) => {
    // Only abort the login endpoint so the initial /me auth check doesn't block page render
    await page.route('**/auth/v1/login', route => route.abort())
    await page.goto('/login')
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/^password/i).fill('Test123!')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/network error|connection error|try again|failed|error/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('should show loading state while login request is in-flight', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/^password/i).fill('Test123!')

    const signInButton = page.locator('button[type="submit"]')
    await signInButton.click()
    await expect(signInButton).toBeDisabled()
  })

  test('should render 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible({ timeout: 8000 })
  })
})
