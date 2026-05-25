import { test, expect } from '../fixtures'

test.describe('Browse Stores — River Landing', () => {
  test('unauthenticated access to a protected route redirects to login', async ({ page }) => {
    // /orders is protected; /river is public — use /orders for the guard check
    await page.goto('/orders')
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('river page loads for authenticated users', async ({ authenticatedPage: page }) => {
    await page.goto('/river')
    await expect(page).toHaveURL(/\/river/)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('river page renders without JS errors', async ({ authenticatedPage: page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto('/river')
    await page.waitForLoadState('networkidle')
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })
})

test.describe('Store Search', () => {
  test('unified search page renders with a search input', async ({ authenticatedPage: page }) => {
    await page.goto('/search')
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('search input accepts text and can be cleared', async ({ authenticatedPage: page }) => {
    await page.goto('/search')
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await searchInput.first().fill('pizza')
    await expect(searchInput.first()).toHaveValue('pizza')
    await searchInput.first().clear()
    await expect(searchInput.first()).toHaveValue('')
  })

  test('entering a query and submitting produces results or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/search')
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await searchInput.first().fill('burger')
    await searchInput.first().press('Enter')
    await expect(
      page.getByText(/result|kitchen|store|no match|nothing found/i).first()
    ).toBeVisible({ timeout: 12000 })
  })
})
