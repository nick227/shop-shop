-- Verify bundle creation results
SELECT 
    b.name,
    COUNT(bi.id) as item_count,
    b.storeId,
    s.name as store_name
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN Store s ON b.storeId = s.id
GROUP BY b.id, b.name, b.storeId, s.name
ORDER BY s.name, b.name;
