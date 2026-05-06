-- Create a single test bundle with correct item names
-- Use BBQ Pit West Campus store ID: d701e9e8-d350-467b-afa8-177a7fdec52f

-- First get existing items from the store
SELECT @item1 := id FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 1;
SELECT @item2 := id FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 1 OFFSET 1;
SELECT @item3 := id FROM Item WHERE storeId = 'd701e9e8-d350-467b-afa8-177a7fdec52f' LIMIT 1 OFFSET 2;

-- Create the test bundle
INSERT INTO Bundle (id, storeId, name, description, isActive, sortIndex, createdAt, updatedAt)
VALUES (
    'test-bundle-single',
    'd701e9e8-d350-467b-afa8-177a7fdec52f',
    'Test Bundle - 3 Items',
    'Test bundle with 3 items to verify fix. Includes: Item 1, Item 2, Item 3',
    true,
    0,
    NOW(),
    NOW()
);

-- Add 3 bundle items
INSERT INTO BundleItem (id, bundleId, itemId, quantity, sortIndex, createdAt, updatedAt)
VALUES 
    ('test-bundle-item-1', 'test-bundle-single', @item1, 1, 0, NOW(), NOW()),
    ('test-bundle-item-2', 'test-bundle-single', @item2, 1, 1, NOW(), NOW()),
    ('test-bundle-item-3', 'test-bundle-single', @item3, 1, 2, NOW(), NOW());

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
