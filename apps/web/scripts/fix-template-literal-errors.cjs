const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing template literal errors...');

// Fix template literal errors
const templateLiteralFixes = [
  // Fix malformed template literals in className attributes
  {
    pattern: /className={styles\['(\w+)'\](\w+)}/g,
    replacement: "className={styles.$1$2}"
  },
  // Fix malformed template literals in other contexts
  {
    pattern: /(\w+)\['(\w+)'\](\w+)/g,
    replacement: (match, obj, prop, suffix) => {
      // Only fix if it's a known problematic pattern
      if (['styles', 'current', 'sum', 'acc', 'metric'].includes(obj)) {
        return `${obj}.${prop}${suffix}`;
      }
      return match;
    }
  },
  // Fix specific problematic patterns
  {
    pattern: /styles\['method'\]Content/g,
    replacement: 'styles.methodContent'
  },
  {
    pattern: /styles\['method'\]Header/g,
    replacement: 'styles.methodHeader'
  },
  {
    pattern: /styles\['method'\]Icon/g,
    replacement: 'styles.methodIcon'
  },
  {
    pattern: /styles\['method'\]Name/g,
    replacement: 'styles.methodName'
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply template literal fixes
    templateLiteralFixes.forEach(fix => {
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
      console.log(`✅ Fixed template literal errors: ${filePath}`);
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

console.log(`\n🎉 Fixed template literal errors in ${fixedCount} files`);
console.log('✅ Template literal error fix script completed!');
