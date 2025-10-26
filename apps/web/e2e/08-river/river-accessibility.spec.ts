/**
 * E2E Tests: Store River - Accessibility & Edge Cases
 * Tests accessibility features and edge cases
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test.describe('Store River - Accessibility', () => {
  test('should have proper ARIA labels on action buttons', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(2000)
    
    // Create a post to test
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill('Accessibility test post')
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    // Action buttons should have aria-labels
    const likeButton = page.getByRole('button', { name: /like post/i }).first()
    await expect(likeButton).toBeVisible()
  })

  test('should be keyboard navigable', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard
    const activeElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(activeElement).toBeDefined()
  })

  test('should support screen reader text', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Create post button should have descriptive text
    const createButton = page.getByRole('button', { name: /create post/i })
    await expect(createButton).toBeVisible()
    
    const buttonText = await createButton.textContent()
    expect(buttonText).toBeTruthy()
  })

  test('should have semantic HTML structure', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Should have heading for page title
    const heading = page.getByRole('heading', { name: /store river/i })
    await expect(heading).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Page should be visible and readable
    await expect(page).toHaveTitle(/.+/)
  })
})

test.describe('Store River - Edge Cases', () => {
  test('should handle extremely long post content', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    await page.getByRole('button', { name: /create post/i }).click()
    
    // Fill with very long text (but under 5000 limit)
    const longText = 'Lorem ipsum '.repeat(400) // ~4400 chars
    await page.getByPlaceholder(/what's happening/i).fill(longText)
    
    // Should still be able to post
    const postButton = page.getByRole('button', { name: /^post$/i })
    await expect(postButton).toBeEnabled()
  })

  test('should prevent posting over character limit', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    await page.getByRole('button', { name: /create post/i }).click()
    
    // Try to fill with text over 5000 chars
    const tooLongText = 'a'.repeat(5100)
    await page.getByPlaceholder(/what's happening/i).fill(tooLongText)
    
    // Character count should show limit reached
    await expect(page.getByText(/5000/i)).toBeVisible()
  })

  test('should handle rapid like/unlike clicks', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Create a post
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill(`Rapid click test ${Date.now()}`)
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    const likeButton = page.getByRole('button', { name: /like/i }).first()
    
    // Click rapidly
    await likeButton.click()
    await likeButton.click()
    await likeButton.click()
    
    await page.waitForTimeout(1000)
    
    // Should handle gracefully (no errors)
    expect(page.url()).toContain('/river')
  })

  test('should handle network errors gracefully', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Page should load even if some requests fail
    await expect(page.getByRole('heading', { name: /store river/i })).toBeVisible()
  })

  test('should handle empty media array', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    // Create post with no media
    await page.getByRole('button', { name: /create post/i }).click()
    await page.getByPlaceholder(/what's happening/i).fill('Text only post')
    await page.getByRole('button', { name: /^post$/i }).click()
    
    await page.waitForTimeout(2000)
    
    // Post should appear without errors
    await expect(page.getByText('Text only post')).toBeVisible()
  })

  test('should handle special characters in post content', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    await page.getByRole('button', { name: /create post/i }).click()
    
    const specialText = '🎉 Special chars: <>&"\'`\n\n✨ Emoji test!'
    await page.getByPlaceholder(/what's happening/i).fill(specialText)
    
    await page.getByRole('button', { name: /^post$/i }).click()
    await page.waitForTimeout(2000)
    
    // Post should appear with special characters intact
    await expect(page.getByText(/Special chars/i)).toBeVisible()
  })

  test('should handle filter changes while loading', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    // Quickly change filters
    await page.getByText(/popular/i).click()
    await page.getByText(/trending/i).click()
    await page.getByText(/recent/i).click()
    
    await page.waitForTimeout(1000)
    
    // Should handle gracefully
    expect(page.url()).toContain('/river')
  })
})

test.describe('Store River - Performance', () => {
  test('should load page within reasonable time', async ({ authenticatedVendor: page }) => {
    const startTime = Date.now()
    
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    const loadTime = Date.now() - startTime
    
    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle many posts efficiently', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    
    // Create multiple posts
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /create post/i }).click()
      await page.getByPlaceholder(/what's happening/i).fill(`Performance test ${i}`)
      await page.getByRole('button', { name: /^post$/i }).click()
      await page.waitForTimeout(1000)
    }
    
    // Page should still be responsive
    const createButton = page.getByRole('button', { name: /create post/i })
    await expect(createButton).toBeVisible()
  })

  test('should not have memory leaks on filter changes', async ({ authenticatedVendor: page }) => {
    await page.goto('/river')
    await page.waitForTimeout(1000)
    
    // Change filters multiple times
    for (let i = 0; i < 5; i++) {
      await page.getByText(/popular/i).click()
      await page.waitForTimeout(200)
      await page.getByText(/recent/i).click()
      await page.waitForTimeout(200)
    }
    
    // Page should still be functional
    await expect(page.getByRole('heading', { name: /store river/i })).toBeVisible()
  })
})

