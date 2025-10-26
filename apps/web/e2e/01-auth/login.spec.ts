/**
 * E2E Tests: User Login Flow
 * Tests the authentication and login process
 */
import { test, expect } from '@playwright/test'

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login-new')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /log in/i }).click()
    
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/email/i).blur()
    
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('should show error for incorrect credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('WrongPassword123!')
    await page.getByRole('button', { name: /log in/i }).click()

    // Should show error message
    await expect(page.getByText(/invalid credentials|incorrect/i)).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // First, create a test user via signup
    const timestamp = Date.now()
    const testUser = {
      name: 'Login Test User',
      email: `login-test-${timestamp}@example.com`,
      phone: '1234567890',
      password: 'Test123456!',
    }

    // Signup
    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    // Logout (navigate away)
    await page.goto('/login-new')

    // Now test login
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)
    await page.getByRole('button', { name: /log in/i }).click()

    // Should redirect to home page
    await page.waitForURL('/', { timeout: 10000 })
    await expect(page).toHaveURL('/')
  })

  test('should navigate to signup page from link', async ({ page }) => {
    await page.getByText(/don't have an account/i).click()
    
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should remember user after page refresh', async ({ page, context }) => {
    // Create and login user
    const timestamp = Date.now()
    const testUser = {
      name: 'Persist Test User',
      email: `persist-${timestamp}@example.com`,
      phone: '1234567890',
      password: 'Test123456!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')

    // Refresh the page
    await page.reload()

    // User should still be on home page (authenticated)
    await expect(page).toHaveURL('/')
  })

  test('should disable login button while submitting', async ({ page }) => {
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123456!')
    
    const loginButton = page.getByRole('button', { name: /log in/i })
    await loginButton.click()

    // Button should be disabled during submission
    await expect(loginButton).toBeDisabled()
  })
})


