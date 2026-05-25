/**
 * Authentication Fixtures for E2E Tests
 *
 * The `authenticatedPage` fixture and `loginAsCustomer/Vendor` helpers use a
 * pre-authenticated storageState created by global-setup.ts instead of signing
 * up per-test. This avoids the server's API rate limits (20 signups / 5 logins
 * per 15 minutes).
 *
 * Auth state file: e2e/.auth/user.json (git-ignored, created by global-setup.ts)
 */
import { test as base, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { AUTH_STATE_PATH } from '../global-setup'

interface TestUser {
  email: string
  password: string
  name: string
}

interface AuthFixtures {
  authenticatedPage: Page
  testUser: TestUser
}

/**
 * Signup helper — fills the DualAuthWidget register form at /signup.
 * Fields: Full Name, Email Address, Password. No phone or confirm-password.
 * Only used for tests that explicitly test the signup flow.
 */
export async function signup(page: Page, user: TestUser): Promise<void> {
  await page.goto('/signup')

  await page.getByLabel(/full name/i).fill(user.name)
  await page.getByLabel(/email address/i).fill(user.email)
  await page.getByLabel(/^password/i).fill(user.password)

  // Use type="submit" selector — avoids strict-mode conflict with the "Sign In" tab button
  await page.locator('button[type="submit"]').click()

  await page.waitForURL(/\/river/, { timeout: 15000 })
}

/**
 * Inject auth state from the global-setup storageState file into the current
 * page's localStorage. Does NOT make any rate-limited API calls.
 */
async function injectAuthState(page: Page): Promise<void> {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    throw new Error(
      `Auth state file not found at ${AUTH_STATE_PATH}. ` +
      'Run the test suite once to execute global-setup.ts and create it.'
    )
  }

  const state = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as {
    origins: Array<{
      origin: string
      localStorage: Array<{ name: string; value: string }>
    }>
  }

  // Navigate to the app origin so we can set localStorage
  await page.goto('/')

  const appOrigin = state.origins.find(o =>
    o.origin.includes('localhost:5187') || o.origin.includes('localhost:3000')
  )
  if (appOrigin?.localStorage.length) {
    for (const item of appOrigin.localStorage) {
      await page.evaluate(
        ([key, value]) => localStorage.setItem(key, value),
        [item.name, item.value]
      )
    }
  }

  // Navigate to river — AuthContext rehydrates from localStorage and validates the token
  await page.goto('/river')
  await page.waitForURL(/\/river/, { timeout: 15000 })
}

/**
 * Extend base test with authentication fixtures.
 * Uses pre-authenticated storageState — no per-test signup.
 */
export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    await use({
      name: 'E2E Shared User',
      email: 'e2e-shared@example.com',
      password: 'E2EShared123!',
    })
  },

  authenticatedPage: async ({ browser }, use) => {
    if (!fs.existsSync(AUTH_STATE_PATH)) {
      throw new Error(
        `Auth state not found at ${AUTH_STATE_PATH}. ` +
        'Run the full test suite (which triggers global-setup) or run global-setup directly.'
      )
    }

    // Create a fresh context with the pre-authenticated storageState
    const context = await browser.newContext({
      storageState: AUTH_STATE_PATH,
    })
    const page = await context.newPage()

    // Navigate to trigger AuthContext token rehydration from localStorage
    await page.goto('/river')
    await page.waitForURL(/\/river/, { timeout: 15000 })

    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'

/**
 * Authenticate as a customer using the shared auth state (no signup).
 */
export async function loginAsCustomer(page: Page): Promise<void> {
  await injectAuthState(page)
}

/**
 * Authenticate as a vendor using the shared auth state (no signup).
 * Note: the shared user has role USER — vendor-specific tests may need
 * TEST_VENDOR_EMAIL/TEST_VENDOR_PASSWORD env vars and a seeded vendor account.
 */
export async function loginAsVendor(page: Page): Promise<void> {
  await injectAuthState(page)
}

/**
 * Authenticate as an admin using env-var credentials (seeded account required).
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set for admin login')
  }
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/^password/i).fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/admin/, { timeout: 10000 })
}
