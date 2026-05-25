import { test } from '@playwright/test'

/**
 * Category: APIs
 * Requirements: FR-096, FR-097, FR-098, FR-099, FR-100
 *
 * API / integration tests belong in the server test suite or dedicated API
 * contract tests (pnpm test:api). They are not suitable for the browser-based
 * Playwright E2E environment.
 */
test.describe('APIs', () => {

  test.skip('FR-096: webhook delivery for order events to registered endpoints — covered by server integration tests', async ({ page }) => {})

  test.skip('FR-097: public REST API with versioned endpoints and OpenAPI documentation — covered by api-contract tests', async ({ page }) => {})

  test.skip('FR-098: OAuth 2.0 / API key authentication for third-party integrations — requires API key management UI', async ({ page }) => {})

  test.skip('FR-099: rate limiting enforced on public API — covered by server integration tests', async ({ page }) => {})

  test.skip('FR-100: SDK / developer portal for partner integrations — not yet implemented', async ({ page }) => {})
})
