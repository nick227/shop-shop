#!/usr/bin/env node
/**
 * Component Organization Migration Script
 * 
 * Reorganizes components from scattered structure to feature-based architecture
 * 
 * Structure:
 * - components/ui/ → Pure UI primitives (no business logic)
 * - features/[feature]/components/ → Feature-specific components
 * - layouts/ → App-wide layout components
 * - pages/ → Route components only (thin wrappers)
 * 
 * Usage: node migrate-components.js [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose') || DRY_RUN;

const srcPath = path.join(__dirname, 'src');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Migration map: source → destination
const migrations = {
  // UI Components (stay in ui/)
  'components/ui/Alert': 'components/ui/Alert',
  'components/ui/Badge': 'components/ui/Badge',
  'components/ui/Button': 'components/ui/Button',
  'components/ui/Card': 'components/ui/Card',
  'components/ui/Input': 'components/ui/Input',
  'components/ui/Modal': 'components/ui/Modal',
  'components/ui/Spinner': 'components/ui/Spinner',
  'components/ui/Drawer': 'components/ui/Drawer',
  'components/ui/Form': 'components/ui/Form',
  'components/ui/FormField': 'components/ui/FormField',
  'components/ui/Image': 'components/ui/Image',
  'components/ui/Pagination': 'components/ui/Pagination',
  'components/ui/SearchInput': 'components/ui/SearchInput',
  'components/ui/Toast': 'components/ui/Toast',
  'components/ui/DataState': 'components/ui/DataState',
  'components/ui/SkeletonCard': 'components/ui/SkeletonCard',

  // Vendor → UI (generic states)
  'components/vendor/EmptyState': 'components/ui/EmptyState',
  'components/vendor/ErrorState': 'components/ui/ErrorState',
  'components/vendor/LoadingState': 'components/ui/LoadingState',

  // Vendor → Layouts
  'components/vendor/PageHeader': 'layouts/PageHeader',

  // Store Feature
  'components/domain/StoreCard': 'features/stores/components/StoreCard',
  'components/domain/StoreHeader': 'features/stores/components/StoreHeader',
  'components/domain/StoreHeroCard': 'features/stores/components/StoreHeroCard',
  'components/ui/StoreGrid': 'features/stores/components/StoreGrid',
  'components/features/StoreMap': 'features/stores/components/StoreMap',
  'components/features/StoreMapLazy': 'features/stores/components/StoreMapLazy',
  'components/features/LocationSearch': 'features/stores/components/LocationSearch',
  'features/stores/StoreList': 'features/stores/components/StoreList',

  // Cart Feature
  'components/domain/CartItem': 'features/cart/components/CartItem',
  'components/domain/CartItemRow': 'features/cart/components/CartItemRow',
  'components/domain/CartSummary': 'features/cart/components/CartSummary',
  'components/domain/CartWidget': 'features/cart/components/CartWidget',
  'features/cart/CartDrawer': 'features/cart/components/CartDrawer',

  // Order Feature
  'components/domain/OrderCard': 'features/orders/components/OrderCard',
  'components/domain/OrderDetailModal': 'features/orders/components/OrderDetailModal',
  'components/vendor/OrderCountWidget': 'features/orders/components/OrderCountWidget',

  // Item Feature
  'components/domain/ItemCard': 'features/items/components/ItemCard',

  // River Feature
  'components/domain/PostCard': 'features/river/components/PostCard',
  'components/domain/PostActions': 'features/river/components/PostActions',
  'components/domain/PostMedia': 'features/river/components/PostMedia',
  'components/domain/PostCommentList': 'features/river/components/PostCommentList',
  'features/river/PostComposer': 'features/river/components/PostComposer',
  'features/river/RiverFeed': 'features/river/components/RiverFeed',
  'features/river/RiverFilters': 'features/river/components/RiverFilters',
  'features/river/MediaPreview': 'features/river/components/MediaPreview',
  'features/river/MediaUploader': 'features/river/components/MediaUploader',

  // Checkout Feature
  'components/domain/AddressCard': 'features/checkout/components/AddressCard',
  'components/domain/PaymentSection': 'features/checkout/components/PaymentSection',
  'components/domain/TipPrompt': 'features/checkout/components/TipPrompt',

  // Shared/Layout components
  'components/shared/PendingBadge': 'components/ui/PendingBadge',
  'components/shared/SectionHeader': 'components/ui/SectionHeader',
  'components/shared/StatCard': 'components/ui/StatCard',
  'components/Layout': 'layouts/MainLayout',

  // Remove these (deprecated)
  'components/ui/CardStack': null, // No longer used
};

// Track statistics
const stats = {
  moved: 0,
  deleted: 0,
  updated: 0,
  errors: 0,
};

/**
 * Get all TypeScript/TSX files recursively
 */
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Move directory and all its contents
 */
