import { test, expect } from '../fixtures'

/**
 * Shopping cart tests that interact with a live store menu.
 *
 * These tests require a real store to exist in the database and need the slug
 * of that store. Set STORE_SLUG in the environment to enable them.
 *
 * Example: STORE_SLUG=my-kitchen pnpm test:e2e --grep "Shopping Cart"
 */
const STORE_SLUG = process.env.STORE_SLUG ?? ''

test.describe('Shopping Cart', () => {
  test.skip(!STORE_SLUG, 'Set STORE_SLUG env var to a real store slug to enable these tests')

  test('should open cart drawer when clicking cart button', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart|view cart/i }).click()
    const cartDrawer = page.locator('[role="dialog"], [data-testid="cart-drawer"]')
    await expect(cartDrawer).toBeVisible({ timeout: 5000 })
  })

  test('should display cart items in drawer', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart/i }).click()
    const cartItems = page.locator('[data-testid="cart-item"], [class*="CartItem"]')
    await expect(cartItems.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display cart totals (subtotal, tax, total)', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart/i }).click()
    await expect(page.getByText(/subtotal/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/tax/i)).toBeVisible()
    await expect(page.getByText(/total/i)).toBeVisible()
  })

  test('should update cart total when quantity changes', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart/i }).click()
    const totalElement = page.locator('[data-testid="cart-total"]').first()
    const initialTotal = await totalElement.textContent()
    await page.getByRole('button', { name: '+' }).first().click()
    await expect(totalElement).not.toHaveText(initialTotal ?? '', { timeout: 5000 })
  })

  test('should close cart drawer when clicking close button', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart/i }).click()
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
  })

  test('should show cart item count badge', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toContainText('1', { timeout: 5000 })
  })

  test('should update cart badge when adding more items', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: '+' }).first().click()
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toContainText('2', { timeout: 5000 })
  })

  test('should persist cart items across page navigation', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.goto('/river')
    await page.goto(`/kitchen/${STORE_SLUG}`)
    const cartBadge = page.locator('[data-testid="cart-badge"], [class*="badge"]')
    await expect(cartBadge).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Cart Checkout', () => {
  test.skip(!STORE_SLUG, 'Set STORE_SLUG env var to a real store slug to enable these tests')

  test('should display checkout button in cart', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: /cart/i }).click()
    await expect(page.getByRole('button', { name: /checkout|place order/i })).toBeVisible({ timeout: 5000 })
  })

  test('should disable checkout button when cart is empty', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    const cartButton = page.getByRole('button', { name: /cart/i })
    if (await cartButton.isVisible()) {
      await cartButton.click()
      const checkoutButton = page.getByRole('button', { name: /checkout|place order/i })
      await expect(checkoutButton).toBeDisabled({ timeout: 5000 })
    }
  })
})
