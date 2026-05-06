-- Verify all bundles are deleted
SELECT COUNT(*) as total_bundles FROM Bundle;
SELECT COUNT(*) as total_bundle_items FROM BundleItem;
SELECT COUNT(*) as total_bundle_pricing FROM BundlePricing;
