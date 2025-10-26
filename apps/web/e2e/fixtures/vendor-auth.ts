/**
 * Vendor Authentication Fixtures for E2E Tests
 * Provides authenticated vendor contexts for testing
 */
import { test as base, Page } from '@playwright/test'

interface VendorUser {
  email: string
  password: string
  name: string
  phone: string
}

interface VendorFixtures {
  authenticatedVendor: Page
  vendorUser: VendorUser
  storeId: string
}

/**
 * Signup as vendor and create store
 */
async function signupVendor(page: Page, user: VendorUser): Promise<string> {
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
  
  // Create a store for the vendor
  try {
    await page.goto('/vendor/stores/new')
    await page.waitForTimeout(1000)
    
    // Fill store form
    const timestamp = Date.now()
    await page.getByLabel(/store name/i).fill(`Test Store ${timestamp}`)
    await page.getByLabel(/slug/i).fill(`test-store-${timestamp}`)
    await page.getByLabel(/description/i).fill('E2E Test Store for River Feature')
    
    // Submit store creation
    await page.getByRole('button', { name: /create|save/i }).click()
    await page.waitForTimeout(2000)
    
    // Extract store ID from URL
    const url = page.url()
    const match = url.match(/stores\/([a-f0-9-]+)/i)
    return match ? match[1] : ''
  } catch (error) {
    console.log('Store creation might have failed:', error)
    return ''
  }
}

/**
 * Extend base test with vendor authentication fixtures
 */
export const vendorTest = base.extend<VendorFixtures>({
  vendorUser: async ({}, use) => {
    const user = {
      email: `vendor-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
      password: 'Vendor123456!',
      name: 'Test Vendor',
      phone: '5555555555',
    }
    await use(user)
  },

  storeId: async ({ page, vendorUser }, use) => {
    const storeId = await signupVendor(page, vendorUser)
    await use(storeId)
  },

  authenticatedVendor: async ({ page, storeId }, use) => {
    // Vendor is already authenticated from storeId setup
    await use(page)
    
    // Cleanup
    try {
      await page.goto('/')
    } catch (error) {
      // Ignore cleanup errors
    }
  },
})

export { expect } from '@playwright/test'

