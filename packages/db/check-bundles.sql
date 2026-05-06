SELECT COUNT(*) as total_bundles FROM Bundle;
SELECT b.name, COUNT(bi.id) as item_count
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
GROUP BY b.id, b.name
ORDER BY b.name;
