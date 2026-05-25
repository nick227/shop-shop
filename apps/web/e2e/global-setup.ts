/**
 * Playwright Global Setup
 *
 * Creates ONE shared test user and saves the authenticated browser storageState
 * to e2e/.auth/user.json. All tests that use the `authenticatedPage` fixture
 * read this file instead of signing up per-test, which avoids the API rate limit
 * (signup: 20/15min, login: 5/15min).
 *
 * The JWT token issued by the server expires in 7 days, so you only need one
 * user creation per week. The .auth/ directory is git-ignored.
 */
import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

export const AUTH_STATE_PATH = path.join(process.cwd(), 'e2e', '.auth', 'user.json')

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true })

  // Reuse existing auth state if it's less than 6 days old (JWT expires in 7 days).
  // This prevents exhausting the signup rate limit (20/15min) on repeated local runs.
  if (fs.existsSync(AUTH_STATE_PATH)) {
    const ageDays = (Date.now() - fs.statSync(AUTH_STATE_PATH).mtimeMs) / 86_400_000
    if (ageDays < 6) {
      console.log(`[global-setup] Reusing auth state (${ageDays.toFixed(1)}d old, valid < 6d)`)
      return
    }
    console.log(`[global-setup] Auth state is ${ageDays.toFixed(1)}d old — creating fresh user`)
  }

  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:5187'
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  try {
    const ts = Date.now()
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('E2E Shared User')
    await page.getByLabel(/email address/i).fill(`e2e-shared-${ts}@example.com`)
    await page.getByLabel(/^password/i).fill('E2EShared123!')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/river/, { timeout: 30000 })

    await context.storageState({ path: AUTH_STATE_PATH })
    console.log(`[global-setup] Saved auth state for shared test user`)
  } finally {
    await browser.close()
  }
}
