import { randomUUID } from 'crypto'
import { test, expect } from '@playwright/test'

/**
 * Category: Cart & Checkout
 * Requirements: FR-036..FR-040
 *
 * Notes:
 * - Web E2E runs a Vite dev server only. The cart is local (zustand persist), but checkout/order APIs call the backend.
 * - These tests mock checkout + order endpoints so the UI flow is still validated end-to-end.
 */
test.describe('Cart & Checkout', () => {
  test('FR-040: guest can place an order via checkout flow (mocked backend)', async ({ page }) => {
    test.setTimeout(60_000)
    const storeId = randomUUID()
    const itemId = randomUUID()
    const orderId = randomUUID()

    await page.addInitScript(({ storeId, itemId }) => {
      const now = new Date().toISOString()
      const cart = {
        id: `local-cart-${storeId}`,
        storeId,
        status: 'ACTIVE',
        items: [
          {
            id: `local-cart-item-${itemId}`,
            cartId: `local-cart-${storeId}`,
            itemId,
            quantity: 1,
            unitPrice: 12.5,
            titleSnapshot: 'Test Item',
          },
        ],
        itemCount: 1,
        subtotal: 12.5,
        tax: 1.25,
        deliveryFee: 5.99,
        fees: 5.99,
        total: 19.74,
        createdAt: now,
        updatedAt: now,
      }

      localStorage.setItem(
        'cart-storage',
        JSON.stringify({ state: { cart }, version: 0 }),
      )
    }, { storeId, itemId })

    // Mock checkout endpoints
    await page.route('**://localhost:3005/api/v1/checkout/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: `sess_${randomUUID()}`,
          total: 19.74,
          estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        }),
      })
    })

    await page.route('**://localhost:3005/api/v1/checkout/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          order: {
            id: orderId,
            status: 'PENDING_PAYMENT',
            total: 19.74,
            createdAt: new Date().toISOString(),
          },
          paymentId: `pi_mock_${randomUUID()}`,
        }),
      })
    })

    // Mock order + store reads used by OrderTrackingPage
    await page.route('**://localhost:3005/orders/**', async (route) => {
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
          fees: '5.99',
          tax: '1.25',
          tip: '0.00',
          total: '19.74',
          orderItems: JSON.stringify([{ title: 'Test Item', quantity: 1 }]),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      })
    })

    await page.route('**://localhost:3005/stores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: storeId, name: 'Mock Kitchen' }),
      })
    })

    // Avoid websocket noise if any realtime hook tries to connect
    await page.route('**://localhost:3005/realtime**', async (route) => route.abort())

    await page.goto('/checkout')
    // Wait for hydration/loading to settle before asserting actions exist.
    const continueBtn = page.getByRole('button', { name: /continue to payment/i })
    await continueBtn.waitFor({ timeout: 20000 })

    await continueBtn.click()
    await expect(page.getByRole('heading', { name: /payment method/i })).toBeVisible()

    const terms = page.getByRole('checkbox', { name: /i agree/i })
    await terms.check()
    await expect(terms).toBeChecked()

    // Button text includes emoji + amount; role-name matching can be flaky across engines.
    const payBtn = page.locator('button', { hasText: /pay/i }).first()
    await expect(payBtn).toBeEnabled()
    await payBtn.click()
    await page.getByRole('button', { name: /confirm payment/i }).click()

    await page.waitForURL(/\/orders\//)
    await expect(page.getByRole('button', { name: /back to orders/i })).toBeVisible()
    await expect(page.getByText(/paid|pending/i)).toBeVisible()
  })

  test.skip('FR-036: persistent cart per customer/device', async () => {})
  test.skip('FR-037: validate cart contents (availability/modifiers)', async () => {})
  test.skip('FR-038: delivery estimates and fee computation', async () => {})
  test.skip('FR-039: fulfillment method and contact info collection', async () => {})
})
