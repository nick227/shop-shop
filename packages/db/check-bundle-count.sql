-- Check total bundle count in database
SELECT COUNT(*) as total_bundles FROM Bundle;

-- Check bundle items count
SELECT COUNT(*) as total_bundle_items FROM BundleItem;

-- Check if any bundles exist at all
SELECT 'Bundles exist: ' || (CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END) as status
FROM Bundle;
