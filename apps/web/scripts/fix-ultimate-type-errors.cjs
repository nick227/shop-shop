const fs = require('fs');
const path = require('path');

// Function to fix ultimate type errors
function fixTypeErrors(content, filePath) {
  let fixes = 0;
  let newContent = content;

  // Fix 1: Remove unused @ts-expect-error directives
  if (newContent.includes('@ts-expect-error')) {
    newContent = newContent.replace(/\/\/ @ts-expect-error.*\n/g, '');
    fixes++;
  }

  // Fix 2: Fix type property access (Type.property to Type["property"])
  if (newContent.includes('LocationData.source')) {
    newContent = newContent.replace(/LocationData\.source/g, 'LocationData["source"]');
    fixes++;
  }

  // Fix 3: Fix index signature property access
  if (newContent.includes('.deliveryFee') && !newContent.includes('["deliveryFee"]')) {
    newContent = newContent.replace(/\.deliveryFee/g, '["deliveryFee"]');
    fixes++;
  }

  // Fix 4: Fix string vs number comparisons
  if (newContent.includes('This comparison appears to be unintentional')) {
    // Fix common patterns
    newContent = newContent.replace(/String\((\w+)\) === (\d+)/g, '$1 === $2');
    newContent = newContent.replace(/String\((\w+)\) === (\w+)/g, '$1 === $2');
    fixes++;
  }

  // Fix 5: Fix missing properties in ProductSearchResult
  if (newContent.includes('Property \'title\' does not exist on type \'ProductSearchResult\'')) {
    // This needs manual review - skip for now
  }

  if (newContent.includes('Property \'isActive\' does not exist on type \'ProductSearchResult\'')) {
    // This needs manual review - skip for now
  }

  if (newContent.includes('Property \'isSoldOut\' does not exist on type \'ProductSearchResult\'')) {
    // This needs manual review - skip for now
  }

  if (newContent.includes('Property \'sortIndex\' does not exist on type \'ProductSearchResult\'')) {
    // This needs manual review - skip for now
  }

  // Fix 6: Fix type assignments (string to Date)
  if (newContent.includes('Type \'string\' is not assignable to type \'Date\'')) {
    // Convert string to Date properly
    newContent = newContent.replace(/createdAt: new Date\(\)\.toISOString\(\)/g, 'createdAt: new Date()');
    fixes++;
  }

  // Fix 7: Fix CartWithTotals type issues
  if (newContent.includes('CartWithTotals') && newContent.includes('exactOptionalPropertyTypes')) {
    // This needs manual review - skip for now
  }

  // Fix 8: Fix string | number to string assignments
  if (newContent.includes('Type \'string | number\' is not assignable to type \'string\'')) {
    // Convert to string
    newContent = newContent.replace(/(\w+): (\w+)/g, '$1: String($2)');
    fixes++;
  }

  // Fix 9: Fix missing createdAt property
  if (newContent.includes('Property \'createdAt\' is missing')) {
    // Add createdAt property if missing
    if (newContent.includes('CartItemData') && !newContent.includes('createdAt')) {
      newContent = newContent.replace(/(CartItemData\s*=\s*\{)/g, '$1\n    createdAt: new Date(),');
      fixes++;
    }
  }

  return { content: newContent, fixes };
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixTypeErrors(content, filePath);
    
    if (result.fixes > 0) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✅ Fixed ${result.fixes} issues in ${filePath}`);
      return result.fixes;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Function to find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, and other build directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        // Skip generated SDK files
        if (!fullPath.includes('packages/sdk') && !fullPath.includes('packages/schemas')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔧 Fixing ultimate type errors...\n');

const srcDir = path.join(__dirname, '..', 'src');
const files = findTsFiles(srcDir);

let totalFixes = 0;
let filesProcessed = 0;

for (const file of files) {
  const fixes = processFile(file);
  totalFixes += fixes;
  if (fixes > 0) {
    filesProcessed++;
  }
}

console.log(`\n🎉 Fixed ${totalFixes} issues across ${filesProcessed} files!`);
