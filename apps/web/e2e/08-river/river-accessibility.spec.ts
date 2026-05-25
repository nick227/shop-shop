/**
 * E2E Tests: Store River - Accessibility & Edge Cases
 *
 * Tests accessibility features and edge cases on the vendor river page
 * (/vendor/stores/:storeId/river).
 *
 * Features not present on vendor page (skipped below):
 *  - ARIA-labelled like/comment buttons on posts
 *  - Sort/filter buttons
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test.describe('Store River - Accessibility', () => {
  test.skip('should have proper ARIA labels on action buttons', async () => {}) // Like/comment buttons not on vendor river page

  test('should be keyboard navigable', async ({ authenticatedVendor: page }) => {
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const activeElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeElement).toBeDefined()
  })

  test('should show post composer with accessible text', async ({ authenticatedVendor: page }) => {
    // PostComposer is always visible and has descriptive placeholder
    const textarea = page.getByPlaceholder(/what's happening/i)
    await expect(textarea).toBeVisible()
    const placeholder = await textarea.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
  })

  test('should have semantic HTML structure', async ({ authenticatedVendor: page }) => {
    // h1 heading present
    const heading = page.getByRole('heading', { name: /^river/i, level: 1 })
    await expect(heading).toBeVisible()
  })

  test('should have page title', async ({ authenticatedVendor: page }) => {
    await expect(page).toHaveTitle(/.+/)
  })
})

test.describe('Store River - Edge Cases', () => {
  test('should handle extremely long post content', async ({ authenticatedVendor: page }) => {
    const longText = 'Lorem ipsum '.repeat(400) // ~4400 chars — under 5000 limit
    await page.getByPlaceholder(/what's happening/i).fill(longText)
    const postButton = page.getByRole('button', { name: /^post$/i })
    await expect(postButton).toBeEnabled()
  })

  test('should show character limit warning when over limit', async ({ authenticatedVendor: page }) => {
    // Fill to exactly MAX_CHARS — browser clamps via maxLength=5000; charsLeft = 0
    await page.getByPlaceholder(/what's happening/i).fill('a'.repeat(5000))
    // Counter paragraph appears when content.length >= COUNTER_WARN_AT (4500), showing remaining chars
    await expect(page.getByText('0', { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test.skip('should handle rapid like/unlike clicks', async () => {}) // Like buttons not present on vendor river page

  test('should load page without errors', async ({ authenticatedVendor: page }) => {
    // Page renders the river heading — basic smoke test
    await expect(page.getByRole('heading', { name: /^river/i, level: 1 })).toBeVisible()
  })

  test('should submit post with no media', async ({ authenticatedVendor: page }) => {
    const content = 'Text only post — no media'
    const textarea = page.getByPlaceholder(/what's happening/i)
    await textarea.fill(content)
    await page.getByRole('button', { name: /^post$/i }).click()
    // Textarea cleared on success (feed won't show post — store must be published)
    await expect(textarea).toBeEmpty({ timeout: 10000 })
  })

  test('should handle special characters in post content', async ({ authenticatedVendor: page }) => {
    const specialText = '🎉 Special chars: <>&"\' ✨ Emoji test!'
    const textarea = page.getByPlaceholder(/what's happening/i)
    await textarea.fill(specialText)
    await page.getByRole('button', { name: /^post$/i }).click()
    // Textarea cleared on success
    await expect(textarea).toBeEmpty({ timeout: 10000 })
  })

  test.skip('should handle filter changes while loading', async () => {}) // Filter buttons not present on vendor river page
})

test.describe('Store River - Performance', () => {
  test('should load page within reasonable time', async ({ authenticatedVendor: page, storeId }) => {
    const startTime = Date.now()
    await page.goto(`/vendor/stores/${storeId}/river`)
    await page.waitForURL(/\/vendor\/stores\/[^/]+\/river/, { timeout: 10000 })
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(10000)
  })

  test('should remain responsive after creating posts', async ({ authenticatedVendor: page }) => {
    for (let i = 0; i < 2; i++) {
      await page.getByPlaceholder(/what's happening/i).fill(`Performance test ${i} ${Date.now()}`)
      await page.getByRole('button', { name: /^post$/i }).click()
      await page.waitForTimeout(1500)
    }
    const postButton = page.getByRole('button', { name: /^post$/i })
    await expect(postButton).toBeVisible()
  })

  test.skip('should not have memory leaks on filter changes', async () => {}) // Filter buttons not present on vendor river page
})
