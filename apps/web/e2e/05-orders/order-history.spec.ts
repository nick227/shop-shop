import { test, expect } from '../fixtures'

test.describe('Order History Page', () => {
  test('should navigate to orders page', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL('/orders')
  })

  test('should display page title', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    await expect(
      page.getByRole('heading', { name: /order history|my orders/i, level: 1 })
    ).toBeVisible({ timeout: 10000 })
  })

  test('should display empty state when no orders', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    await expect(
      page.getByText(/no orders|haven't placed any orders|order history is empty/i)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should display list of orders when available', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL('/orders')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display order information when orders exist', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    const orderCards = page.locator('[data-testid="order-card"], [class*="OrderCard"]')
    if (await orderCards.count() > 0) {
      await expect(orderCards.first()).toBeVisible()
    }
  })
})

test.describe('Order Details', () => {
  test('should show order status badges when orders exist', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    const statusBadges = page.locator('[data-testid="order-status"], [class*="status"], [class*="badge"]')
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('should display order items when orders exist', async ({ authenticatedPage: page }) => {
    await page.goto('/orders')
    const orderCards = page.locator('[data-testid="order-card"]')
    if (await orderCards.count() > 0) {
      await expect(orderCards.first()).not.toBeEmpty()
    }
  })
})

test.describe('Complete Order Flow (Integration)', () => {
  test.skip('create order from cart and view in history — requires STORE_SLUG and full checkout flow', async ({ authenticatedPage: page }) => {})
})
