-- Simple count of all bundles
SELECT COUNT(*) as total_bundles FROM Bundle;

-- Check if any bundles have items
SELECT 
    COUNT(CASE WHEN bi.id IS NOT NULL THEN 1 END) as bundles_with_items,
    COUNT(CASE WHEN bi.id IS NULL THEN 1 END) as empty_bundles
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId;
