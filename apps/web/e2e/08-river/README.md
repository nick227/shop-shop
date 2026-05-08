# Store River E2E Tests

Comprehensive end-to-end tests for the Store River feature.

## Test Coverage

### 1. Post Management (`river-posts.spec.ts`)
- Display river page and filters
- Create text-only posts
- Create posts with media
- Validate post requirements
- Character count and limits
- Cancel post creation
- Like/unlike posts
- Post actions (like, comment, share)
- Responsive design
- Empty states

### 2. Pagination (`river-pagination.spec.ts`)
- Load more button functionality
- Loading indicators
- Infinite scroll support (future)
- Pagination edge cases

### 3. Comments (`river-comments.spec.ts`)
- Comment button display
- Comment count updates
- Open comment sections
- Empty comment states
- Comment author and timestamp display

### 4. Accessibility & Edge Cases (`river-accessibility.spec.ts`)
- ARIA labels and semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast
- Extremely long content
- Special characters
- Rapid interactions
- Network error handling
- Performance under load

## Running Tests

### Run all river tests
```bash
pnpm --filter @apps/web test:e2e --grep "River"
```

### Run specific test suite
```bash
# Posts
pnpm --filter @apps/web test:e2e apps/web/e2e/08-river/river-posts.spec.ts

# Pagination
pnpm --filter @apps/web test:e2e apps/web/e2e/08-river/river-pagination.spec.ts

# Comments
pnpm --filter @apps/web test:e2e apps/web/e2e/08-river/river-comments.spec.ts

# Accessibility
pnpm --filter @apps/web test:e2e apps/web/e2e/08-river/river-accessibility.spec.ts
```

### Run in specific browser
```bash
pnpm --filter @apps/web test:e2e --project=chromium --grep "River"
pnpm --filter @apps/web test:e2e --project=firefox --grep "River"
pnpm --filter @apps/web test:e2e --project=webkit --grep "River"
```

### Run mobile tests
```bash
pnpm --filter @apps/web test:e2e --project="Mobile Chrome" --grep "River"
pnpm --filter @apps/web test:e2e --project="Mobile Safari" --grep "River"
```

### Run in headed mode (see browser)
```bash
pnpm --filter @apps/web test:e2e --headed --grep "River"
```

### Run in debug mode
```bash
pnpm --filter @apps/web test:e2e --debug --grep "River"
```

## Test Requirements

### Prerequisites
1. Backend server running with river routes implemented
2. Database migrated with Post, PostLike, Comment models
3. Vendor authentication working
4. Store creation working

### Test Data
- Tests create their own vendor accounts
- Tests create test stores
- Tests create test posts
- No manual setup required

## Test Patterns

### Vendor Authentication Fixture
```typescript
import { vendorTest as test, expect } from '../fixtures/vendor-auth'

test('should create post', async ({ authenticatedVendor: page, storeId }) => {
  // page is authenticated as vendor
  // storeId is available for use
})
```

### Wait Strategies
- Use `page.waitForTimeout(1000)` for UI updates
- Use `page.waitForURL()` for navigation
- Use `await expect().toBeVisible()` for element checks

### Selectors Priority
1. Role-based: `getByRole('button', { name: /create/i })`
2. Label-based: `getByLabel(/email/i)`
3. Text-based: `getByText(/menu/i)`
4. Placeholder: `getByPlaceholder(/search/i)`
5. Test ID: `getByTestId('post-card')`
6. Class-based: `locator('[class*="postCard"]')` (last resort)

## Known Limitations

### Current Stub Implementations
Some tests may need adjustments once real API integration is complete:
- Media upload functionality
- Real-time updates
- Comment creation UI
- Share functionality

### Mobile Testing
- Tests include mobile viewport changes
- Actual device testing recommended for production

### Performance Tests
- Current thresholds are reasonable for development
- May need adjustment for production environment

## Debugging Tips

### Failed Tests
1. Check screenshots in `test-results/`
2. Watch video recordings of failures
3. Run with `--headed` to see browser
4. Add `await page.pause()` to inspect state

### Flaky Tests
- Increase `waitForTimeout` if needed
- Check for race conditions
- Verify network requests complete

### Common Issues
1. **Test timeouts**: Increase timeout or check server
2. **Element not found**: Check selectors match UI
3. **Authentication fails**: Verify auth flow works manually

## Future Enhancements

- [ ] Add visual regression tests
- [ ] Add API mocking for offline testing
- [ ] Add performance benchmarks
- [ ] Add accessibility audit integration
- [ ] Add cross-browser screenshot comparison
- [ ] Add network throttling tests
- [ ] Add real media upload tests
- [ ] Add realtime update tests

