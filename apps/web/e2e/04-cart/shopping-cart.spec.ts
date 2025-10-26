/**
 * E2E Tests: Shopping Cart Functionality
 * Tests adding items, updating quantities, and viewing cart
 */
import { test, expect } from '../fixtures'

test.describe('Shopping Cart', () => {
  test('should open cart drawer when clicking cart button', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add an item to cart first
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Click cart button
    const cartButton = page.getByRole('button', { name: /cart|view cart/i })
    await cartButton.click()
    
    // Cart drawer should be visible
    const cartDrawer = page.locator('[role="dialog"], [data-testid="cart-drawer"]')
    await expect(cartDrawer).toBeVisible()
  })

  test('should display cart items in drawer', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item to cart
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Open cart
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Verify cart item is visible
    const cartItems = page.locator('[data-testid="cart-item"], [class*="CartItem"]')
    await expect(cartItems.first()).toBeVisible()
  })

  test('should display cart totals (subtotal, tax, total)', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Open cart
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Verify totals are displayed
    await expect(page.getByText(/subtotal/i)).toBeVisible()
    await expect(page.getByText(/tax/i)).toBeVisible()
    await expect(page.getByText(/total/i)).toBeVisible()
  })

  test('should update cart total when quantity changes', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Open cart
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Get initial total
    const totalElement = page.locator('[data-testid="cart-total"]').first()
    const initialTotal = await totalElement.textContent()
    
    // Increment quantity from menu
    await page.getByRole('button', { name: '+' }).first().click()
    await page.waitForTimeout(1000)
    
    // Total should have changed
    const newTotal = await totalElement.textContent()
    expect(newTotal).not.toBe(initialTotal)
  })

  test('should close cart drawer when clicking close button', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item and open cart
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Close cart
    const closeButton = page.getByRole('button', { name: /close/i })
    await closeButton.click()
    
    await page.waitForTimeout(500)
    
    // Cart drawer should not be visible
    const cartDrawer = page.locator('[role="dialog"]')
    await expect(cartDrawer).not.toBeVisible()
  })

  test('should close cart drawer when clicking backdrop', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item and open cart
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Click backdrop (overlay)
    const backdrop = page.locator('[class*="overlay"], [class*="backdrop"]').first()
    await backdrop.click({ position: { x: 10, y: 10 } })
    
    await page.waitForTimeout(500)
    
    // Cart should close
    const cartDrawer = page.locator('[role="dialog"]')
    await expect(cartDrawer).not.toBeVisible()
  })

  test('should show cart item count badge', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Verify cart badge shows count
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toContainText('1')
  })

  test('should update cart badge when adding more items', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add first item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(500)
    
    // Increment quantity
    await page.getByRole('button', { name: '+' }).first().click()
    await page.waitForTimeout(500)
    
    // Badge should show 2
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toContainText('2')
  })

  test('should persist cart items across page navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Navigate away
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Navigate back
    await page.goto('/stores/1')
    await page.waitForTimeout(1000)
    
    // Cart badge should still show item
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toBeVisible()
  })
})

test.describe('Cart Checkout', () => {
  test('should display checkout button in cart', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Add item and open cart
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /cart/i }).click()
    await page.waitForTimeout(500)
    
    // Verify checkout button
    const checkoutButton = page.getByRole('button', { name: /checkout|place order/i })
    await expect(checkoutButton).toBeVisible()
  })

  test('should disable checkout button when cart is empty', async ({ authenticatedPage: page }) => {
    await page.goto('/stores/1')
    
    await page.waitForTimeout(2000)
    
    // Open cart without adding items
    const cartButton = page.getByRole('button', { name: /cart/i })
    
    // If cart button exists and we can click it
    if (await cartButton.isVisible()) {
      await cartButton.click()
      await page.waitForTimeout(500)
      
      const checkoutButton = page.getByRole('button', { name: /checkout|place order/i })
      await expect(checkoutButton).toBeDisabled()
    }
  })
})


