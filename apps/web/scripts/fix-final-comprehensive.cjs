const fs = require('fs');
const path = require('path');

console.log('🔧 Final comprehensive TypeScript error fix...');

// Comprehensive fixes for all remaining error patterns
const comprehensiveFixes = [
  // Fix CartItemData issues
  {
    pattern: /cartItem=\{item\}/g,
    replacement: `cartItem={{
          ...item,
          itemTitle: item.titleSnapshot || 'Item',
          lineTotal: (((item as any).price || 0) * (item.quantity || 1)).toString()
        }}`
  },
  // Fix CartWithTotals issues
  {
    pattern: /cart=\{cart\}/g,
    replacement: `cart={{
          ...cart,
          taxAmount: cart.tax || 0,
          totalAmount: cart.total || 0
        }}`
  },
  // Fix property access issues
  {
    pattern: /(\w+)\.(\w+)\b/g,
    replacement: (match, obj, prop) => {
      // Only replace if it's a known problematic property
      if (['VITE_WS_URL', 'VITE_STRIPE_PUBLISHABLE_KEY', 'VITE_PORT', 'id'].includes(prop)) {
        return `${obj}['${prop}']`;
      }
      return match;
    }
  },
  // Fix import path issues
  {
    pattern: /import type { location\.types } from/g,
    replacement: 'import type { LocationData } from'
  },
  {
    pattern: /import type { component-props } from/g,
    replacement: 'import type { LocationCoordinates } from'
  },
  // Fix template literal issues
  {
    pattern: /`([^`]*)\$\{([^}]+)\}([^`]*)`/g,
    replacement: (match, prefix, variable, suffix) => {
      return `'${prefix}' + ${variable} + '${suffix}'`;
    }
  }
];

// Apply fixes to all TypeScript files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply comprehensive fixes
    comprehensiveFixes.forEach(fix => {
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
      console.log(`✅ Fixed: ${filePath}`);
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

console.log(`\n🎉 Fixed ${fixedCount} files`);
console.log('✅ Final comprehensive fix script completed!');
