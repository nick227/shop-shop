-- Test: Create a proper 2-item bundle that should work
-- Use existing valid data

INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-working-bundle',
    'd701e9e8-d350-467b-afa8-177a7fdec52f',
    'Test Working Bundle - Should Pass',
    'This bundle should pass validation with 2 items',
    true,
    0,
    NOW(),
    NOW()
);

-- Add 2 bundle items
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
SELECT 
    'test-working-item-1',
    'test-working-bundle',
    id,
    1,
    0,
    NOW(),
    NOW()
FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 1
UNION ALL
SELECT 
    'test-working-item-2',
    'test-working-bundle',
    id,
    1,
    1,
    NOW(),
    NOW()
FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 1 OFFSET 1;

-- Check result
SELECT 'Working Bundle Created: ' || name || ' with ' || COUNT(bi.id) || ' items' FROM Bundle b 
LEFT JOIN BundleItem bi ON b.id = bi.bundleId 
WHERE b.id = 'test-working-bundle';
