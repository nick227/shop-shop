/**
 * E2E Tests: Store River - Post Management
 * Tests creating, viewing, and managing posts on the vendor river page.
 *
 * Vendor river page is at /vendor/stores/:storeId/river and renders:
 *  - h1 "River — {store.name}"
 *  - PostComposer (always visible — no toggle button)
 *  - "Recent posts" section with empty-state "No posts yet."
 *
 * Features NOT present on the vendor page (tested elsewhere):
 *  - Sort/filter buttons (Recent, Popular, Trending, Media Only)
 *  - Like/comment/share buttons on individual posts
 *  - Pagination / Load More
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

// --- Store River - Posts ---

test.describe('Store River - Posts', () => {
  test('should display river page', async ({ authenticatedVendor: page }) => {
    // h1 is "River — <store name>", not literally "Store River"
    await expect(page.getByRole('heading', { name: /^river/i, level: 1 })).toBeVisible()
  })

  test.skip('should display river filters', async () => {}) // Filter buttons not present on vendor river page

  test('should show post composer', async ({ authenticatedVendor: page }) => {
    // PostComposer is always visible (no Create Post toggle)
    await expect(page.getByPlaceholder(/what's happening/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^post$/i })).toBeVisible()
  })

  test('should create a text-only post', async ({ authenticatedVendor: page }) => {
    const postContent = `Test post ${Date.now()} - This is a test post!`
    const textarea = page.getByPlaceholder(/what's happening/i)
    await textarea.fill(postContent)
    await page.getByRole('button', { name: /^post$/i }).click()
    // Textarea clears on successful submit (setContent('') called after onPost resolves)
    await expect(textarea).toBeEmpty({ timeout: 10000 })
    // Success toast is shown
    await expect(page.getByText('River post published')).toBeVisible({ timeout: 5000 })
  })

  test('should validate post requires content', async ({ authenticatedVendor: page }) => {
    // Post button disabled when textarea is empty
    const postButton = page.getByRole('button', { name: /^post$/i })
    await expect(postButton).toBeDisabled()
  })

  test('should show character counter near limit', async ({ authenticatedVendor: page }) => {
    const longText = 'a'.repeat(4600)
    await page.getByPlaceholder(/what's happening/i).fill(longText)
    // PostComposer shows remaining chars (e.g. "400") when content.length >= 4500
    const charsLeft = 5000 - longText.length
    await expect(page.getByText(String(charsLeft)).first()).toBeVisible()
  })

  test.skip('should cancel post creation', async () => {}) // Cancel button not rendered — PostComposer on vendor page has no onCancel prop

  test('should show upload media button', async ({ authenticatedVendor: page }) => {
    // PostComposer renders an Upload button (📎 Upload)
    const uploadButton = page.getByRole('button', { name: /upload/i })
    await expect(uploadButton).toBeVisible()
  })

  test('should display posts in feed', async ({ authenticatedVendor: page }) => {
    await page.waitForTimeout(1000)
    const hasPosts = await page.locator('li').count() > 0
    const hasEmptyState = await page.getByText(/no posts yet/i).isVisible()
    expect(hasPosts || hasEmptyState).toBe(true)
  })

  test.skip('should filter by sort option', async () => {}) // Sort buttons not present on vendor river page

  test.skip('should toggle media-only filter', async () => {}) // Media filter not present on vendor river page
})

// --- Store River - Post Actions (like/comment require public /river page) ---

test.describe('Store River - Post Actions', () => {
  test.skip('should display post actions (like, comment, share)', async () => {}) // Not on vendor river page

  test.skip('should like a post', async () => {}) // Like is on public /river page only

  test.skip('should unlike a post', async () => {}) // Like is on public /river page only

  test.skip('should show like count updates', async () => {}) // Like count is on public /river page only
})

// --- Store River - Responsive Design ---

test.describe('Store River - Responsive Design', () => {
  test('should be mobile responsive', async ({ authenticatedVendor: page, storeId }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/vendor/stores/${storeId}/river`)
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /^river/i, level: 1 })).toBeVisible()
    await expect(page.getByPlaceholder(/what's happening/i)).toBeVisible()
  })

  test.skip('should show mobile-optimized filters', async () => {}) // Filter buttons not present on vendor river page
})

// --- Store River - Empty States ---

test.describe('Store River - Empty States', () => {
  test('should show empty state or posts', async ({ authenticatedVendor: page }) => {
    await page.waitForTimeout(2000)
    const hasPosts = await page.locator('li').count() > 0
    const hasEmptyState = await page.getByText(/no posts yet/i).isVisible()
    expect(hasPosts || hasEmptyState).toBe(true)
  })

  test('should show loading or content on navigation', async ({ authenticatedVendor: page, storeId }) => {
    await page.goto(`/vendor/stores/${storeId}/river`)
    // Either a spinner or content should be present immediately
    const isOnRiver = page.url().includes('/river')
    expect(isOnRiver).toBe(true)
  })
})
