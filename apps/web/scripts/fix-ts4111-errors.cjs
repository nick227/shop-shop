#!/usr/bin/env node

/**
 * Fix TS4111 errors (Index signature access)
 * 
 * This script specifically targets TS4111 errors by converting
 * obj.property to obj['property'] for index signature access.
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

// Fix TS4111 errors in a file
function fixTS4111Errors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];
  
  // Pattern 1: obj.property where obj is from index signature
  // This is more complex and needs to be done carefully
  const patterns = [
    // Common patterns for index signature access
    {
      name: 'feesJson property access',
      pattern: /feesJson\?\.(\w+)/g,
      replacement: 'feesJson?.[\'$1\']',
      description: 'Fix feesJson property access'
    },
    {
      name: 'data property access',
      pattern: /data\.(\w+)/g,
      replacement: 'data[\'$1\']',
      description: 'Fix data property access',
      condition: (match, file) => {
        // Only apply in specific contexts
        return file.includes('dto.generator') || 
               file.includes('promotion.dto') ||
               file.includes('type-transformers');
      }
    },
    {
      name: 'filters property access',
      pattern: /filters\.(\w+)/g,
      replacement: 'filters[\'$1\']',
      description: 'Fix filters property access',
      condition: (match, file) => {
        return file.includes('dto.generator') || 
               file.includes('promotion.dto');
      }
    },
    {
      name: 'headers property access',
      pattern: /headers\.(\w+)/g,
      replacement: 'headers[\'$1\']',
      description: 'Fix headers property access',
      condition: (match, file) => {
        return file.includes('test') || file.includes('config');
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
  console.log('🔧 TS4111 Error Fixer (Index Signature Access)');
  console.log('==============================================\n');
  
  const files = getFilesToProcess();
  console.log(`Found ${files.length} TypeScript files to process\n`);
  
  let fixedFiles = 0;
  let totalFixes = 0;
  const allFixes = [];
  
  for (const file of files) {
    try {
      const result = fixTS4111Errors(file);
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

module.exports = { fixTS4111Errors, getFilesToProcess };
