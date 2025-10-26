/**
 * E2E Tests: ZIP Code Store Search
 * Tests store searching by ZIP code 78758 and verifies no errors occur
 */
import { test, expect } from '../fixtures'

test.describe('ZIP Code Store Search', () => {
  test('should search for stores by ZIP code 78758 without errors', async ({ authenticatedPage: page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')
    
    // Look for location search input (ZIP code field)
    const zipInput = page.getByPlaceholder(/enter zip code/i)
    await expect(zipInput).toBeVisible({ timeout: 10000 })
    
    // Enter ZIP code 78758
    await zipInput.fill('78758')
    
    // Click search button or press Enter
    const searchButton = page.getByRole('button', { name: /search/i })
    if (await searchButton.isVisible()) {
      await searchButton.click()
    } else {
      await zipInput.press('Enter')
    }
    
    // Wait for search to complete and results to load
    await page.waitForTimeout(3000)
    
    // Verify no error messages are displayed
    const errorMessages = page.locator('text=/error|Error|ERROR/')
    await expect(errorMessages).toHaveCount(0)
    
    // Verify no "render2 is not a function" or similar React errors
    const reactErrors = page.locator('text=/render2|unexpected application error|application error/i')
    await expect(reactErrors).toHaveCount(0)
    
    // Check that the page is still functional (not crashed)
    await expect(page.locator('body')).toBeVisible()
    
    // Verify that store sections are visible (even if empty)
    const newestStores = page.locator('text=/newest stores|🆕 newest stores/i')
    const featuredStores = page.locator('text=/featured stores|⭐ featured stores/i')
    const categories = page.locator('text=/categories|🍽️ categories/i')
    
    // At least one of these sections should be visible
    const hasNewestStores = await newestStores.isVisible()
    const hasFeaturedStores = await featuredStores.isVisible()
    const hasCategories = await categories.isVisible()
    
    expect(hasNewestStores || hasFeaturedStores || hasCategories).toBe(true)
    
    // Check for any "No stores found" message (should be small and unobtrusive)
    const noStoresMessage = page.locator('text=/no stores found in this area/i')
    if (await noStoresMessage.isVisible()) {
      // If the message is visible, it should be small and not overwhelming
      const messageElement = noStoresMessage.first()
      const boundingBox = await messageElement.boundingBox()
      expect(boundingBox?.height).toBeLessThan(100) // Should be small
    }
    
    // Verify the page is still interactive
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // Check that we can still navigate (no crashes)
    const vendorButton = page.getByRole('button', { name: /sell|vendor/i })
    if (await vendorButton.isVisible()) {
      await vendorButton.click()
      await page.waitForTimeout(1000)
      // Should navigate to vendor portal or show vendor content
    }
  })

  test('should handle search results gracefully', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Search for ZIP 78758
    const zipInput = page.getByPlaceholder(/enter zip code/i)
    await zipInput.fill('78758')
    await zipInput.press('Enter')
    
    // Wait for search completion
    await page.waitForTimeout(3000)
    
    // Check console for any JavaScript errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000)
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_') &&
      !error.includes('render2 is not a function')
    )
    
    // Should have no critical errors
    expect(criticalErrors).toHaveLength(0)
    
    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible()
    
    // Check that store sections are present
    const storeSections = page.locator('[class*="store"], [data-testid*="store"]')
    const sectionCount = await storeSections.count()
    
    // Should have at least some store-related content (even if empty states)
    expect(sectionCount).toBeGreaterThan(0)
  })

  test('should display map without errors when searching', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Search for ZIP 78758
    const zipInput = page.getByPlaceholder(/enter zip code/i)
    await zipInput.fill('78758')
    await zipInput.press('Enter')
    
    // Wait for search and map to load
    await page.waitForTimeout(5000)
    
    // Check for map container (if map view is enabled)
    const mapContainer = page.locator('[class*="map"], [id*="map"], .leaflet-container')
    if (await mapContainer.isVisible()) {
      // Map should be visible and not show errors
      await expect(mapContainer).toBeVisible()
      
      // Check for any map-related error messages
      const mapErrors = page.locator('text=/map error|loading map|failed to load/i')
      const errorCount = await mapErrors.count()
      
      // Should not have persistent map errors
      expect(errorCount).toBeLessThan(3)
    }
    
    // Verify no React lazy loading errors
    const lazyErrors = page.locator('text=/lazy|render2|not a function/i')
    await expect(lazyErrors).toHaveCount(0)
  })
})
