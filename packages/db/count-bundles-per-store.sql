-- Count bundles per store to see if 17 bundles are being created
SELECT 
    s.id,
    s.name,
    COUNT(b.id) as bundle_count,
    SUM(CASE WHEN bi.id IS NOT NULL THEN 1 ELSE 0 END) as bundles_with_items,
    SUM(CASE WHEN bi.id IS NULL THEN 1 ELSE 0 END) as empty_bundles
FROM Store s
LEFT JOIN Bundle b ON s.id = b.storeId
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY s.id, s.name
ORDER BY bundle_count DESC;
