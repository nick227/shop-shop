-- Debug: Check bundle counts without GROUP_CONCAT
SELECT 
    b.name,
    COUNT(bi.id) as item_count
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY b.id, b.name
ORDER BY b.name;

-- Check store bundle counts
SELECT 
    s.name as store_name,
    COUNT(b.id) as bundle_count
FROM Store s
LEFT JOIN Bundle b ON s.id = b.storeId
GROUP BY s.id, s.name
ORDER BY s.name;
