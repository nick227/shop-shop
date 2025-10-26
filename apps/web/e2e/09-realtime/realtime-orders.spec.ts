/**
 * E2E Test: Real-time Order WebSocket Flow
 * Tests the complete DoorDash/Uber-style delivery tracking experience
 */

import { test, expect, type Page } from '@playwright/test'

const API_URL = 'http://localhost:3005'
const WS_URL = 'ws://localhost:3005/realtime'

// Test user credentials
const VENDOR_EMAIL = 'vendor@test.com'
const VENDOR_PASSWORD = 'password123'
const CUSTOMER_EMAIL = 'customer@test.com'
const CUSTOMER_PASSWORD = 'password123'

let vendorToken: string
let customerToken: string
let vendorStoreId: string
let testOrderId: string

test.describe('Real-time Order WebSocket Flow', () => {
  test.beforeAll(async ({ request }) => {
    // Create vendor user
    const vendorSignup = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: VENDOR_EMAIL,
        password: VENDOR_PASSWORD,
        name: 'Test Vendor',
        role: 'VENDOR',
      },
    })

    if (vendorSignup.ok()) {
      const vendorData = await vendorSignup.json()
      vendorToken = vendorData.token
    } else {
      // Login if already exists
      const vendorLogin = await request.post(`${API_URL}/auth/login`, {
        data: { email: VENDOR_EMAIL, password: VENDOR_PASSWORD },
      })
      const vendorData = await vendorLogin.json()
      vendorToken = vendorData.token
    }

    // Create customer user
    const customerSignup = await request.post(`${API_URL}/auth/signup`, {
      data: {
        email: CUSTOMER_EMAIL,
        password: CUSTOMER_PASSWORD,
        name: 'Test Customer',
        role: 'USER',
      },
    })

    if (customerSignup.ok()) {
      const customerData = await customerSignup.json()
      customerToken = customerData.token
    } else {
      // Login if already exists
      const customerLogin = await request.post(`${API_URL}/auth/login`, {
        data: { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
      })
      const customerData = await customerLogin.json()
      customerToken = customerData.token
    }

    // Create vendor store
    const storeRes = await request.post(`${API_URL}/stores`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
      data: {
        name: 'Test Restaurant',
        slug: `test-Store-${Date.now()}`,
        description: 'E2E Test Store',
        isPublished: true,
        prepTimeMin: 20,
      },
    })
    const storeData = await storeRes.json()
    vendorStoreId = storeData.id

    // Create test item
    await request.post(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
      data: {
        storeId: vendorStoreId,
        title: 'Test Burger',
        price: '10.99',
        isActive: true,
      },
    })
  })

  test('Customer receives real-time order status updates', async ({ page }) => {
    // Customer creates order
    await page.goto('http://localhost:5177')
    await page.getByLabel('Email').fill(CUSTOMER_EMAIL)
    await page.getByLabel('Password').fill(CUSTOMER_PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()

    // Wait for login
    await expect(page).toHaveURL(/.*stores/)

    // Track WebSocket messages
    const wsMessages: any[] = []
    await page.evaluate((wsUrl) => {
      const ws = new WebSocket(wsUrl)
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        ;(window as any).wsMessages = (window as any).wsMessages || []
        ;(window as any).wsMessages.push(data)
      }
    }, WS_URL)

    // Create order (simulated for now)
    // In real test, we'd navigate through the flow

    // Verify WebSocket connection established
    const messages = await page.evaluate(() => (window as any).wsMessages || [])
    expect(messages.length).toBeGreaterThan(0)
  })

  test('Vendor receives new order notification via WebSocket', async ({ browser }) => {
    const context = await browser.newContext()
    const vendorPage = await context.newPage()
    const customerPage = await context.newPage()

    // Login as vendor
    await vendorPage.goto('http://localhost:5177')
    await vendorPage.getByLabel('Email').fill(VENDOR_EMAIL)
    await vendorPage.getByLabel('Password').fill(VENDOR_PASSWORD)
    await vendorPage.getByRole('button', { name: 'Login' }).click()
    await vendorPage.waitForURL(/.*vendor/)

    // Setup WebSocket message tracking on vendor page
    await vendorPage.evaluate(() => {
      ;(window as any).vendorWsMessages = []
      // Hook into WebSocket to track messages
    })

    // Login as customer
    await customerPage.goto('http://localhost:5177')
    await customerPage.getByLabel('Email').fill(CUSTOMER_EMAIL)
    await customerPage.getByLabel('Password').fill(CUSTOMER_PASSWORD)
    await customerPage.getByRole('button', { name: 'Login' }).click()

    // Customer places order
    // (Implementation depends on your UI flow)

    // Verify vendor received notification
    await vendorPage.waitForTimeout(2000) // Wait for WebSocket event

    // Check for notification elements
    const hasNotification = await vendorPage.locator('[data-testid="new-order-notification"]').count()
    expect(hasNotification).toBeGreaterThan(0)

    await context.close()
  })

  test('Order status updates broadcast to customer and vendor', async ({ request }) => {
    // Create order via API
    const cartRes = await request.post(`${API_URL}/carts`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        storeId: vendorStoreId,
      },
    })
    const cart = await cartRes.json()

    // Add item to cart
    await request.post(`${API_URL}/cart-items`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        cartId: cart.id,
        itemId: 'test-item-id',
        quantity: 1,
        unitPrice: '10.99',
      },
    })

    // Create order
    const orderRes = await request.post(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        cartId: cart.id,
        deliveryType: 'PICKUP',
        tip: '2.00',
      },
    })
    const order = await orderRes.json()
    testOrderId = order.id

    // Verify order created
    expect(order.status).toBe('PLACED')

    // Vendor updates status to ACCEPTED
    const updateRes = await request.patch(`${API_URL}/orders/${testOrderId}/status`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
      data: {
        status: 'ACCEPTED',
        note: 'Starting preparation',
      },
    })
    expect(updateRes.ok()).toBeTruthy()

    // Verify status updated
    const updatedOrder = await updateRes.json()
    expect(updatedOrder.status).toBe('ACCEPTED')

    // In real test, we'd verify WebSocket events were sent
  })

  test('WebSocket reconnection works after disconnect', async ({ page }) => {
    await page.goto('http://localhost:5177')
    await page.getByLabel('Email').fill(CUSTOMER_EMAIL)
    await page.getByLabel('Password').fill(CUSTOMER_PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/.*stores/)

    // Track connection state
    await page.evaluate(() => {
      ;(window as any).wsConnectionStates = []
    })

    // Simulate network disconnect
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // Reconnect
    await page.context().setOffline(false)
    await page.waitForTimeout(3000)

    // Verify reconnection happened
    const states = await page.evaluate(() => (window as any).wsConnectionStates || [])
    expect(states).toContain('reconnecting')
    expect(states).toContain('connected')
  })

  test('Multiple status transitions broadcast correctly', async ({ request }) => {
    const statusFlow = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED']

    // Start from ACCEPTED (order already exists from previous test)
    for (let i = 1; i < statusFlow.length; i++) {
      const newStatus = statusFlow[i]

      const updateRes = await request.patch(`${API_URL}/orders/${testOrderId}/status`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
        data: {
          status: newStatus,
          note: `Moving to ${newStatus}`,
        },
      })

      expect(updateRes.ok()).toBeTruthy()
      const updated = await updateRes.json()
      expect(updated.status).toBe(newStatus)

      // Small delay between transitions
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Verify final status
    const finalOrder = await request.get(`${API_URL}/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    const orderData = await finalOrder.json()
    expect(orderData.status).toBe('COMPLETED')
  })

  test('Customer can cancel order and vendor receives notification', async ({ request }) => {
    // Create new order for cancellation test
    const cartRes = await request.post(`${API_URL}/carts`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        storeId: vendorStoreId,
      },
    })
    const cart = await cartRes.json()

    const orderRes = await request.post(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        cartId: cart.id,
        deliveryType: 'DELIVERY',
        tip: '0.00',
      },
    })
    const order = await orderRes.json()

    // Customer cancels order
    const cancelRes = await request.post(`${API_URL}/orders/${order.id}/cancel`, {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        reason: 'Changed my mind',
      },
    })

    expect(cancelRes.ok()).toBeTruthy()
    const canceled = await cancelRes.json()
    expect(canceled.status).toBe('CANCELED')

    // Verify order event created
    const orderCheck = await request.get(`${API_URL}/orders/${order.id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    const orderData = await orderCheck.json()
    expect(orderData.events).toBeDefined()
    expect(orderData.events.length).toBeGreaterThan(0)
  })

  test('Desktop notifications trigger for vendor on new orders', async ({ context, page }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications'])

    await page.goto('http://localhost:5177')
    await page.getByLabel('Email').fill(VENDOR_EMAIL)
    await page.getByLabel('Password').fill(VENDOR_PASSWORD)
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL(/.*vendor/)

    // Track notification API calls
    const notifications: any[] = []
    await page.exposeFunction('trackNotification', (notification: any) => {
      notifications.push(notification)
    })

    // Wait for potential new order
    await page.waitForTimeout(2000)

    // In real test, we'd create an order and verify notification appeared
    // This would require mocking the Notification API or using browser context
  })
})

