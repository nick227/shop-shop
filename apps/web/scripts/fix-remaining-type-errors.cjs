const fs = require('fs');
const path = require('path');

// Function to fix common type errors
function fixTypeErrors(content, filePath) {
  let fixes = 0;
  let newContent = content;

  // Fix 1: Remove unused @ts-expect-error directives
  if (newContent.includes('@ts-expect-error')) {
    newContent = newContent.replace(/\/\/ @ts-expect-error.*\n/g, '');
    fixes++;
  }

  // Fix 2: Fix CopyContext.timeOfDay access
  if (newContent.includes('CopyContext.timeOfDay')) {
    newContent = newContent.replace(/CopyContext\.timeOfDay/g, 'CopyContext["timeOfDay"]');
    fixes++;
  }

  // Fix 3: Fix addressIdSnapshot to addressSnapshot
  if (newContent.includes('addressIdSnapshot')) {
    newContent = newContent.replace(/addressIdSnapshot/g, 'addressSnapshot');
    fixes++;
  }

  // Fix 4: Fix string vs number comparisons
  if (newContent.includes('String(') && newContent.includes('=== 1')) {
    newContent = newContent.replace(/String\((\w+)\) === 1/g, '$1 === 1');
    fixes++;
  }

  // Fix 5: Fix type assignments (string to Date, number to string)
  if (newContent.includes('new Date(') && newContent.includes('string')) {
    // This needs manual review - skip for now
  }

  if (newContent.includes('Type \'number\' is not assignable to type \'string\'')) {
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
console.log('🔧 Fixing remaining type errors...\n');

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
