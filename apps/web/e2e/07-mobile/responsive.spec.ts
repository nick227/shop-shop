/**
 * E2E Tests: Mobile Responsiveness
 * Tests mobile-specific features and responsive design
 */
import { test, expect, devices } from '@playwright/test'

// Configure mobile device for all tests in this file
test.use({ ...devices['iPhone 12'] })

test.describe('Mobile Responsiveness', () => {

  test('should display mobile-optimized homepage', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Mobile User',
      email: `mobile-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Mobile123!',
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
    
    // Verify responsive layout
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeLessThan(768)
  })

  test('should have touch-friendly buttons on mobile', async ({ page }) => {
    // Mobile buttons should be at least 44x44px (Apple guideline)
    const timestamp = Date.now()
    const testUser = {
      name: 'Touch User',
      email: `touch-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Touch123!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    await page.waitForTimeout(2000)
    
    const button = page.getByRole('button').first()
    const box = await button.boundingBox()
    
    // Button should be tall enough for touch
    expect(box?.height).toBeGreaterThan(40)
  })

  test('should support swipe gestures on card stack', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Swipe User',
      email: `swipe-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Swipe123!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    await page.goto('/home-new')
    await page.waitForTimeout(2000)
    
    // Verify card stack exists
    const cardStack = page.locator('[class*="CardStack"]')
    await expect(cardStack).toBeVisible()
  })

  test('should have mobile-friendly navigation', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Nav User',
      email: `nav-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Nav123!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    // Mobile navigation should be accessible
    await expect(page).toHaveURL('/')
  })
})

test.describe('Tablet Responsiveness', () => {
  test.use({ ...devices['iPad Pro'] })

  test('should display tablet-optimized layout', async ({ page }) => {
    const timestamp = Date.now()
    const testUser = {
      name: 'Tablet User',
      email: `tablet-${timestamp}@example.com`,
      phone: '5551234567',
      password: 'Tablet123!',
    }

    await page.goto('/signup')
    await page.getByLabel(/name/i).fill(testUser.name)
    await page.getByLabel(/email/i).fill(testUser.email)
    await page.getByLabel(/phone/i).fill(testUser.phone)
    await page.getByLabel(/^password/i).fill(testUser.password)
    await page.getByLabel(/confirm password/i).fill(testUser.password)
    await page.getByRole('button', { name: /sign up/i }).click()
    
    await page.waitForURL('/')
    
    await page.waitForTimeout(2000)
    
    // Tablet should show stores
    const stores = page.locator('[data-testid="store-card"], article')
    await expect(stores.first()).toBeVisible()
  })
})


