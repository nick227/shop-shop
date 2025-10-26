/**
 * E2E Tests: Store Detail Map Validation
 * Tests that the specific store page loads without map errors
 */
import { test, expect } from '../fixtures'

test.describe('Store Detail Map Validation', () => {
  test('should load store ffd965be-f941-425d-9843-ac2721c13b67 without map errors', async ({ authenticatedPage: page }) => {
    // Navigate to the specific store
    await page.goto('/stores/ffd965be-f941-425d-9843-ac2721c13b67')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Check for console errors related to map
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000)
    
    // Filter out map-related errors
    const mapErrors = consoleErrors.filter(error => 
      error.includes('render2') || 
      error.includes('MapContainer') || 
      error.includes('react-leaflet') ||
      error.includes('leaflet')
    )
    
    // Should have no map-related errors
    expect(mapErrors).toHaveLength(0)
    
    // Verify the page loaded successfully
    await expect(page).toHaveURL(/\/stores\/ffd965be-f941-425d-9843-ac2721c13b67/)
    
    // Check if store information is displayed
    const storeContent = page.locator('main, [data-testid="store-detail"], [class*="StoreDetail"]')
    await expect(storeContent).toBeVisible()
    
    // Check if map container exists (if map is supposed to be on this page)
    const mapContainer = page.locator('[class*="map"], [data-testid="map"], .leaflet-container')
    if (await mapContainer.count() > 0) {
      await expect(mapContainer).toBeVisible()
    }
  })

  test('should handle map component without React Leaflet errors', async ({ authenticatedPage: page }) => {
    // Navigate to the specific store
    await page.goto('/stores/ffd965be-f941-425d-9843-ac2721c13b67')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Listen for any JavaScript errors
    const jsErrors: string[] = []
    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })
    
    // Wait for any delayed errors
    await page.waitForTimeout(2000)
    
    // Check for specific React Leaflet errors
    const reactLeafletErrors = jsErrors.filter(error => 
      error.includes('render2 is not a function') ||
      error.includes('MapContainer') ||
      error.includes('react-leaflet')
    )
    
    // Should have no React Leaflet errors
    expect(reactLeafletErrors).toHaveLength(0)
    
    // Verify page is functional
    const pageTitle = page.locator('h1, [data-testid="store-name"], [class*="store-name"]')
    await expect(pageTitle).toBeVisible()
  })

  test('should load store page with proper error handling', async ({ authenticatedPage: page }) => {
    // Navigate to the specific store
    await page.goto('/stores/ffd965be-f941-425d-9843-ac2721c13b67')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    // Check that the page doesn't show error boundaries
    const errorBoundary = page.locator('[data-testid="error-boundary"], [class*="error"]')
    const errorCount = await errorBoundary.count()
    
    // Should not have error boundaries visible
    expect(errorCount).toBe(0)
    
    // Check for any "Map temporarily unavailable" messages
    const mapUnavailable = page.getByText('Map temporarily unavailable')
    await expect(mapUnavailable).not.toBeVisible()
    
    // Verify the page is interactive
    const interactiveElements = page.locator('button, input, [role="button"]')
    await expect(interactiveElements.first()).toBeVisible()
  })
})
