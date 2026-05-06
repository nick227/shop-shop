-- Test cleanup to verify it works
DELETE FROM BundleItem;
DELETE FROM BundlePricing;
DELETE FROM Bundle;

-- Verify cleanup
SELECT 'Bundles cleaned: ' || COUNT(*) FROM Bundle;
