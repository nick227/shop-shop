const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing syntax errors from previous script...');

// Fix specific syntax errors
const syntaxFixes = [
  // Fix import statements that were incorrectly modified
  {
    pattern: /import type { component-props } from/g,
    replacement: 'import type { LocationCoordinates } from'
  },
  // Fix property access that was incorrectly modified
  {
    pattern: /(\w+)\?\[['"]id['"]\]/g,
    replacement: '$1?.id'
  },
  {
    pattern: /(\w+)\[['"]id['"]\]/g,
    replacement: '$1.id'
  },
  // Fix other property access issues
  {
    pattern: /(\w+)\?\[['"](\w+)['"]\]/g,
    replacement: '$1?.$2'
  },
  {
    pattern: /(\w+)\[['"](\w+)['"]\]/g,
    replacement: '$1.$2'
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply syntax fixes
    syntaxFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed syntax: ${filePath}`);
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

console.log(`\n🎉 Fixed syntax in ${fixedCount} files`);
console.log('✅ Syntax error fix script completed!');