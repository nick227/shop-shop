-- Debug what bundles actually exist after seeding
SELECT 
    b.id,
    b.name,
    b.storeId,
    s.name as store_name,
    COUNT(bi.id) as item_count,
    b.isActive,
    b.createdAt
FROM Bundle b
LEFT JOIN Store s ON b.storeId = s.id
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY b.id, b.name, b.storeId, s.name, b.isActive, b.createdAt
ORDER BY b.createdAt DESC, s.name;
