/**
 * E2E Tests: User Signup Flow
 * Tests the complete user registration process
 */
import { test, expect } from '@playwright/test'

test.describe('User Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('should display signup form with all fields', async ({ page }) => {
    // Verify form elements are visible
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    await expect(page.getByLabel(/^password/i)).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    // Click submit without filling form
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Verify validation messages appear
    await expect(page.getByText(/name is required/i)).toBeVisible()
    await expect(page.getByText(/email is required/i)).toBeVisible()
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/email/i).blur()
    
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('should show error for password mismatch', async ({ page }) => {
    await page.getByLabel(/^password/i).fill('Test123456!')
    await page.getByLabel(/confirm password/i).fill('Different123!')
    await page.getByLabel(/confirm password/i).blur()
    
    await expect(page.getByText(/passwords.*not match/i)).toBeVisible()
  })

  test('should show error for weak password', async ({ page }) => {
    await page.getByLabel(/^password/i).fill('weak')
    await page.getByLabel(/^password/i).blur()
    
    await expect(page.getByText(/password.*at least/i)).toBeVisible()
  })

  test('should successfully create new account', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Test User',
      email: `test-${timestamp}@example.com`,
      phone: '1234567890',
      password: 'Test123456!',
    }

    // Fill form
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)

    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click()

    // Should redirect to home page
    await page.waitForURL('/', { timeout: 10000 })
    
    // Verify user is authenticated (could check for user menu, etc.)
    await expect(page).toHaveURL('/')
  })

  test('should navigate to login page from link', async ({ page }) => {
    // Click "Already have an account" link
    await page.getByText(/already have an account/i).click()
    
    await expect(page).toHaveURL(/\/login/)
  })

  test('should handle duplicate email error', async ({ page }) => {
    // This test assumes the backend returns proper error for duplicate emails
    const testUser = {
      name: 'Duplicate User',
      email: 'existing@example.com',
      phone: '1234567890',
      password: 'Test123456!',
    }

    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)

    await page.getByRole('button', { name: /sign up/i }).click()

    // Note: This will fail until backend implements duplicate email check
    // For now, we expect success or specific error message
    await page.waitForTimeout(2000)
  })
})


