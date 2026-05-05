const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing syntax errors from index signature fix...');

// Fix syntax errors introduced by the index signature fix
const syntaxFixes = [
  // Fix incorrect bracket notation that broke method calls
  {
    pattern: /(\w+)\['(\w+)'\](\w+)\(/g,
    replacement: '$1.$2$3('
  },
  // Fix incorrect bracket notation for property access that should be method calls
  {
    pattern: /(\w+)\['(\w+)'\]\(/g,
    replacement: (match, obj, prop) => {
      // If it's a known method, use dot notation
      if (['posts', 'stores', 'items', 'carts', 'orders', 'addresses', 'promotions', 'payments', 'users', 'medias'].includes(prop)) {
        return `${obj}.${prop}(`;
      }
      return match;
    }
  },
  // Fix specific problematic patterns
  {
    pattern: /apiClient\['post'\]s\(\)/g,
    replacement: 'apiClient.posts()'
  },
  {
    pattern: /validators\['post'\]List/g,
    replacement: 'validators.postList'
  },
  {
    pattern: /validators\['post'\]Create/g,
    replacement: 'validators.postCreate'
  },
  {
    pattern: /validators\['post'\]Update/g,
    replacement: 'validators.postUpdate'
  },
  {
    pattern: /validators\['post'\]Delete/g,
    replacement: 'validators.postDelete'
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply syntax fixes
    syntaxFixes.forEach(fix => {
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
      console.log(`✅ Fixed syntax errors: ${filePath}`);
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

console.log(`\n🎉 Fixed syntax errors in ${fixedCount} files`);
console.log('✅ Syntax error fix script completed!');
