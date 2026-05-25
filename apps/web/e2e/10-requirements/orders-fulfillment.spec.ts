import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'
import { loginAsVendor } from '../fixtures/auth'

/**
 * Category: Orders & Fulfillment
 * Requirements: FR-046, FR-047, FR-048, FR-049, FR-050
 */
test.describe('Orders & Fulfillment', () => {

  test('FR-046: order tracking page renders order details from API', async ({ page }) => {
    const orderId = randomUUID()
    const storeId = randomUUID()

    await page.route(`**/orders/${orderId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: orderId,
          storeId,
          status: 'PLACED',
          deliveryType: 'PICKUP',
          paymentStatus: 'PAID',
          subtotal: '12.50',
          fees: '2.99',
          tax: '1.10',
          tip: '0.00',
          total: '16.59',
          orderItems: JSON.stringify([{ title: 'Test Burger', quantity: 1 }]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      })
    })

    await page.route(`**/stores/${storeId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: storeId, name: 'Test Kitchen' }),
      })
    })

    await page.goto(`/orders/${orderId}`)
    await expect(page.getByText(/paid|placed|pickup/i)).toBeVisible({ timeout: 10000 })
  })

  test('FR-047: vendor orders page loads for authenticated vendor', async ({ page }) => {
    await loginAsVendor(page)
    await page.goto('/vendor/orders')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test.skip('FR-048: order status transitions (placed → accepted → in-prep → ready → delivered) — requires live vendor + driver flow', async ({ page }) => {})

  test.skip('FR-049: item-level substitutions/removals with recalculated totals — requires accepted order with modify flow', async ({ page }) => {})

  test.skip('FR-050: kitchen/packing slip view — requires vendor dashboard with active order', async ({ page }) => {})
})
