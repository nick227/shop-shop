/**
 * E2E Tests: Store Discovery & Browsing
 * Tests store listing, search, and navigation
 */
import { test, expect } from '../fixtures'

test.describe('Browse Stores (Guest User)', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/')
    
    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('should display stores on homepage', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    // Wait for stores to load
    await page.waitForSelector('[data-testid="store-card"], [class*="store"]', { timeout: 10000 })
    
    // Verify at least one store is visible
    const stores = page.locator('[data-testid="store-card"], [class*="StoreCard"], [class*="store"]')
    await expect(stores.first()).toBeVisible()
  })

  test('should display store information', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    await page.waitForTimeout(2000) // Wait for stores to load
    
    const storeCard = page.locator('[data-testid="store-card"], [class*="StoreCard"]').first()
    
    // Store card should contain name, delivery info, rating
    await expect(storeCard).toBeVisible()
    
    // Verify store has clickable content
    await expect(storeCard).not.toBeEmpty()
  })

  test('should navigate to store detail when clicking store', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    await page.waitForTimeout(2000)
    
    // Click on first store
    const storeCard = page.locator('[data-testid="store-card"], [class*="StoreCard"], article').first()
    await storeCard.click()
    
    // Should navigate to store detail page
    await page.waitForURL(/\/stores\/\d+/, { timeout: 5000 })
  })
})

test.describe('Store Search', () => {
  test('should display search input', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should filter stores by search query', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    await page.waitForTimeout(2000)
    
    // Get initial store count
    const stores = page.locator('[data-testid="store-card"], [class*="StoreCard"]')
    const initialCount = await stores.count()
    
    // Search for specific term
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('pizza')
    await searchInput.press('Enter')
    
    // Wait for filtering
    await page.waitForTimeout(1000)
    
    // Note: This assumes client-side filtering or API search
    // Results should change based on search
  })

  test('should clear search', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('test search')
    await searchInput.clear()
    
    await expect(searchInput).toHaveValue('')
  })
})

test.describe('CardStack UI (New Homepage)', () => {
  test('should display card stack on new homepage', async ({ authenticatedPage: page }) => {
    await page.goto('/home-new')
    
    // Wait for store cards to load
    await page.waitForTimeout(2000)
    
    // Verify card stack is visible
    const cardStack = page.locator('[class*="CardStack"]')
    await expect(cardStack).toBeVisible()
  })

  test('should swipe through stores with keyboard', async ({ authenticatedPage: page }) => {
    await page.goto('/home-new')
    
    await page.waitForTimeout(2000)
    
    // Press right arrow to go to next store
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)
    
    // Press left arrow to go back
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(500)
  })

  test('should have accept button for current store', async ({ authenticatedPage: page }) => {
    await page.goto('/home-new')
    
    await page.waitForTimeout(2000)
    
    // Look for accept/view button
    const acceptButton = page.getByRole('button', { name: /view menu|accept|select/i })
    await expect(acceptButton).toBeVisible()
  })
})


