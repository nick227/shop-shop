-- Clean up test bundle if it exists
DELETE FROM BundleItem WHERE bundleId = 'test-bundle-single';
DELETE FROM BundlePricing WHERE bundleId = 'test-bundle-single';
DELETE FROM Bundle WHERE id = 'test-bundle-single';
