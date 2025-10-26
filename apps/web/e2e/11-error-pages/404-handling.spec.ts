/**
 * E2E Test - 404 Not Found Page Handling
 */
import { test, expect } from '@playwright/test'

test.describe('404 Not Found Page', () => {
  test('should display 404 page for invalid routes', async ({ page }) => {
    // Visit an invalid route
    await page.goto('/this-page-does-not-exist')
    
    // Should see 404 heading
    await expect(page.locator('h1')).toContainText('404')
    await expect(page.locator('h2')).toContainText('Page Not Found')
    
    // Should show the invalid path
    await expect(page.locator('code')).toContainText('/this-page-does-not-exist')
    
    // Should have navigation options
    await expect(page.getByRole('link', { name: /go to home/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible()
  })

  test('should display 404 page for invalid nested routes', async ({ page }) => {
    // Visit an invalid nested route
    await page.goto('/stores/999999/invalid-page')
    
    // Should see 404 page
    await expect(page.locator('h1')).toContainText('404')
    await expect(page.locator('h2')).toContainText('Page Not Found')
  })

  test('should navigate back to home from 404 page', async ({ page }) => {
    // Visit an invalid route
    await page.goto('/invalid-route')
    
    // Should see 404 page
    await expect(page.locator('h1')).toContainText('404')
    
    // Click "Go to Home"
    await page.getByRole('link', { name: /go to home/i }).click()
    
    // Should be redirected to home or login
    await page.waitForURL(/\/(login)?/)
    expect(page.url()).toMatch(/\/(login)?/)
  })

  test('should show helpful navigation links on 404 page', async ({ page }) => {
    // Visit an invalid route
    await page.goto('/this-does-not-exist')
    
    // Should see helpful links
    await expect(page.getByRole('link', { name: /browse stores/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view cart/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /order history/i })).toBeVisible()
  })

  test('should preserve URL in browser on 404', async ({ page }) => {
    const invalidUrl = '/i-do-not-exist'
    await page.goto(invalidUrl)
    
    // URL should still show the invalid path (not redirected)
    expect(page.url()).toContain(invalidUrl)
    
    // But 404 page should be displayed
    await expect(page.locator('h1')).toContainText('404')
  })
})

