-- Debug: Check what bundles were actually created and their item counts
SELECT 
    b.name,
    COUNT(bi.id) as item_count,
    GROUP_CONCAT(i.title, ', ' ORDER BY bi.sortIndex) as items
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN Item i ON bi.itemId = i.id
GROUP BY b.id, b.name
ORDER BY b.name;

-- Also check which stores have bundles
SELECT 
    s.name as store_name,
    COUNT(b.id) as bundle_count,
    SUM(COUNT(bi.id)) as total_bundle_items
FROM Store s
LEFT JOIN Bundle b ON s.id = b.storeId
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY s.id, s.name
ORDER BY s.name;
