-- Simple test: Create 1-item bundle directly
-- Use hardcoded valid IDs we know exist

INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-simple-bundle',
    'd701e9e8-d350-467b-afa8-177a7fdec52f',
    'Test Bundle - 1 Item Only',
    'This bundle should be filtered out',
    true,
    0,
    NOW(),
    NOW()
);

-- Add 1 item to it
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
VALUES (
    'test-simple-item',
    'test-simple-bundle',
    'some-existing-item-id',
    1,
    0,
    NOW(),
    NOW()
);

-- Check result
SELECT 'Bundle created: ' || name || ' with items: ' || COUNT(bi.id) FROM Bundle b 
LEFT JOIN BundleItem bi ON b.id = bi.bundleId 
WHERE b.id = 'test-simple-bundle';
