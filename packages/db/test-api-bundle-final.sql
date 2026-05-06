-- Test bundle creation through database (bypassing API validation)
-- This should create a 1-item bundle that would normally be rejected

-- Get existing store ID first
SELECT @storeId := id FROM Store WHERE name LIKE '%BBQ Pit%' AND name LIKE '%West Campus%' LIMIT 1;

-- Get an existing item ID from that store
SELECT @itemId := id FROM Item WHERE storeId = @storeId LIMIT 1;

-- Create bundle with only 1 item directly in DB
INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-api-bundle-1item',
    @storeId,
    'API Test Bundle - 1 Item Only',
    'This bundle should be filtered out by API validation',
    true,
    0,
    NOW(),
    NOW()
);

-- Add single bundle item
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
VALUES (
    'test-api-bundle-item-1',
    'test-api-bundle-1item',
    @itemId,
    1,
    0,
    NOW(),
    NOW()
);

-- Check what we created
SELECT 'API Test Bundle Created: ' || name || ' with ' || COUNT(bi.id) || ' items' FROM Bundle b 
LEFT JOIN BundleItem bi ON b.id = bi.bundleId 
WHERE b.id = 'test-api-bundle-1item';
