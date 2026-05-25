import { test } from '@playwright/test'

/**
 * Category: Promotions & Loyalty
 * Requirements: FR-066, FR-067, FR-068, FR-069, FR-070
 *
 * All tests require a promotions/coupon engine and loyalty program that are
 * not yet exposed via UI routes in the current build.
 */
test.describe('Promotions & Loyalty', () => {

  test.skip('FR-066: store can create promotions with eligibility rules (time, items, spend) — requires promotions management UI', async ({ page }) => {})

  test.skip('FR-067: coupon codes validated and applied at checkout — requires promotion seeded and coupon UI at checkout', async ({ page }) => {})

  test.skip('FR-068: automatic discount applied when cart meets eligibility threshold — requires promotions engine integration', async ({ page }) => {})

  test.skip('FR-069: loyalty points earned per order and redeemable at checkout — requires loyalty program configuration', async ({ page }) => {})

  test.skip('FR-070: referral bonus credited to affiliate on qualifying order — verified via affiliate commission tests', async ({ page }) => {})
})
