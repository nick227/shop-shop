-- Test creating a problematic bundle to verify validation works
INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-id',
    'd701e9e8-d350-467b-afa8-177a7fdec52f',
    'Test Bundle - Should Be Rejected',
    'This bundle should be rejected by validation',
    true,
    0,
    NOW(),
    NOW()
);

-- Try to add bundle items (this should work)
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-item-1',
    'test-bundle-id',
    (SELECT id FROM Item WHERE title = 'Brisket' LIMIT 1),
    1,
    0,
    NOW(),
    NOW()
);

-- Check what we created
SELECT 'Test Bundle Created: ' || name FROM Bundle WHERE id = 'test-bundle-id';
