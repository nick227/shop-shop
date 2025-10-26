/**
 * Console Error Test - Check for Map Errors
 * Tests that the store page doesn't have map-related JavaScript errors
 */
import { test, expect } from '@playwright/test'

test.describe('Store Detail Console Errors', () => {
  test('should not have map-related console errors on store page', async ({ page }) => {
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
    
    // Wait for page to load and any redirects
    await page.waitForTimeout(3000)
    
    // Check for map-related errors specifically
    const mapErrors = consoleErrors.filter(error => 
      error.includes('render2') || 
      error.includes('MapContainer') || 
      error.includes('react-leaflet') ||
      error.includes('leaflet') ||
      error.includes('TypeError') ||
      error.includes('is not a function')
    )
    
    // Check for JavaScript errors related to map
    const mapJsErrors = jsErrors.filter(error => 
      error.includes('render2 is not a function') ||
      error.includes('MapContainer') ||
      error.includes('react-leaflet') ||
      error.includes('leaflet')
    )
    
    // Log all errors for debugging
    console.log('All console errors:', consoleErrors)
    console.log('All JavaScript errors:', jsErrors)
    console.log('Map-related console errors:', mapErrors)
    console.log('Map-related JavaScript errors:', mapJsErrors)
    
    // The key test: should have no map-related errors
    expect(mapErrors).toHaveLength(0)
    expect(mapJsErrors).toHaveLength(0)
    
    // Additional check: should not have the specific "render2 is not a function" error
    const render2Errors = [...consoleErrors, ...jsErrors].filter(error => 
      error.includes('render2 is not a function')
    )
    expect(render2Errors).toHaveLength(0)
  })
})
