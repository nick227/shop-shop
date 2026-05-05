-- Data Cleanup Script for Database Integrity
-- Purpose: Clean orphan records and validate data integrity before migrations

-- Step 1: Check for orphan records (diagnostic)

-- Check orphaned PromotionRedemption records
SELECT 
  COUNT(*) as orphaned_redemptions,
  'PromotionRedemption' as table_name
FROM PromotionRedemption pr
LEFT JOIN User u ON pr.userId = u.id 
WHERE u.id IS NULL

UNION ALL

-- Check orphaned Commission records
SELECT 
  COUNT(*) as orphaned_commissions,
  'Commission' as table_name  
FROM Commission c
LEFT JOIN Store s ON c.storeId = s.id
WHERE s.id IS NULL

UNION ALL

-- Check OrderItem records with null itemId
SELECT 
  COUNT(*) as null_item_records,
  'OrderItem' as table_name
FROM OrderItem 
WHERE itemId IS NULL

UNION ALL

-- Check Order records with null cartId
SELECT 
  COUNT(*) as null_cart_records,
  'Order' as table_name
FROM Order 
WHERE cartId IS NULL;

-- Step 2: Clean orphan records (safe deletion)

-- Delete orphaned PromotionRedemption records
DELETE FROM PromotionRedemption 
WHERE userId NOT IN (SELECT id FROM User);

-- Delete orphaned Commission records
DELETE FROM Commission 
WHERE storeId NOT IN (SELECT id FROM Store);

-- Delete OrderItem records with null itemId
DELETE FROM OrderItem 
WHERE itemId IS NULL;

-- Step 3: Validate referential integrity

-- Check all foreign key relationships
SELECT 
  tc.TABLE_NAME,
  tc.COLUMN_NAME,
  tc.CONSTRAINT_NAME,
  rc.REFERENCED_TABLE_NAME,
  rc.DELETE_RULE,
  rc.UPDATE_RULE,
  CASE 
    WHEN rc.DELETE_RULE = 'CASCADE' THEN 'OK - Cascades delete'
    WHEN rc.DELETE_RULE = 'SET NULL' THEN 'Warning - Sets null on delete'
    WHEN rc.DELETE_RULE = 'NO ACTION' THEN 'Warning - No action on delete'
    ELSE 'Unknown'
  END as delete_behavior
FROM 
  INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc 
  ON tc.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE 
  tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
  AND tc.TABLE_SCHEMA = DATABASE()
ORDER BY 
  tc.TABLE_NAME, 
  tc.COLUMN_NAME;

-- Step 4: Check for data quality issues

-- Users with invalid data
SELECT 
  COUNT(*) as users_without_name,
  COUNT(*) as users_without_phone,
  COUNT(*) as users_with_invalid_phone
FROM User
WHERE 
  name IS NULL OR 
  phone IS NULL OR 
  phone NOT REGEXP '^[0-9]{10}$';

-- Orders with missing critical data
SELECT 
  COUNT(*) as orders_without_cart,
  COUNT(*) as orders_without_user,
  COUNT(*) as orders_without_store
FROM Order
WHERE 
  cartId IS NULL OR
  userId IS NULL OR
  storeId IS NULL;

-- Step 5: Generate summary report
SELECT 
  'Data Cleanup Summary' as metric,
  COUNT(*) as count
FROM (
  SELECT 'Total Users' as metric, COUNT(*) as count FROM User
  UNION ALL
  SELECT 'Total Orders', COUNT(*) FROM Order
  UNION ALL  
  SELECT 'Total Items', COUNT(*) FROM Item
  UNION ALL
  SELECT 'Total Carts', COUNT(*) FROM Cart
  UNION ALL
  SELECT 'Orphaned Records Fixed', 0 -- This would be updated after cleanup
) as summary;
