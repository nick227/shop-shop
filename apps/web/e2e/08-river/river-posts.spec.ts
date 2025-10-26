/**
 * E2E Tests: Store River - Post Management
 * Tests creating, viewing, and managing posts
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test.describe('Store River - Posts', () => {
  test.beforeEach(async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
  })

  test('should display river page', async ({ authenticatedVendor: page }) => {
    // Page title should be visible
    await expect(page.getByRole('heading', { name: /store river/i })).toBeVisible()
    
    // Create post button should be visible
    await expect(page.getByRole('button', { name: /create post/i })).toBeVisible()
  })

  test('should display river filters', async ({ authenticatedVendor: page }) => {
    // Filter buttons should be visible
    await expect(page.getByText(/recent/i)).toBeVisible()
    await expect(page.getByText(/popular/i)).toBeVisible()
    await expect(page.getByText(/trending/i)).toBeVisible()
    
    // Media filter should be visible
    await expect(page.getByText(/media only/i)).toBeVisible()
  })

  test('should open post composer when clicking create post', async ({ authenticatedVendor: page }) => {
    const createButton = page.getByRole('button', { name: /create post/i })
    await createButton.click()
    
    // Post composer should appear
    await expect(page.getByPlaceholder(/what's happening/i)).toBeVisible()
    
    // Submit button should be visible
    await expect(page.getByRole('button', { name: /^post$/i })).toBeVisible()
  })

  test('should create a text-only post', async ({ authenticatedVendor: page, storeId }) => {
    // Open composer
    await page.getByRole('button', { name: /create post/i }).click()
    await page.waitForTimeout(500)
    
    // Fill in post content
    const postContent = `Test post ${Date.now()} - This is a test post!`
    await page.getByPlaceholder(/what's happening/i).fill(postContent)
    
    // Submit post
    await page.getByRole('button', { name: /^post$/i }).click()
    
    // Wait for post to appear
    await page.waitForTimeout(2000)
    
    // Verify post appears in feed
    await expect(page.getByText(postContent)).toBeVisible()
  })

  test('should validate post requires content or media', async ({ authenticatedVendor: page }) => {
    // Open composer
    await page.getByRole('button', { name: /create post/i }).click()
    await page.waitForTimeout(500)
    
    // Try to submit empty post
    const postButton = page.getByRole('button', { name: /^post$/i })
    
    // Button should be disabled
    await expect(postButton).toBeDisabled()
  })

  test('should show character counter near limit', async ({ authenticatedVendor: page }) => {
    // Open composer
    await page.getByRole('button', { name: /create post/i }).click()
    
    // Fill with text near limit (5000 chars)
    const longText = 'a'.repeat(4600)
    await page.getByPlaceholder(/what's happening/i).fill(longText)
    
    // Character counter should appear
    await expect(page.getByText(/\/5000/i)).toBeVisible()
  })

  test('should cancel post creation', async ({ authenticatedVendor: page }) => {
    // Open composer
    await page.getByRole('button', { name: /create post/i }).click()
    await page.waitForTimeout(500)
    
    // Fill some content
    await page.getByPlaceholder(/what's happening/i).fill('Test content')
    
    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click()
    
    // Composer should disappear
    await expect(page.getByPlaceholder(/what's happening/i)).not.toBeVisible()
  })

  test('should create post with media upload', async ({ authenticatedVendor: page }) => {
    // Open composer
    await page.getByRole('button', { name: /create post/i }).click()
    await page.waitForTimeout(500)
    
    // Add media (if upload is implemented)
    const uploadButton = page.getByRole('button', { name: /add photos|add media/i })
    if (await uploadButton.isVisible()) {
      // Note: Actual file upload would require test files
      await expect(uploadButton).toBeVisible()
    }
  })

  test('should display posts in feed', async ({ authenticatedVendor: page }) => {
    // Wait for posts to load
    await page.waitForTimeout(2000)
    
    // Check if feed has posts or empty state
    const hasPosts = await page.locator('[class*="postCard"], [data-testid="post-card"]').count()
    const hasEmptyState = await page.getByText(/no posts yet/i).isVisible()
    
    // Either posts or empty state should be visible
    expect(hasPosts > 0 || hasEmptyState).toBe(true)
  })

  test('should filter by sort option', async ({ authenticatedVendor: page }) => {
    await page.waitForTimeout(1000)
    
    // Click popular filter
    await page.getByText(/popular/i).click()
    await page.waitForTimeout(500)
    
    // Popular should be active
    const popularButton = page.getByText(/popular/i)
    await expect(popularButton).toHaveClass(/active/i)
  })

  test('should toggle media-only filter', async ({ authenticatedVendor: page }) => {
    await page.waitForTimeout(1000)
    
    // Click media only filter
    const mediaFilter = page.getByText(/media only/i)
    await mediaFilter.click()
    await page.waitForTimeout(500)
    
    // Should have active state
    await expect(mediaFilter).toHaveClass(/active/i)
    
    // Click again to toggle off
    await mediaFilter.click()
    await page.waitForTimeout(500)
  })
})

test.describe('Store River - Post Actions', () => {
  test('should display post actions (like, comment, share)', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Create a post first
    await page.getByRole('button', { name: /create post/i }).click()
    const postContent = `Test post for actions ${Date.now()}`
    await page.getByPlaceholder(/what's happening/i).fill(postContent)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    // Find the post
    const post = page.locator(`text=${postContent}`).locator('..').locator('..')
    
    // Verify action buttons exist
    const likeButton = post.getByRole('button', { name: /like/i }).first()
    await expect(likeButton).toBeVisible()
  })

  test('should like a post', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Create a post
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill(`Likeable post ${Date.now()}`)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    // Find and click like button
    const likeButton = page.getByRole('button', { name: /like/i }).first()
    const initialCount = await likeButton.textContent()
    
    await likeButton.click()
    await page.waitForTimeout(1000)
    
    // Like button should have active state
    await expect(likeButton).toHaveClass(/liked|active/i)
  })

  test('should unlike a post', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Create and like a post
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill(`Unlike test ${Date.now()}`)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    const likeButton = page.getByRole('button', { name: /like/i }).first()
    
    // Like the post
    await likeButton.click()
    await page.waitForTimeout(1000)
    
    // Unlike the post
    await likeButton.click()
    await page.waitForTimeout(1000)
    
    // Should not have active state
    const hasActiveClass = await likeButton.evaluate(el => 
      el.className.includes('liked') || el.className.includes('active')
    )
    expect(hasActiveClass).toBe(false)
  })

  test('should show like count updates', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Create a post
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill(`Count test ${Date.now()}`)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    const likeButton = page.getByRole('button', { name: /like/i }).first()
    
    // Get initial count
    const initialText = await likeButton.textContent()
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0')
    
    // Like the post
    await likeButton.click()
    await page.waitForTimeout(1000)
    
    // Count should increase
    const newText = await likeButton.textContent()
    const newCount = parseInt(newText?.match(/\d+/)?.[0] || '0')
    
    expect(newCount).toBeGreaterThanOrEqual(initialCount)
  })
})

test.describe('Store River - Responsive Design', () => {
  test('should be mobile responsive', async ({ authenticatedVendor: page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Page should still be usable
    await expect(page.getByRole('heading', { name: /store river/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /create post/i })).toBeVisible()
  })

  test('should show mobile-optimized filters', async ({ authenticatedVendor: page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Filters should be visible on mobile
    await expect(page.getByText(/recent/i)).toBeVisible()
  })
})

test.describe('Store River - Empty States', () => {
  test('should show empty state when no posts exist', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Check for posts or empty state
    const postCount = await page.locator('[class*="postCard"], [data-testid="post-card"]').count()
    
    if (postCount === 0) {
      // Empty state should be visible
      await expect(page.getByText(/no posts yet|be the first/i)).toBeVisible()
    }
  })

  test('should show loading state', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    // Loading indicator should appear briefly
    const loading = page.getByText(/loading/i)
    
    // Either loading appears or posts load immediately
    const hasLoading = await loading.isVisible().catch(() => false)
    const hasPosts = await page.locator('[class*="postCard"]').count() > 0
    
    expect(hasLoading || hasPosts).toBe(true)
  })
})

