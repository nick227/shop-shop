#!/usr/bin/env node

/**
 * Safe batch fix for common TypeScript syntax errors
 * Only fixes well-understood patterns to avoid regressions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get all TypeScript files with errors
function getFilesWithErrors() {
  try {
    const output = execSync('npm run typecheck 2>&1', { encoding: 'utf8' });
    const lines = output.split('\n');
    const files = new Set();
    
    lines.forEach(line => {
      if (line.includes('error TS') && 
          !line.includes('packages/sdk') && 
          !line.includes('packages/schemas') &&
          line.includes('.tsx') || line.includes('.ts')) {
        const match = line.match(/src\/([^:]+)/);
        if (match) {
          files.add(match[1]);
        }
      }
    });
    
    return Array.from(files);
  } catch (error) {
    console.log('Could not get error files, using manual list');
    return [];
  }
}

// Safe fixes - only target well-understood patterns
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix 1: Remove semicolons from JSX tags (e.g., <Button; -> <Button)
  const jsxTagFix = content.replace(/<(\w+);/g, '<$1');
  if (jsxTagFix !== content) {
    content = jsxTagFix;
    changed = true;
    console.log(`  Fixed JSX tag semicolons in ${filePath}`);
  }

  // Fix 2: Remove semicolons from function parameters (e.g., className; -> className)
  const paramFix = content.replace(/(\w+);\s*$/gm, '$1');
  if (paramFix !== content) {
    content = paramFix;
    changed = true;
    console.log(`  Fixed function parameter semicolons in ${filePath}`);
  }

  // Fix 3: Remove semicolons from JSX content (e.g., ← Previous; -> ← Previous)
  const jsxContentFix = content.replace(/([^;]+);\s*<\/\w+>/g, '$1');
  if (jsxContentFix !== content) {
    content = jsxContentFix;
    changed = true;
    console.log(`  Fixed JSX content semicolons in ${filePath}`);
  }

  // Fix 4: Fix malformed template literals (e.g., className; -> className)
  const templateFix = content.replace(/(\w+);\s*\)/g, '$1)');
  if (templateFix !== content) {
    content = templateFix;
    changed = true;
    console.log(`  Fixed template literal semicolons in ${filePath}`);
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

// Main execution
console.log('🔧 Starting safe batch syntax fixes...');

const files = getFilesWithErrors();
let fixedCount = 0;

files.forEach(file => {
  const fullPath = path.join('src', file);
  console.log(`\n📁 Processing: ${fullPath}`);
  
  if (fixFile(fullPath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Batch fix complete! Fixed ${fixedCount} files.`);
console.log('🔍 Run typecheck to verify results...');
