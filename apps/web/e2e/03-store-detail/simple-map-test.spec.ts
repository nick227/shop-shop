/**
 * Simple Store Detail Map Test
 * Tests the specific store page without authentication
 */
import { test, expect } from '@playwright/test'

test.describe('Store Detail Map - Simple Test', () => {
  test('should load store ffd965be-f941-425d-9843-ac2721c13b67 without map errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Listen for JavaScript errors
    const jsErrors: string[] = []
    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })
    
    // Navigate to the specific store
    await page.goto('/stores/ffd965be-f941-425d-9843-ac2721c13b67')
    
    // Wait for page to load
    await page.waitForTimeout(5000)
    
    // Check for map-related errors
    const mapErrors = consoleErrors.filter(error => 
      error.includes('render2') || 
      error.includes('MapContainer') || 
      error.includes('react-leaflet') ||
      error.includes('leaflet') ||
      error.includes('TypeError')
    )
    
    // Check for JavaScript errors related to map
    const mapJsErrors = jsErrors.filter(error => 
      error.includes('render2 is not a function') ||
      error.includes('MapContainer') ||
      error.includes('react-leaflet')
    )
    
    // Log all errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors)
    }
    if (jsErrors.length > 0) {
      console.log('JavaScript errors:', jsErrors)
    }
    
    // Should have no map-related errors
    expect(mapErrors).toHaveLength(0)
    expect(mapJsErrors).toHaveLength(0)
    
    // Verify the page loaded successfully
    await expect(page).toHaveURL(/\/stores\/ffd965be-f941-425d-9843-ac2721c13b67/)
    
    // Check if any content is displayed
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check for any error boundaries or error messages
    const errorMessages = page.locator('[data-testid="error-boundary"], [class*="error"], [class*="Error"]')
    const errorCount = await errorMessages.count()
    
    // Should not have error boundaries visible
    expect(errorCount).toBe(0)
    
    // Check for "Map temporarily unavailable" messages
    const mapUnavailable = page.getByText('Map temporarily unavailable')
    const mapUnavailableCount = await mapUnavailable.count()
    expect(mapUnavailableCount).toBe(0)
  })
})
