/**
 * Cart Network Response Test
 * Captures actual API response to debug items issue
 */
import { test, expect } from '@playwright/test'

test.describe('Cart Network Response', () => {
  test('should capture cart list API response', async ({ page }) => {
    // Capture network requests
    const requests: any[] = []
    const responses: any[] = []

    page.on('request', request => {
      if (request.url().includes('/carts')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        })
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/carts')) {
        const body = await response.text().catch(() => 'Could not read body')
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body,
        })
      }
    })

    // Navigate to the app
    await page.goto('http://localhost:5177')
    
    // Wait for app to load
    await page.waitForLoadState('networkidle')

    // Check if already logged in or need to login
    const loginButton = page.locator('button:has-text("Login")')
    const isLoggedOut = await loginButton.isVisible().catch(() => false)

    if (isLoggedOut) {
      console.log('Not logged in, performing login...')
      await loginButton.click()
      
      // Fill in login form
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Wait for login to complete
      await page.waitForTimeout(2000)
    }

    // Wait a bit for any cart requests
    await page.waitForTimeout(2000)

    // Log all cart requests and responses
    console.log('\n========== CART REQUESTS ==========')
    requests.forEach((req, i) => {
      console.log(`\nRequest ${i + 1}:`)
      console.log('URL:', req.url)
      console.log('Method:', req.method)
      console.log('Auth header:', req.headers['authorization'] || 'NONE')
    })

    console.log('\n========== CART RESPONSES ==========')
    responses.forEach((res, i) => {
      console.log(`\nResponse ${i + 1}:`)
      console.log('URL:', res.url)
      console.log('Status:', res.status)
      console.log('Body:', res.body)
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(res.body)
        console.log('\nParsed JSON:')
        console.log(JSON.stringify(json, null, 2))
        
        if (json.data && Array.isArray(json.data)) {
          console.log(`\nFound ${json.data.length} carts`)
          json.data.forEach((cart: any, idx: number) => {
            console.log(`\nCart ${idx + 1}:`)
            console.log('  ID:', cart.id)
            console.log('  Status:', cart.status)
            console.log('  Items field exists:', 'items' in cart)
            console.log('  Items value:', cart.items)
            console.log('  Items type:', typeof cart.items)
            console.log('  Items is array:', Array.isArray(cart.items))
            if (Array.isArray(cart.items)) {
              console.log('  Items length:', cart.items.length)
            }
          })
        }
      } catch (e) {
        console.log('Failed to parse as JSON:', e)
      }
    })

    // Verify we got at least one response
    expect(responses.length).toBeGreaterThan(0)
    
    // Check if any response had a cart with items
    const hasCartsResponse = responses.find(r => {
      try {
        const json = JSON.parse(r.body)
        return json.data && Array.isArray(json.data)
      } catch {
        return false
      }
    })

    if (hasCartsResponse) {
      const json = JSON.parse(hasCartsResponse.body)
      console.log('\n========== FINAL ANALYSIS ==========')
      console.log('Total carts returned:', json.data.length)
      
      if (json.data.length > 0) {
        const firstCart = json.data[0]
        console.log('First cart has items field:', 'items' in firstCart)
        console.log('First cart items value:', firstCart.items)
        
        // This is the critical assertion
        expect(firstCart).toHaveProperty('items')
        expect(Array.isArray(firstCart.items)).toBe(true)
      }
    }
  })
})

