import { test } from '@playwright/test'

/**
 * Category: Customer Support
 * Requirements: FR-076, FR-077, FR-078, FR-079, FR-080
 *
 * Support features (help center, ticketing, chat, dispute resolution) are not
 * yet surfaced via UI routes in the current build.
 */
test.describe('Customer Support', () => {

  test.skip('FR-076: in-app help center with FAQs and contact options — help center page not yet implemented', async ({ page }) => {})

  test.skip('FR-077: customer can open a support ticket for an order issue — ticketing system not yet implemented', async ({ page }) => {})

  test.skip('FR-078: support agent can view and respond to tickets — requires support agent role + ticket UI', async ({ page }) => {})

  test.skip('FR-079: dispute resolution workflow (chargeback, refund request) — requires order dispute flow', async ({ page }) => {})

  test.skip('FR-080: escalation path for unresolved disputes to platform admin — requires escalation queue', async ({ page }) => {})
})
