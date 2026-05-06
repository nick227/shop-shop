-- Check what bundles actually exist in the database right now
SELECT 
    b.id,
    b.name,
    b.storeId,
    s.name as store_name,
    COUNT(bi.id) as item_count,
    b.isActive
FROM Bundle b
LEFT JOIN Store s ON b.storeId = s.id
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY b.id, b.name, b.storeId, s.name, b.isActive
ORDER BY s.name, b.name;
