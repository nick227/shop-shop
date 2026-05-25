import { test, expect } from '../fixtures'

/**
 * Store detail / menu tests.
 *
 * These tests require a real store to exist in the database. The store detail
 * route is /kitchen/:slug (public) or /menu/:storeId (authenticated, UUID).
 * Set STORE_SLUG in the environment or replace the placeholder below, then
 * remove the .skip to enable the suite.
 *
 * Example: STORE_SLUG=my-kitchen pnpm test:e2e --grep "Store Detail"
 */
const STORE_SLUG = process.env.STORE_SLUG ?? ''

test.describe('Store Detail Page', () => {
  test.skip(!STORE_SLUG, 'Set STORE_SLUG env var to a real store slug to enable these tests')

  test('should display store information', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await expect(page.locator('[data-testid="store-header"], header').first()).toBeVisible({ timeout: 10000 })
  })

  test('should display menu items', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    const menuItems = page.locator('[data-testid="menu-item"], [class*="ItemCard"]')
    await expect(menuItems.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show item details (name, price, description)', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    const firstItem = page.locator('[data-testid="menu-item"], [class*="ItemCard"]').first()
    await expect(firstItem).toBeVisible({ timeout: 10000 })
    await expect(firstItem).not.toBeEmpty()
  })

  test('should display add to cart button for each item', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    const addToCartButtons = page.getByRole('button', { name: /add to cart|add/i })
    await expect(addToCartButtons.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show quantity controls after adding item', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await expect(page.getByRole('button', { name: '-' }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: '+' }).first()).toBeVisible()
  })

  test('should increment item quantity', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: '+' }).first().click()
    const quantityDisplay = page.locator('[data-testid="quantity"], [class*="quantity"]').first()
    await expect(quantityDisplay).toContainText('2', { timeout: 5000 })
  })

  test('should decrement item quantity', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: '+' }).first().click()
    await page.getByRole('button', { name: '-' }).first().click()
    const quantityDisplay = page.locator('[data-testid="quantity"], [class*="quantity"]').first()
    await expect(quantityDisplay).toContainText('1', { timeout: 5000 })
  })

  test('should remove item when quantity reaches 0', async ({ authenticatedPage: page }) => {
    await page.goto(`/kitchen/${STORE_SLUG}`)
    await page.getByRole('button', { name: /add to cart|add/i }).first().click()
    await page.getByRole('button', { name: '-' }).first().click()
    await expect(page.getByRole('button', { name: /add to cart|add/i }).first()).toBeVisible({ timeout: 5000 })
  })
})
