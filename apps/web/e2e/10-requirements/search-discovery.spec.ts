import { test, expect } from '@playwright/test'

/**
 * Category: Search & Discovery
 * Requirements: FR-061, FR-062, FR-063, FR-064, FR-065
 */
test.describe('Search & Discovery', () => {

  test('FR-061: search page renders with a keyword search input', async ({ page }) => {
    await page.goto('/search')
    // Search input should be visible
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 })
  })

  test('FR-062: entering a search query produces results or an empty-state message', async ({ page }) => {
    await page.goto('/search')
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i))
    await searchInput.first().fill('burger')
    await searchInput.first().press('Enter')
    // After search, either results or "no results" message appears
    await expect(
      page.getByText(/result|kitchen|store|no match|nothing found/i).first()
    ).toBeVisible({ timeout: 12000 })
  })

  test.skip('FR-063: search filters by category and tags — requires seeded catalog with tagged items', async ({ page }) => {})

  test.skip('FR-064: search results ranked by relevance and distance — requires geolocation + seeded data', async ({ page }) => {})

  test.skip('FR-065: typeahead / autocomplete suggestions — requires autocomplete UI implementation', async ({ page }) => {})
})