function moveDirectory(from, to) {
  const fromPath = path.join(srcPath, from);
  const toPath = path.join(srcPath, to);

  if (!fs.existsSync(fromPath)) {
    if (VERBOSE) log(`  ⚠️  Source not found: ${from}`, 'yellow');
    return false;
  }

  if (DRY_RUN) {
    log(`  📦 Would move: ${from} → ${to}`, 'blue');
    return true;
  }

  try {
    // Create destination directory
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }

    // Move directory
    fs.renameSync(fromPath, toPath);
    log(`  ✅ Moved: ${from} → ${to}`, 'green');
    stats.moved++;
    return true;
  } catch (error) {
    log(`  ❌ Error moving ${from}: ${error.message}`, 'red');
    stats.errors++;
    return false;
  }
}

/**
 * Delete directory if it's marked for removal
 */
function deleteDirectory(dirPath) {
  const fullPath = path.join(srcPath, dirPath);

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  if (DRY_RUN) {
    log(`  🗑️  Would delete: ${dirPath}`, 'yellow');
    return true;
  }

  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
    log(`  🗑️  Deleted: ${dirPath}`, 'yellow');
    stats.deleted++;
    return true;
  } catch (error) {
    log(`  ❌ Error deleting ${dirPath}: ${error.message}`, 'red');
    stats.errors++;
    return false;
  }
}

/**
 * Update import paths in a file
 */
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Convert migration map to import path changes
    Object.entries(migrations).forEach(([from, to]) => {
      if (!to) return; // Skip deletions

      // Handle various import patterns
      const patterns = [
        // Direct imports: from '../components/domain/StoreCard'
        new RegExp(`from ['"]([./]*)${from.replace(/\//g, '\\/')}(['"])`, 'g'),
        // Named imports: from '@/components/domain/StoreCard'
        new RegExp(`from ['"]@\\/${from.replace(/\//g, '\\/')}(['"])`, 'g'),
      ];

      patterns.forEach((pattern) => {
        const matches = content.match(pattern);
        if (matches) {
          // Calculate relative path from current file to new location
          const relativeFrom = path.relative(path.dirname(filePath), path.join(srcPath, from));
          const relativeTo = path.relative(path.dirname(filePath), path.join(srcPath, to));

          content = content.replace(pattern, (match, prefix, suffix) => {
            updated = true;
            
            // Preserve @ alias imports
            if (match.includes('@/')) {
              return `from '@/${to}'`;
            }
            
            // Update relative imports
            let newPath = relativeTo;
            if (!newPath.startsWith('.')) {
              newPath = './' + newPath;
            }
            return `from '${newPath}'`;
          });
        }
      });
    });

    if (updated) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf8');
        stats.updated++;
      }
      if (VERBOSE) {
        const relPath = path.relative(srcPath, filePath);
        log(`  📝 ${DRY_RUN ? 'Would update' : 'Updated'}: ${relPath}`, 'cyan');
      }
    }

    return updated;
  } catch (error) {
    log(`  ❌ Error updating ${filePath}: ${error.message}`, 'red');
    stats.errors++;
    return false;
  }
}

/**
 * Clean up empty directories
 */
function cleanupEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  
  if (files.length === 0) {
    if (DRY_RUN) {
      log(`  🧹 Would remove empty dir: ${path.relative(srcPath, dir)}`, 'yellow');
    } else {
      fs.rmdirSync(dir);
      log(`  🧹 Removed empty dir: ${path.relative(srcPath, dir)}`, 'yellow');
    }
    return;
  }

  // Recursively check subdirectories
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      cleanupEmptyDirs(filePath);
    }
  });

  // Check again after cleaning subdirectories
  if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
    if (DRY_RUN) {
      log(`  🧹 Would remove empty dir: ${path.relative(srcPath, dir)}`, 'yellow');
    } else {
      fs.rmdirSync(dir);
      log(`  🧹 Removed empty dir: ${path.relative(srcPath, dir)}`, 'yellow');
    }
  }
}

/**
 * Main migration function
 */
function migrate() {
  log('\n🚀 Component Organization Migration', 'cyan');
  log('=====================================\n', 'cyan');

  if (DRY_RUN) {
    log('🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  // Step 1: Move components
  log('📦 Step 1: Moving components...', 'blue');
  Object.entries(migrations).forEach(([from, to]) => {
    if (to === null) {
      deleteDirectory(from);
    } else if (from !== to) {
      moveDirectory(from, to);
    }
  });

  // Step 2: Update imports in all files
  log('\n📝 Step 2: Updating import paths...', 'blue');
  const allFiles = getAllFiles(srcPath);
  let updatedCount = 0;

  allFiles.forEach((file) => {
    if (updateImports(file)) {
      updatedCount++;
    }
  });

  if (!VERBOSE && updatedCount > 0) {
    log(`  ✅ Updated imports in ${updatedCount} files`, 'green');
  }

  // Step 3: Clean up empty directories
  log('\n🧹 Step 3: Cleaning up empty directories...', 'blue');
  cleanupEmptyDirs(path.join(srcPath, 'components/domain'));
  cleanupEmptyDirs(path.join(srcPath, 'components/features'));
  cleanupEmptyDirs(path.join(srcPath, 'components/vendor'));
  cleanupEmptyDirs(path.join(srcPath, 'components/shared'));

  // Step 4: Update barrel exports
  log('\n📦 Step 4: Creating feature barrel exports...', 'blue');
  const features = ['stores', 'cart', 'orders', 'items', 'river', 'checkout'];
  
  features.forEach((feature) => {
    const featurePath = path.join(srcPath, 'features', feature);
    const componentsPath = path.join(featurePath, 'components');
    
    if (fs.existsSync(componentsPath)) {
      const indexPath = path.join(componentsPath, 'index.ts');
      
      if (!fs.existsSync(indexPath) && !DRY_RUN) {
        const componentDirs = fs.readdirSync(componentsPath).filter((file) => {
          return fs.statSync(path.join(componentsPath, file)).isDirectory();
        });
        
        const exports = componentDirs
          .map((dir) => `export * from './${dir}'`)
          .join('\n');
        
        fs.writeFileSync(indexPath, exports + '\n', 'utf8');
        log(`  ✅ Created: features/${feature}/components/index.ts`, 'green');
      }
    }
  });

  // Print summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 Migration Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`✅ Components moved: ${stats.moved}`, 'green');
  log(`🗑️  Components deleted: ${stats.deleted}`, 'yellow');
  log(`📝 Files updated: ${stats.updated}`, 'cyan');
  log(`❌ Errors: ${stats.errors}`, stats.errors > 0 ? 'red' : 'green');
  log('='.repeat(50) + '\n', 'cyan');

  if (DRY_RUN) {
    log('💡 Run without --dry-run to apply changes', 'yellow');
  } else {
    log('✨ Migration complete!', 'green');
    log('\n📋 Next steps:', 'cyan');
    log('  1. Run: npm run lint', 'blue');
    log('  2. Run: npm run type-check', 'blue');
    log('  3. Test the application', 'blue');
    log('  4. Commit changes\n', 'blue');
  }
}

// Run migration
try {
  migrate();
} catch (error) {
  log(`\n❌ Migration failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

