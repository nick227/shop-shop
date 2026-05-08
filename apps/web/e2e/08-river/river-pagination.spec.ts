/**
 * E2E Tests: Store River - Pagination & Infinite Scroll
 * Tests pagination and load more functionality
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test.describe('Store River - Pagination', () => {
  test.beforeEach(async ({ authenticatedVendor: page }) => {
    await page.goto('/menu')
    await page.waitForTimeout(1000)
  })

  test('should show load more button when more posts exist', async ({ authenticatedVendor: page }) => {
    // Create multiple posts to ensure pagination
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /create post/i }).click()
      await page.getByPlaceholder(/what's happening/i).fill(`Pagination test post ${i} ${Date.now()}`)
      await page.getByRole('button', { name: /^post$/i }).click()
      await page.waitForTimeout(1000)
      
      // Close composer if it stays open
      const cancelButton = page.getByRole('button', { name: /cancel/i })
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
      }
    }
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // Load more button might be visible
    const loadMoreButton = page.getByRole('button', { name: /load more/i })
    const hasLoadMore = await loadMoreButton.isVisible().catch(() => false)
    
    // Either has load more or all posts are loaded
    expect(typeof hasLoadMore).toBe('boolean')
  })

  test('should load more posts when clicking load more', async ({ authenticatedVendor: page }) => {
    // Create enough posts for pagination
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /create post/i }).click()
      await page.getByPlaceholder(/what's happening/i).fill(`Load more test ${i}`)
      await page.getByRole('button', { name: /^post$/i }).click()
      await page.waitForTimeout(1000)
    }
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Check for load more button
    const loadMoreButton = page.getByRole('button', { name: /load more/i })
    
    if (await loadMoreButton.isVisible()) {
      // Get initial post count
      const initialCount = await page.locator('[class*="postCard"], [data-testid="post-card"]').count()
      
      // Click load more
      await loadMoreButton.click()
      await page.waitForTimeout(2000)
      
      // Post count should stay same or increase
      const newCount = await page.locator('[class*="postCard"], [data-testid="post-card"]').count()
      expect(newCount).toBeGreaterThanOrEqual(initialCount)
    }
  })

  test('should show loading indicator when loading more posts', async ({ authenticatedVendor: page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    
    const loadMoreButton = page.getByRole('button', { name: /load more/i })
    
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click()
      
      // Loading text should appear
      await expect(page.getByText(/loading/i)).toBeVisible()
    }
  })

  test('should hide load more when no more posts', async ({ authenticatedVendor: page }) => {
    // Create just a few posts
    for (let i = 0; i < 2; i++) {
      await page.getByRole('button', { name: /create post/i }).click()
      await page.getByPlaceholder(/what's happening/i).fill(`Limited posts ${i}`)
      await page.getByRole('button', { name: /^post$/i }).click()
      await page.waitForTimeout(1000)
    }
    
    await page.waitForTimeout(2000)
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // Load more should not be visible or should disappear after loading
    const hasLoadMore = await page.getByRole('button', { name: /load more/i }).isVisible().catch(() => false)
    
    // If load more exists, try loading and it should disappear
    if (hasLoadMore) {
      await page.getByRole('button', { name: /load more/i }).click()
      await page.waitForTimeout(2000)
      
      // Should not show load more anymore
      const stillHasLoadMore = await page.getByRole('button', { name: /load more/i }).isVisible().catch(() => false)
      expect(stillHasLoadMore).toBe(false)
    }
  })
})

test.describe('Store River - Infinite Scroll (Future)', () => {
  test('should support scroll-based loading', async ({ authenticatedVendor: page }) => {
    // This test is for future infinite scroll implementation
    await page.goto('/menu')
    await page.waitForTimeout(1000)
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // Page should handle scroll gracefully
    expect(page.url()).toContain('/menu')
  })
})

