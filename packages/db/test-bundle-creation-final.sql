-- Test creating a problematic bundle to verify validation works
-- Use existing store ID from BBQ Pit West Campus
SET @storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f';

-- Create a test bundle with only 1 item (should be rejected by API validation)
INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-single-item',
    @storeId,
    'Test Single Item Bundle - Should Be Rejected',
    'This bundle should be rejected because it only has 1 item',
    true,
    0,
    NOW(),
    NOW()
);

-- Try to add only 1 bundle item
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-item-single',
    'test-bundle-single-item',
    (SELECT id FROM Item WHERE storeId = @storeId LIMIT 1),
    1,
    0,
    NOW(),
    NOW()
);

-- Check what we created
SELECT 'Test Bundle Created: ' || name || ' with ' || COUNT(bi.id) || ' items' FROM Bundle b 
LEFT JOIN BundleItem bi ON b.id = bi.bundleId 
WHERE b.id = 'test-bundle-single-item';
