-- Test creating a problematic bundle to verify validation works
-- First get a valid store ID
SET @storeId = (SELECT id FROM Store WHERE name LIKE '%BBQ Pit%' AND name LIKE '%West Campus%' LIMIT 1);

-- Create a test bundle with only 1 item (should be rejected)
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
SELECT 'Test Bundle Created: ' || name FROM Bundle WHERE id = 'test-bundle-single-item';
