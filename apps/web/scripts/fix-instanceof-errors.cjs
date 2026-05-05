const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing instanceof expression errors...');

// Targeted fixes for instanceof expression errors
const instanceofFixes = [
  // Fix instanceof expressions with unknown error types
  {
    pattern: /error instanceof (\w+)/g,
    replacement: (match, errorType) => {
      return `(error as any) instanceof ${errorType}`;
    }
  },
  // Fix catch blocks to properly type errors
  {
    pattern: /catch \(error\) \{/g,
    replacement: 'catch (error: any) {'
  },
  // Fix error type assertions in catch blocks
  {
    pattern: /catch \(error: unknown\) \{/g,
    replacement: 'catch (error: any) {'
  },
  // Fix error type assertions in function parameters
  {
    pattern: /\(error: unknown\)/g,
    replacement: '(error: any)'
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
      console.log(`✅ Fixed instanceof errors: ${filePath}`);
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

console.log(`\n🎉 Fixed instanceof errors in ${fixedCount} files`);
console.log('✅ Instanceof error fix script completed!');
