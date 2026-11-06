import { expect, test } from '@playwright/test'

const source = '/neighborhoods/austin-tx-south-congress?category=food&q=coffee&radius=10&sort=distance&view=feed&price=2&style=casual'
const listing = {
  id: 'cafe', slug: 'local-cafe', name: 'Local Coffee Café', category: 'COFFEE', categoryLabel: 'Coffee',
  addressCity: 'Austin', addressState: 'TX', addressZip: '78704', addressStreet: '100 Congress Ave',
  latitude: 30.25, longitude: -97.75, distance: 0.2, images: [], videos: [],
  neighborhood: { name: 'South Congress', slug: 'austin-tx-south-congress' },
  city: { name: 'Austin', slug: 'austin-tx' },
}

test.beforeEach(async ({ context, page }) => {
  await page.mouse.move(350, 100)
  await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const path = new URL(route.request().url()).pathname
    let body: unknown = { data: [], items: [], stores: [], total: 0, pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } }
    if (path === '/api/directory/listings/local-cafe') body = { listing }
    else if (path === '/api/directory') body = { listings: [listing] }
    else if (path.endsWith('/guide')) body = { sections: [] }
    else if (path === '/api/places/austin-tx-south-congress') body = {
      id: 'south-congress', name: 'South Congress', slug: 'austin-tx-south-congress',
      latitude: 30.25, longitude: -97.75, city: { name: 'Austin', slug: 'austin-tx', state: 'TX' },
      images: [], nearby: [], postalCodes: ['78704'],
    }
    else if (path.includes('/places/')) body = { neighborhoods: [] }
    await route.fulfill({ json: body })
  })
})

test('business visits retain discovery context across reload, tabs and history', async ({ page, context }) => {
  const directoryRequest = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/directory' && new URL(request.url()).searchParams.has('latitude'))
  await page.goto(source)
  const cafe = page.locator('a[href^="/directory/local-cafe"]').first()
  await expect(cafe).toBeVisible()
  expect(new URL((await directoryRequest).url()).searchParams.get('radiusMiles')).toBe('10')
  const href = await cafe.getAttribute('href')
  expect(new URL(href!, 'http://localhost').searchParams.get('from')).toBe(source)
  await cafe.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => window.scrollY)
  await cafe.click()
  await expect(page.getByRole('navigation', { name: 'Business breadcrumb' })).toContainText('South Congress')
  await expect(page.getByText('← Back to results')).toHaveAttribute('href', source)
  await page.reload()
  await expect(page.getByText('← Back to results')).toHaveAttribute('href', source)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const tab = await context.newPage()
  await tab.goto(href!)
  await expect(tab.getByText('← Back to results')).toHaveAttribute('href', source)
  await tab.close()
  await page.goBack()
  await expect(cafe).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(scroll, 0)
  await page.goForward()
  await expect(page.getByText('← Back to results')).toBeVisible()
  await page.getByText('← Back to results').click()
  await expect(page).toHaveURL(new RegExp('radius=10'))
  await expect(cafe).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(source)
})

test('direct business visits have breadcrumbs without a fabricated return link', async ({ page }) => {
  await page.goto('/directory/local-cafe')
  await expect(page.getByRole('navigation', { name: 'Business breadcrumb' })).toContainText('Austin')
  await expect(page.getByText('← Back to results')).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Business breadcrumb' }).screenshot({ path: test.info().outputPath('breadcrumbs.png') })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('map context and explicit radius survive the directory-to-merchant redirect', async ({ page }) => {
  const mapSource = source.replace('view=feed', 'view=map')
  await page.route('**/api/directory/listings/local-cafe', (route) => route.fulfill({ json: { listing: { ...listing, store: { name: 'Local Coffee Café', slug: 'merchant-cafe' } } } }))
  await page.goto(`/directory/local-cafe?from=${encodeURIComponent(mapSource)}`)
  await expect(page).toHaveURL(/\/kitchen\/merchant-cafe/)
  expect(new URL(page.url()).searchParams.get('from')).toBe(mapSource)
})
