-- Clean up test data
DELETE FROM BundleItem WHERE bundleId LIKE 'test-bundle%';
DELETE FROM Bundle WHERE id LIKE 'test-bundle%';

-- Verify cleanup
SELECT 'Test bundles cleaned: ' || COUNT(*) FROM Bundle WHERE id LIKE 'test-bundle%';
