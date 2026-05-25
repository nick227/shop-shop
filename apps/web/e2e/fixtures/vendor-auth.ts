/**
 * Vendor Authentication Fixtures for E2E Tests
 *
 * Creates a DEDICATED vendor test user per worker (not the shared customer user
 * from user.json). The vendor user's storageState and store ID are cached in
 * e2e/.auth/vendor-state-N.json for up to 6 days.
 *
 * Why a separate vendor user?
 *  - POST /api/stores auto-upgrades the creator's DB role to VENDOR
 *  - If the shared customer (user.json) were upgraded, order-history and other
 *    tests that depend on USER role would fail (/api/orders beforeList throws
 *    Forbidden for VENDOR role without a storeId query param)
 */
import { test as base, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const APP_BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5187'
const API_BASE = (process.env.VITE_API_URL || 'http://localhost:3015').replace(/\/$/, '')

const AUTH_DIR = path.join(process.cwd(), 'e2e', '.auth')

function vendorStatePath(workerIndex: number): string {
  fs.mkdirSync(AUTH_DIR, { recursive: true })
  return path.join(AUTH_DIR, `vendor-state-${workerIndex}.json`)
}

function vendorStorageStatePath(workerIndex: number): string {
  return path.join(AUTH_DIR, `vendor-storagestate-${workerIndex}.json`)
}

interface VendorState {
  storeId: string
  storageStatePath: string
  updatedAt: number
}

/** Extract the raw JWT token from a Playwright storageState file. */
function extractTokenFromStorageState(storagePath: string): string {
  const state = JSON.parse(fs.readFileSync(storagePath, 'utf-8')) as {
    origins: Array<{
      origin: string
      localStorage: Array<{ name: string; value: string }>
    }>
  }
  const appOrigin = state.origins.find(
    (o) => o.origin.includes('localhost:5187') || o.origin.includes('localhost:3000'),
  )
  const authItem = appOrigin?.localStorage.find((item) => item.name === 'auth-storage')
  if (!authItem) throw new Error('auth-storage key not found in storageState')
  const parsed = JSON.parse(authItem.value) as { state: { token?: string } }
  const token = parsed.state.token
  if (!token) throw new Error('No token found in auth-storage')
  return token
}

/**
 * Ensure a dedicated vendor user exists and has a test store.
 * Caches everything in vendor-state-N.json + vendor-storagestate-N.json.
 * Only re-creates when the cache is >= 6 days old (JWT expires in 7 days).
 */
async function ensureVendorState(
  playwright: Parameters<Parameters<typeof base.extend>[0][string]>[0]['playwright'],
  workerIndex: number,
): Promise<VendorState> {
  const statePath = vendorStatePath(workerIndex)
  const storagePath = vendorStorageStatePath(workerIndex)

  // Reuse cached state if < 6 days old
  if (fs.existsSync(statePath)) {
    const cached = JSON.parse(fs.readFileSync(statePath, 'utf-8')) as VendorState
    const ageDays = (Date.now() - cached.updatedAt) / 86_400_000
    if (ageDays < 6 && fs.existsSync(storagePath)) {
      return cached
    }
  }

  // Sign up a fresh vendor user via the browser (matches global-setup pattern)
  const browser = await playwright.chromium.launch()
  const context = await browser.newContext({ baseURL: APP_BASE_URL })
  const page = await context.newPage()

  let token: string
  try {
    const ts = Date.now()
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('E2E Vendor User')
    await page.getByLabel(/email address/i).fill(`e2e-vendor-w${workerIndex}-${ts}@example.com`)
    await page.getByLabel(/^password/i).fill('E2EVendor123!')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/river/, { timeout: 30000 })

    await context.storageState({ path: storagePath })
    token = extractTokenFromStorageState(storagePath)
  } finally {
    await browser.close()
  }

  // Create the test store with the new vendor user's token
  const apiCtx = await playwright.request.newContext({ baseURL: API_BASE })
  const slug = `e2e-river-w${workerIndex}-${Date.now()}`
  const storeRes = await apiCtx.post('/api/stores', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: `E2E River Store W${workerIndex}`,
      slug,
      description: 'Automated E2E test store for River feature',
      email: 'e2e-river@example.com',
      phone: '555-0100',
      website: 'https://example.com',
    },
  })

  if (!storeRes.ok()) {
    const errText = await storeRes.text()
    await apiCtx.dispose()
    throw new Error(`Vendor store creation failed (${storeRes.status()}): ${errText}`)
  }

  const storeData = (await storeRes.json()) as { id?: string; data?: { id: string } }
  await apiCtx.dispose()
  const storeId = storeData.id ?? storeData.data?.id

  if (!storeId) throw new Error('Store creation succeeded but returned no id')

  const state: VendorState = { storeId, storageStatePath: storagePath, updatedAt: Date.now() }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
  return state
}

interface VendorFixtures {
  authenticatedVendor: Page
  storeId: string
}

interface WorkerVendorFixtures {
  workerVendorState: VendorState
}

export const vendorTest = base.extend<VendorFixtures, WorkerVendorFixtures>({
  // Worker-scoped: create/cache the vendor user + store once per parallel worker
  workerVendorState: [
    async ({ playwright }, use, workerInfo) => {
      const state = await ensureVendorState(playwright, workerInfo.workerIndex)
      await use(state)
    },
    { scope: 'worker' },
  ],

  storeId: async ({ workerVendorState }, use) => {
    await use(workerVendorState.storeId)
  },

  // Test-scoped: open a fresh browser context as the vendor user
  authenticatedVendor: async ({ browser, workerVendorState }, use) => {
    const { storeId, storageStatePath } = workerVendorState

    if (!fs.existsSync(storageStatePath)) {
      throw new Error(`Vendor auth state not found at ${storageStatePath}.`)
    }

    const context = await browser.newContext({ storageState: storageStatePath })
    const page = await context.newPage()

    await page.goto(`/vendor/stores/${storeId}/river`)
    await page.waitForURL(/\/vendor\/stores\/[^/]+\/river/, { timeout: 15000 })

    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
