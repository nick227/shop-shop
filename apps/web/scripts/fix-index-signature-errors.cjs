const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing index signature property access errors...');

// Fix property access with index signatures
const indexSignatureFixes = [
  // Fix property access that should use bracket notation
  {
    pattern: /(\w+)\.(securityBadges|securityBadge|methods|methodOption|page|limit|storeId|status|validFrom|validUntil|pre|post|body|cache|credentials|headers|integrity|keepalive|method|redirect|referrer|referrerPolicy|signal|window)/g,
    replacement: (match, obj, prop) => {
      return `${obj}['${prop}']`;
    }
  },
  // Fix specific patterns that are commonly problematic
  {
    pattern: /(\w+)\.(\w+)(\s*=\s*)/g,
    replacement: (match, obj, prop, assignment) => {
      // Only fix if it's a known problematic property
      if (['securityBadges', 'securityBadge', 'methods', 'methodOption', 'page', 'limit', 'storeId', 'status', 'validFrom', 'validUntil'].includes(prop)) {
        return `${obj}['${prop}']${assignment}`;
      }
      return match;
    }
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply index signature fixes
    indexSignatureFixes.forEach(fix => {
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
      console.log(`✅ Fixed index signature errors: ${filePath}`);
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

console.log(`\n🎉 Fixed index signature errors in ${fixedCount} files`);
console.log('✅ Index signature error fix script completed!');
