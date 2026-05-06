-- Check bundles for a specific store (BBQ Pit West Campus example)
SELECT 
    b.name,
    COUNT(bi.id) as item_count,
    GROUP_CONCAT(i.title, ', ' ORDER BY bi.sortIndex) as items
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN Item i ON bi.itemId = i.id
WHERE b.storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f'
GROUP BY b.id, b.name
ORDER BY b.name;
