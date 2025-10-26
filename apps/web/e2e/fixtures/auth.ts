/**
 * Authentication Fixtures for E2E Tests
 * Provides authenticated user contexts for testing
 */
import { test as base, Page } from '@playwright/test'

interface TestUser {
  email: string
  password: string
  name: string
}

interface AuthFixtures {
  authenticatedPage: Page
  testUser: TestUser
}

// Test user credentials
export const TEST_USERS = {
  customer: {
    email: `test-customer-${Date.now()}@example.com`,
    password: 'Test123456!',
    name: 'Test Customer',
    phone: '1234567890',
  },
  admin: {
    email: `test-admin-${Date.now()}@example.com`,
    password: 'Admin123456!',
    name: 'Test Admin',
    phone: '0987654321',
  },
} as const

/**
 * Signup helper function
 */
async function signup(page: Page, user: TestUser & { phone: string }): Promise<void> {
  await page.goto('/signup')
  
  // Fill signup form
  await page.getByLabel(/name/i).fill(user.name)
  await page.getByLabel(/email/i).fill(user.email)
  await page.getByLabel(/phone/i).fill(user.phone)
  await page.getByLabel(/^password/i).fill(user.password)
  await page.getByLabel(/confirm password/i).fill(user.password)
  
  // Submit form
  await page.getByRole('button', { name: /sign up/i }).click()
  
  // Wait for redirect to home page
  await page.waitForURL('/', { timeout: 10000 })
}

/**
 * Login helper function
 */
async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login-new')
  
  // Fill login form
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  
  // Submit form
  await page.getByRole('button', { name: /log in/i }).click()
  
  // Wait for redirect
  await page.waitForURL('/', { timeout: 10000 })
}

/**
 * Extend base test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    // Provide a unique test user for each test
    const user = {
      ...TEST_USERS.customer,
      email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    }
    await use(user)
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Sign up the test user
    await signup(page, testUser)
    
    // Provide the authenticated page to the test
    await use(page)
    
    // Cleanup: Logout after test
    try {
      await page.goto('/')
      // Note: Add logout button click when implemented
    } catch (error) {
      // Ignore cleanup errors
    }
  },
})

export { expect } from '@playwright/test'


