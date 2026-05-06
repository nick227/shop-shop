-- Create a single test bundle with correct item names
-- Use any existing store with items

-- Get first store with items
SET @storeId = (SELECT s.id FROM Store s JOIN Item i ON s.id = i.storeId LIMIT 1);

-- Create the test bundle
INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-single',
    @storeId,
    'Test Bundle - 3 Items',
    'Test bundle with 3 items to verify fix. Includes: Item 1, Item 2, Item 3',
    true,
    0,
    NOW(),
    NOW()
);

-- Add 3 bundle items
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
SELECT 
    'test-bundle-item-1',
    'test-bundle-single',
    id,
    1,
    0,
    NOW(),
    NOW()
FROM Item WHERE storeId = @storeId LIMIT 1
UNION ALL
SELECT 
    'test-bundle-item-2',
    'test-bundle-single',
    id,
    1,
    1,
    NOW(),
    NOW()
FROM Item WHERE storeId = @storeId LIMIT 1 OFFSET 1
UNION ALL
SELECT 
    'test-bundle-item-3',
    'test-bundle-single',
    id,
    1,
    2,
    NOW(),
    NOW()
FROM Item WHERE storeId = @storeId LIMIT 1 OFFSET 2;

-- Add bundle pricing
INSERT INTO BundlePricing (id, bundleId, pricingType, fixedPrice, showSavings, savingsLabel, createdAt, updatedAt)
VALUES (
    'test-bundle-pricing',
    'test-bundle-single',
    'FIXED_PRICE',
    15.99,
    true,
    'Save $2.00!',
    NOW(),
    NOW()
);

-- Verify creation
SELECT 'Test Bundle Created: ' || name || ' with ' || COUNT(bi.id) || ' items' 
FROM Bundle b 
LEFT JOIN BundleItem bi ON b.id = bi.bundleId 
WHERE b.id = 'test-bundle-single';
