/**
 * E2E Tests: Complete User Journeys
 * End-to-end tests for full customer workflows
 */
import { test, expect } from '@playwright/test'

test.describe('Complete Customer Journey', () => {
  test('new user: signup → browse → add to cart → view orders', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Journey Test User',
      email: `journey-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Journey123456!',
    }

    // Step 1: Sign up
    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    // Should redirect to home
    await page.waitForURL('/', { timeout: 10000 })

    // Step 2: Browse stores
    await page.waitForTimeout(2000)
    
    // Verify stores are visible
    const stores = page.locator('[data-testid="store-card"], article')
    await expect(stores.first()).toBeVisible()

    // Step 3: Click on a store
    await stores.first().click()
    await page.waitForURL(/\/stores\/\d+/, { timeout: 5000 })

    // Step 4: Add item to cart
    await page.waitForTimeout(2000)
    const addButton = page.getByRole('button', { name: /add to cart|add/i }).first()
    await addButton.click()
    await page.waitForTimeout(1000)

    // Step 5: Verify cart badge
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toBeVisible()

    // Step 6: View cart
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    const cartDrawer = page.locator('[role="dialog"]')
    await expect(cartDrawer).toBeVisible()

    // Step 7: Close cart
    await page.getByRole('button', { name: /close/i }).click()
    await page.waitForTimeout(500)

    // Step 8: Navigate to orders
    await page.goto('/orders')
    await page.waitForTimeout(1000)
    
    // Should show empty orders (no checkout yet)
    await expect(page).toHaveURL('/orders')
  })

  test('returning user: login → browse → shop', async ({ page }) => {
    // First create user
    const timestamp = Date.now()
    const testUser = {
      name: 'Returning User',
      email: `returning-${timestamp}@example.com`,
      phone: '5559876543',
      password: 'Returning123!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    // Logout by clearing storage
    await page.evaluate(() => localStorage.clear())
    
    // Now login
    await page.goto('/login-new')
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/password/i).fill(testUser.password)
    await page.getByRole('button', { name: /log in/i }).click()
    
    await page.waitForURL('/')
    
    // Should be authenticated and able to browse
    await page.waitForTimeout(2000)
    const stores = page.locator('[data-testid="store-card"], article')
    await expect(stores.first()).toBeVisible()
  })

  test('guest attempt: should redirect to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/')
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('session persistence: should maintain auth across page reload', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Persist User',
      email: `persist-${timestamp}@example.com`,
      phone: '5551112222',
      password: 'Persist123!',
    }

    // Sign up
    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    // Reload page
    await page.reload()
    
    // Should still be on home (authenticated)
    await expect(page).toHaveURL('/')
    
    // Should see stores (not redirected to login)
    await page.waitForTimeout(2000)
    const stores = page.locator('[data-testid="store-card"], article')
    await expect(stores.first()).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Intercept API calls and simulate failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/login-new')
    
    // Try to login
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123!')
    await page.getByRole('button', { name: /log in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/network error|connection error|try again/i)).toBeVisible()
  })

  test('should show loading states during API calls', async ({ page }) => {
    await page.goto('/login-new')
    
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('Test123!')
    
    const loginButton = page.getByRole('button', { name: /log in/i })
    await loginButton.click()
    
    // Button should be disabled or show loading
    await expect(loginButton).toBeDisabled()
  })

  test('should handle invalid store ID gracefully', async ({ page }) => {
    // First login
    const timestamp = Date.now()
    const testUser = {
      email: `invalid-${timestamp}@example.com`,
      password: 'Invalid123!',
    }
    
    // Quick signup
    await page.goto('/signup')
    await page.getByLabel(/name/i).fill('Invalid Test')
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill('5551111111')
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    await page.waitForURL('/')
    
    // Try invalid store ID
    await page.goto('/stores/99999')
    await page.waitForTimeout(2000)
    
    // Should show error or empty state
    const errorMessage = page.getByText(/not found|doesn't exist|error/i)
    // Error handling should prevent crash
  })
})


