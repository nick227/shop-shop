-- Check if there's a bug in bundle creation - look for bundles without items
SELECT 
    b.id,
    b.name,
    b.storeId,
    s.name as store_name,
    COUNT(bi.id) as actual_item_count,
    b.createdAt,
    b.isActive
FROM Bundle b
LEFT JOIN Store s ON b.storeId = s.id
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY b.id, b.name, b.storeId, s.name, b.createdAt, b.isActive
HAVING COUNT(bi.id) = 0 OR COUNT(bi.id) < 2
ORDER BY b.createdAt DESC;
