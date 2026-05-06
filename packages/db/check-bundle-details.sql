-- Check bundle items and pricing details
SELECT 
    b.id,
    b.name,
    b.storeId,
    s.name as store_name,
    COUNT(bi.id) as item_count,
    bp.pricingType,
    bp.fixedPrice,
    bp.discountPercent,
    bp.discountAmount,
    b.isActive
FROM Bundle b
LEFT JOIN Store s ON b.storeId = s.id
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN BundlePricing bp ON b.id = bp.bundleId
GROUP BY b.id, b.name, b.storeId, s.name, bp.pricingType, bp.fixedPrice, bp.discountPercent, bp.discountAmount, b.isActive
ORDER BY s.name, b.name;
