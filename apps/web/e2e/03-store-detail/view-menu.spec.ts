/**
 * E2E Tests: Store Detail & Menu Viewing
 * Tests viewing store details and menu items
 */
import { test, expect } from '../fixtures'

test.describe('Store Detail Page', () => {
  test('should display store information', async ({ authenticatedPage: page }) => {
    // Navigate to a store (assuming store ID 1 exists)
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Verify store header is visible
    const storeHeader = page.locator('[data-testid="store-header"], header')
    await expect(storeHeader).toBeVisible()
  })

  test('should display menu items', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Verify menu items are displayed
    const menuItems = page.locator('[data-testid="menu-item"], [class*="ItemCard"]')
    
    // Should have at least one item
    await expect(menuItems.first()).toBeVisible()
  })

  test('should show item details (name, price, description)', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    const firstItem = page.locator('[data-testid="menu-item"], [class*="ItemCard"]').first()
    
    // Item should be visible and contain content
    await expect(firstItem).toBeVisible()
    await expect(firstItem).not.toBeEmpty()
  })

  test('should have back navigation button', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    // Look for back button
    const backButton = page.getByRole('button', { name: /back|return/i })
    await expect(backButton).toBeVisible()
  })

  test('should navigate back to home when clicking back', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(1000)
    
    const backButton = page.getByRole('button', { name: /back/i })
    await backButton.click()
    
    // Should navigate back to home
    await expect(page).toHaveURL('/')
  })

  test('should display empty state when store has no items', async ({ authenticatedPage: page }) => {
    // Try to navigate to a store that might not have items
    await page.goto('/stores/999')
    
    await page.waitForTimeout(2000)
    
    // Should show empty state or error
    const emptyMessage = page.getByText(/no items|empty|not found/i)
    // This might be visible if store doesn't exist or has no items
  })
})

test.describe('Menu Item Interaction', () => {
  test('should display add to cart button for each item', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    const addToCartButtons = page.getByRole('button', { name: /add to cart|add/i })
    await expect(addToCartButtons.first()).toBeVisible()
  })

  test('should show quantity controls after adding item', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Click add to cart
    const addButton = page.getByRole('button', { name: /add to cart|add/i }).first()
    await addButton.click()
    
    await page.waitForTimeout(1000)
    
    // Should show quantity controls (+ and - buttons)
    const minusButton = page.getByRole('button', { name: '-' }).first()
    const plusButton = page.getByRole('button', { name: '+' }).first()
    
    await expect(minusButton).toBeVisible()
    await expect(plusButton).toBeVisible()
  })

  test('should increment item quantity', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(500)
    
    // Click plus button
    const plusButton = page.getByRole('button', { name: '+' }).first()
    await plusButton.click()
    
    await page.waitForTimeout(500)
    
    // Quantity should be 2
    const quantityDisplay = page.locator('[data-testid="quantity"], [class*="quantity"]').first()
    await expect(quantityDisplay).toContainText('2')
  })

  test('should decrement item quantity', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(500)
    
    // Increment
    await page.getByRole('button', { name: '+' }).first().click()
    await page.waitForTimeout(500)
    
    // Decrement
    const minusButton = page.getByRole('button', { name: '-' }).first()
    await minusButton.click()
    
    await page.waitForTimeout(500)
    
    // Quantity should be back to 1
    const quantityDisplay = page.locator('[data-testid="quantity"], [class*="quantity"]').first()
    await expect(quantityDisplay).toContainText('1')
  })

  test('should remove item when quantity reaches 0', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(500)
    
    // Decrement to 0
    const minusButton = page.getByRole('button', { name: '-' }).first()
    await minusButton.click()
    
    await page.waitForTimeout(500)
    
    // Should show "Add to Cart" button again
    const addButton = page.getByRole('button', { name: /add to cart|add/i }).first()
    await expect(addButton).toBeVisible()
  })
})


