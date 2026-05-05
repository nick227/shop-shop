# Database Migration Checklist

## 🚨 Pre-Migration Requirements

### 1. Backup Database
```bash
# Create full backup
mysqldump -u username -p database_name > backup_before_integrity_fixes.sql

# Verify backup integrity
mysql -u username -p database_name < backup_before_integrity_fixes.sql
```

### 2. Run Data Cleanup Script
```bash
# Execute cleanup script
mysql -u username -p database_name < scripts/data-cleanup.sql

# Review cleanup results
# Check for any remaining orphan records
```

### 3. Validate Current State
```sql
-- Verify no orphan records exist
SELECT COUNT(*) FROM PromotionRedemption pr 
LEFT JOIN User u ON pr.userId = u.id 
WHERE u.id IS NULL;

SELECT COUNT(*) FROM Commission c
LEFT JOIN Store s ON c.storeId = s.id 
WHERE s.id IS NULL;
```

## 📋 Migration Execution Order

### Migration 001: Fix Foreign Keys
- **File**: `migrations/001_fix_foreign_keys.sql`
- **Purpose**: Add missing foreign key constraints
- **Risk**: Low (after cleanup)
- **Rollback**: Drop added constraints

### Migration 002: Make Fields Required  
- **File**: `migrations/002_make_fields_required.sql`
- **Purpose**: Enforce NOT NULL on critical fields
- **Risk**: Medium (data validation required)
- **Rollback**: Allow NULL values again

### Migration 003: Standardize Delete Behaviors
- **File**: `migrations/003_standardize_delete_behaviors.sql`
- **Purpose**: Consistent CASCADE behavior
- **Risk**: Low (behavior change only)
- **Rollback**: Restore original constraints

## ⚠️ Risk Mitigation

### High Risk Operations
1. **Making User.name/phone required**
   - Ensure all users have valid data
   - Provide defaults for missing values
   - Test application behavior

2. **Making Order.cartId required**
   - May require business logic changes
   - Consider if this is truly required
   - Alternative: Keep nullable but validate in code

### Medium Risk Operations
1. **Changing delete behaviors to CASCADE**
   - Test cascading deletes thoroughly
   - Ensure no unintended data loss
   - Document behavior changes

## ✅ Post-Migration Validation

### 1. Verify Schema Changes
```sql
-- Check all constraints are in place
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('User', 'Order', 'OrderItem', 'PromotionRedemption', 'Commission');
```

### 2. Test Application Functionality
- [ ] User registration still works
- [ ] Order creation still works
- [ ] Cart management still works
- [ ] Commission tracking still works
- [ ] Promotion redemption still works

### 3. Performance Check
```sql
-- Check query performance with new constraints
EXPLAIN SELECT * FROM Order WHERE userId = 'test-id';
EXPLAIN SELECT * FROM Commission WHERE storeId = 'test-store-id';
```

## 🔄 Rollback Plan

### If Migration Fails
1. **Stop immediately** at point of failure
2. **Assess impact** on current data
3. **Execute rollback** scripts in reverse order
4. **Restore from backup** if necessary

### Rollback Scripts
```sql
-- Migration 003 rollback
-- (Restore original delete behaviors)

-- Migration 002 rollback  
-- (Allow NULL values again)

-- Migration 001 rollback
-- (Drop added foreign keys)
```

## 📊 Success Metrics

### Before Migration
- Orphan records: [count]
- NULL critical fields: [count]
- Inconsistent delete behaviors: [count]

### After Migration
- Orphan records: 0
- NULL critical fields: 0  
- Consistent delete behaviors: 100%

## 🚀 Next Steps

1. **Schedule maintenance window**
2. **Communicate changes** to development team
3. **Update application code** if needed for new constraints
4. **Monitor performance** after migration
5. **Update documentation** with new schema rules

## 📞 Emergency Contacts

- **Database Admin**: [contact]
- **Lead Developer**: [contact]  
- **DevOps**: [contact]

## 📝 Notes

- All migrations are designed to be reversible
- Data cleanup script must run before migrations
- Application testing required after each migration
- Monitor error logs during migration process
