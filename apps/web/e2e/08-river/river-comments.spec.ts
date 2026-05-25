/**
 * E2E Tests: Store River - Comments
 *
 * The vendor river page (/vendor/stores/:storeId/river) renders posts as
 * plain list items with NO like/comment/share buttons. Comment functionality
 * exists on the public /river feed (RiverCommentsPanel), not the vendor page.
 *
 * All tests in this file are skipped until comment UI is added to the vendor
 * river management page.
 */
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test.describe('Store River - Comments', () => {
  test.skip('should show comment button on posts', async () => {}) // Comment buttons not on vendor river page

  test.skip('should display comment count', async () => {}) // Comment count not on vendor river page

  test.skip('should open comment section when clicking comment button', async () => {}) // Comment section not on vendor river page

  test.skip('should show empty comment state', async () => {}) // Comment section not on vendor river page
})

test.describe('Store River - Comment Interaction', () => {
  test.skip('should increment comment count after adding comment', async () => {}) // Comment interaction not on vendor river page
})

test.describe('Store River - Comment Display', () => {
  test.skip('should show comment author name', async () => {}) // Comment display not on vendor river page

  test.skip('should show comment timestamp', async () => {}) // Comment display not on vendor river page
})
