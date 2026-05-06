-- Let's check what the API would actually return by simulating the bundle resource logic
-- This mimics the beforeList hook in bundle.resource.ts

SELECT 
    b.id,
    b.name,
    b.storeId,
    b.isActive,
    COUNT(bi.id) as item_count,
    -- Check if all items are active and not sold out
    SUM(CASE WHEN i.isActive = 1 AND i.isSoldOut = 0 THEN 1 ELSE 0 END) as active_items,
    -- Check if all items belong to same store
    SUM(CASE WHEN i.storeId = b.storeId THEN 1 ELSE 0 END) as same_store_items
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN Item i ON bi.itemId = i.id
WHERE b.isActive = true
GROUP BY b.id, b.name, b.storeId, b.isActive
ORDER BY b.createdAt DESC;
