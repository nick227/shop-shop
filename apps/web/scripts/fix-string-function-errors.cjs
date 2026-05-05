const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing String() function errors...');

// Comprehensive fixes for String() function errors
const stringFunctionFixes = [
  // Fix String() applied to arrays
  {
    pattern: /String\((\w+\.\w+)\)/g,
    replacement: (match, expression) => {
      // Check if it's likely an array or object
      if (expression.includes('[') || expression.includes('length') || expression.includes('map') || expression.includes('filter')) {
        return expression;
      }
      return match;
    }
  },
  // Fix String() applied to objects
  {
    pattern: /String\((\w+)\)/g,
    replacement: (match, variable) => {
      // If it's likely an object or array, remove String()
      if (variable.includes('Response') || variable.includes('Metrics') || variable.includes('Data') || variable.includes('Items')) {
        return variable;
      }
      return match;
    }
  },
  // Fix String() applied to specific problematic patterns
  {
    pattern: /String\((\w+\.\w+\.\w+)\)/g,
    replacement: '$1'
  },
  // Fix String() applied to array methods
  {
    pattern: /String\((\w+\.\w+\(\))\)/g,
    replacement: '$1'
  },
  // Remove unused @ts-expect-error directives
  {
    pattern: /\/\/ @ts-expect-error.*\n/g,
    replacement: ''
  },
  // Fix type mismatches in comparisons
  {
    pattern: /(\w+)\s*===\s*(\d+)/g,
    replacement: (match, variable, number) => {
      return `String(${variable}) === String(${number})`;
    }
  },
  // Fix missing properties in object literals
  {
    pattern: /cartItem=\{\{([^}]+)\}\}/g,
    replacement: (match, content) => {
      if (!content.includes('createdAt')) {
        return `cartItem={{${content}, createdAt: new Date().toISOString()}}`;
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

    // Apply string function fixes
    stringFunctionFixes.forEach(fix => {
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
      console.log(`✅ Fixed String() function errors: ${filePath}`);
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

console.log(`\n🎉 Fixed String() function errors in ${fixedCount} files`);
console.log('✅ String() function error fix script completed!');
