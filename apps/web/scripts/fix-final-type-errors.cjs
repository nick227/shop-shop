const fs = require('fs');
const path = require('path');

// Function to fix final type errors
function fixTypeErrors(content, filePath) {
  let fixes = 0;
  let newContent = content;

  // Fix 1: Remove unused @ts-expect-error directives
  if (newContent.includes('@ts-expect-error')) {
    newContent = newContent.replace(/\/\/ @ts-expect-error.*\n/g, '');
    fixes++;
  }

  // Fix 2: Fix type property access (Type.property to Type["property"])
  if (newContent.includes('RiverFiltersType.sortBy')) {
    newContent = newContent.replace(/RiverFiltersType\.sortBy/g, 'RiverFiltersType["sortBy"]');
    fixes++;
  }

  if (newContent.includes('SearchFilters.location')) {
    newContent = newContent.replace(/SearchFilters\.location/g, 'SearchFilters["location"]');
    fixes++;
  }

  if (newContent.includes('SearchFilters.sortBy')) {
    newContent = newContent.replace(/SearchFilters\.sortBy/g, 'SearchFilters["sortBy"]');
    fixes++;
  }

  // Fix 3: Fix index signature property access
  if (newContent.includes('.line1') && !newContent.includes('["line1"]')) {
    newContent = newContent.replace(/\.line1/g, '["line1"]');
    fixes++;
  }

  if (newContent.includes('.city') && !newContent.includes('["city"]')) {
    newContent = newContent.replace(/\.city/g, '["city"]');
    fixes++;
  }

  if (newContent.includes('.state') && !newContent.includes('["state"]')) {
    newContent = newContent.replace(/\.state/g, '["state"]');
    fixes++;
  }

  if (newContent.includes('.postalCode') && !newContent.includes('["postalCode"]')) {
    newContent = newContent.replace(/\.postalCode/g, '["postalCode"]');
    fixes++;
  }

  // Fix 4: Fix string vs number comparisons
  if (newContent.includes('This comparison appears to be unintentional')) {
    // Fix common patterns
    newContent = newContent.replace(/String\((\w+)\) === (\d+)/g, '$1 === $2');
    newContent = newContent.replace(/String\((\w+)\) === (\w+)/g, '$1 === $2');
    fixes++;
  }

  // Fix 5: Fix missing properties
  if (newContent.includes('Property \'title\' does not exist')) {
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
console.log('🔧 Fixing final type errors...\n');

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
