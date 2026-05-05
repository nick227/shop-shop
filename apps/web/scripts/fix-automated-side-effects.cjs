const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing automated script side effects...');

// Comprehensive fixes for automated script side effects
const sideEffectFixes = [
  // Fix unterminated string literals in template strings
  {
    pattern: /html:\s*'([^']*)\$\{([^}]+)\}([^']*)\s*$/gm,
    replacement: (match, prefix, variable, suffix) => {
      return `html: '${prefix}' + ${variable} + '${suffix}'`;
    }
  },
  // Fix malformed template literals with unterminated strings
  {
    pattern: /html:\s*`([^`]*)\$\{([^}]+)\}([^`]*)\s*$/gm,
    replacement: (match, prefix, variable, suffix) => {
      return `html: '${prefix}' + ${variable} + '${suffix}'`;
    }
  },
  // Fix unterminated string literals with stray characters
  {
    pattern: /html:\s*'([^']*)\$\{([^}]+)\}([^']*)\s*$/gm,
    replacement: (match, prefix, variable, suffix) => {
      return `html: '${prefix}' + ${variable} + '${suffix}'`;
    }
  },
  // Fix malformed className with template literals
  {
    pattern: /className=\{`([^`]*)\$\{([^}]+)\}([^`]*)`\}/g,
    replacement: (match, prefix, variable, suffix) => {
      return `className={'${prefix}' + ${variable} + '${suffix}'}`;
    }
  },
  // Fix malformed className with string concatenation
  {
    pattern: /className=\{`([^`]*)`\s*\+\s*([^}]+)\s*\+\s*`([^`]*)`\}/g,
    replacement: (match, prefix, variable, suffix) => {
      return `className={'${prefix}' + ${variable} + '${suffix}'}`;
    }
  },
  // Fix stray characters and unterminated strings
  {
    pattern: /html:\s*'([^']*)\$\{([^}]+)\}([^']*)\s*$/gm,
    replacement: (match, prefix, variable, suffix) => {
      return `html: '${prefix}' + ${variable} + '${suffix}'`;
    }
  },
  // Fix malformed object properties
  {
    pattern: /(\w+):\s*'([^']*)\$\{([^}]+)\}([^']*)'\s*$/gm,
    replacement: (match, prop, prefix, variable, suffix) => {
      return `${prop}: '${prefix}' + ${variable} + '${suffix}'`;
    }
  },
  // Fix malformed function calls
  {
    pattern: /(\w+)\(`([^`]*)\$\{([^}]+)\}([^`]*)`\)/g,
    replacement: (match, func, prefix, variable, suffix) => {
      return `${func}('${prefix}' + ${variable} + '${suffix}')`;
    }
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply side effect fixes
    sideEffectFixes.forEach(fix => {
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
      console.log(`✅ Fixed side effects: ${filePath}`);
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

console.log(`\n🎉 Fixed side effects in ${fixedCount} files`);
console.log('✅ Automated side effects fix script completed!');
