import { test } from '@playwright/test'

/**
 * Category: Inventory & Availability
 * Requirements: FR-026, FR-027, FR-028, FR-029, FR-030
 *
 * All tests in this category require seeded store + item data with stock
 * configuration, which is not available in the baseline E2E environment.
 */
test.describe('Inventory & Availability', () => {

  test.skip('FR-026: stock levels per SKU (finite, infinite, made-to-order) — requires seeded catalog with inventory config', async ({ page }) => {})

  test.skip('FR-027: per-day item availability and blackout dates — requires seeded store schedule config', async ({ page }) => {})

  test.skip('FR-028: out-of-stock items automatically hidden/disabled — requires seeded out-of-stock item', async ({ page }) => {})

  test.skip('FR-029: low-stock threshold alerts to store staff — requires seeded inventory + staff account', async ({ page }) => {})

  test.skip('FR-030: real-time inventory decrement on order placement and restock on cancellation — requires full order flow with live inventory', async ({ page }) => {})
})
