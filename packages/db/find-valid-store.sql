-- Find any store with items
SELECT s.id, s.name, COUNT(i.id) as item_count
FROM Store s
LEFT JOIN Item i ON s.id = i.storeId
WHERE s.id IN (SELECT storeId FROM Item)
GROUP BY s.id, s.name
ORDER BY item_count DESC
LIMIT 5;
