#!/usr/bin/env node

/**
 * Simple TS4111 Error Fixer
 * 
 * This script fixes the most common TS4111 patterns:
 * - styles.className → styles['className']
 * - obj.property → obj['property']
 */

const fs = require('fs');
const path = require('path');

// Get files with TS4111 errors
const filesWithErrors = [
  'src/features/checkout/components/PaymentSection/PaymentSection.tsx',
  'src/features/search/components/SearchBar/SearchBar.tsx',
  'src/features/stores/components/StoreCard/StoreCard.tsx',
  'src/features/stores/components/StoreHeroCard/StoreHeroCard.tsx',
  'src/features/stores/components/LocationSearch/LocationSearch.tsx',
  'src/features/stores/components/LocationSearch/CityStateInput.tsx',
  'src/layouts/CustomerLayout/CustomerLayout.tsx',
  'src/layouts/VendorLayout/VendorLayout.tsx',
  'src/features/stores/components/StoreMap/services/iconService.ts',
  'src/features/stores/components/StoreMap/services/optimizedIconService.ts',
  'src/utils/form-utilities.ts'
];

// Fix a single file
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return { modified: false, fixes: [] };
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];

  // Pattern 1: styles.className → styles['className']
  const stylesPattern = /styles\.(\w+)/g;
  const originalContent1 = content;
  content = content.replace(stylesPattern, (match, className) => {
    fixes.push(`styles.${className} → styles['${className}']`);
    return `styles['${className}']`;
  });
  if (content !== originalContent1) modified = true;

  // Pattern 2: obj.property → obj['property'] (for specific contexts)
  const objectPattern = /(\w+)\.(\w+)(?=\s*[=;,\)\]}])/g;
  const originalContent2 = content;
  content = content.replace(objectPattern, (match, obj, prop) => {
    // Only apply to specific patterns to avoid false positives
    if (obj === 'filters' || obj === 'data' || obj === 'order' || obj === 'item' || obj === 'store' || obj === 'address' || obj === 'cart' || obj === 'user') {
      fixes.push(`${obj}.${prop} → ${obj}['${prop}']`);
      return `${obj}['${prop}']`;
    }
    return match;
  });
  if (content !== originalContent2) modified = true;

  if (modified) {
    fs.writeFileSync(filePath, content);
    return { modified: true, fixes };
  }

  return { modified: false, fixes: [] };
}

// Main execution
function main() {
  console.log('🔧 Simple TS4111 Error Fixer');
  console.log('============================\n');

  let fixedFiles = 0;
  let totalFixes = 0;
  const allFixes = [];

  for (const file of filesWithErrors) {
    try {
      const result = fixFile(file);
      if (result.modified) {
        fixedFiles++;
        totalFixes += result.fixes.length;
        allFixes.push(...result.fixes);
        console.log(`✓ Fixed ${file}`);
        result.fixes.forEach(fix => console.log(`  - ${fix}`));
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  Files processed: ${filesWithErrors.length}`);
  console.log(`  Files modified: ${fixedFiles}`);
  console.log(`  Total fixes applied: ${totalFixes}`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixFile };
