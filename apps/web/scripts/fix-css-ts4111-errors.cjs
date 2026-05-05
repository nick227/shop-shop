#!/usr/bin/env node

/**
 * Fix TS4111 errors for CSS class access patterns
 * 
 * This script specifically targets CSS class access patterns like:
 * styles.className → styles['className']
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files
function getFilesToProcess() {
  const files = [];
  
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', 'coverage', 'playwright-report', 'test-results'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir('src');
  return files;
}

// Fix CSS class access patterns
function fixCSSAccessPatterns(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];
  
  // Common CSS class access patterns
  const patterns = [
    // styles.className patterns
    {
      name: 'CSS class access',
      pattern: /(\w+)\.(\w+)(?=\s*[=;,\)\]}])/g,
      replacement: '$1[\'$2\']',
      description: 'Fix CSS class access from index signature',
      condition: (match, file) => {
        // Only apply to specific contexts where we know it's CSS class access
        const context = match.input.substring(Math.max(0, match.index - 50), match.index + 50);
        return context.includes('styles.') || 
               context.includes('className') ||
               context.includes('classNames') ||
               context.includes('tw.') ||
               context.includes('cn(') ||
               file.includes('PaymentSection') ||
               file.includes('SearchBar') ||
               file.includes('StoreCard') ||
               file.includes('StoreHeroCard') ||
               file.includes('LocationSearch') ||
               file.includes('CustomerLayout') ||
               file.includes('VendorLayout') ||
               file.includes('StoreMap') ||
               file.includes('form-utilities');
      }
    },
    // Object property access patterns
    {
      name: 'Object property access',
      pattern: /(\w+)\.(\w+)(?=\s*[=;,\)\]}])/g,
      replacement: '$1[\'$2\']',
      description: 'Fix object property access from index signature',
      condition: (match, file) => {
        const context = match.input.substring(Math.max(0, match.index - 50), match.index + 50);
        return context.includes('filters.') ||
               context.includes('data.') ||
               context.includes('order.') ||
               context.includes('item.') ||
               context.includes('store.') ||
               context.includes('address.') ||
               context.includes('cart.') ||
               context.includes('user.') ||
               file.includes('form-utilities') ||
               file.includes('type-transformers') ||
               file.includes('validation');
      }
    }
  ];
  
  for (const pattern of patterns) {
    const originalContent = content;
    
    if (pattern.condition) {
      // Apply with condition
      content = content.replace(pattern.pattern, (match, ...args) => {
        if (pattern.condition(match, filePath, ...args)) {
          const result = match.replace(pattern.pattern, pattern.replacement);
          fixes.push(`${pattern.name}: ${match} → ${result}`);
          return result;
        }
        return match;
      });
    } else {
      // Apply without condition
      content = content.replace(pattern.pattern, pattern.replacement);
    }
    
    if (content !== originalContent) {
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    return { modified: true, fixes };
  }
  
  return { modified: false, fixes: [] };
}

// Main execution
function main() {
  console.log('🔧 CSS TS4111 Error Fixer (Index Signature Access)');
  console.log('==================================================\n');
  
  const files = getFilesToProcess();
  console.log(`Found ${files.length} TypeScript files to process\n`);
  
  let fixedFiles = 0;
  let totalFixes = 0;
  const allFixes = [];
  
  for (const file of files) {
    try {
      const result = fixCSSAccessPatterns(file);
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
  console.log(`  Files processed: ${files.length}`);
  console.log(`  Files modified: ${fixedFiles}`);
  console.log(`  Total fixes applied: ${totalFixes}`);
  
  if (fixedFiles > 0) {
    console.log('\n🔍 Running type check to see improvements...');
    try {
      execSync('npm run typecheck', { stdio: 'inherit' });
    } catch (error) {
      console.log('Type check completed with remaining errors (expected)');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixCSSAccessPatterns, getFilesToProcess };
