SELECT b.name, COUNT(bi.id) as item_count, GROUP_CONCAT(i.title, ', ') as items
FROM Bundle b
LEFT JOIN BundleItem bi ON b.id = bi.bundleId
LEFT JOIN Item i ON bi.itemId = i.id
GROUP BY b.id, b.name
HAVING COUNT(bi.id) < 2 OR COUNT(bi.id) > 10
ORDER BY b.name;
