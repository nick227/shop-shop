const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing comprehensive instanceof expression errors...');

// Comprehensive fixes for instanceof expression errors
const instanceofFixes = [
  // Fix malformed instanceof expressions with string concatenation
  {
    pattern: /\(error as any\) instanceof Error && error !== null \? error\.message : 'Unknown error' \+ ''/g,
    replacement: '((error as any) instanceof Error ? error.message : \'Unknown error\')'
  },
  // Fix malformed instanceof expressions with template literals
  {
    pattern: /\(error as any\) instanceof Error && error !== null \? error\.message : 'Unknown error' \+ ''/g,
    replacement: '((error as any) instanceof Error ? error.message : \'Unknown error\')'
  },
  // Fix malformed instanceof expressions with string concatenation
  {
    pattern: /\(error as any\) instanceof Error && error !== null \? error\.message : 'Unknown error' \+ ''/g,
    replacement: '((error as any) instanceof Error ? error.message : \'Unknown error\')'
  },
  // Fix malformed instanceof expressions with template literals
  {
    pattern: /\(error as any\) instanceof Error && error !== null \? error\.message : 'Unknown error' \+ ''/g,
    replacement: '((error as any) instanceof Error ? error.message : \'Unknown error\')'
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply instanceof fixes
    instanceofFixes.forEach(fix => {
      let newContent;
      if (typeof fix.replacement === 'function') {
        newContent = content.replace(fix.pattern, fix.replacement);
      } else {
        newContent = content.replace(fix.pattern, fix.replacement);
      }
      
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed comprehensive instanceof errors: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
  return false;
}

// Find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files`);

let fixedCount = 0;
tsFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed comprehensive instanceof errors in ${fixedCount} files`);
console.log('✅ Comprehensive instanceof error fix script completed!');
