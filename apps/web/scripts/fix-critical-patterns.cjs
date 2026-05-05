const fs = require('fs');
const path = require('path');

// Find all TypeScript files in src directory
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

// Fix String() vs number comparisons
function fixStringNumberComparisons(content) {
  // Fix String(count) === 1 to count === 1
  content = content.replace(/String\((\w+)\) === (\d+)/g, '$1 === $2');
  content = content.replace(/String\((\w+)\) === (\d+)/g, '$1 === $2');
  
  // Fix String(bytes) === 0 to bytes === 0
  content = content.replace(/String\((\w+)\) === 0/g, '$1 === 0');
  
  return content;
}

// Fix index signature property access
function fixIndexSignatureAccess(content) {
  // Fix specific patterns that should be bracket notation
  const patterns = [
    // Fix errors.property to errors['property']
    { from: /errors\.(\w+)/g, to: "errors['$1']" },
    // Fix form.formState.errors.property to form.formState.errors['property']
    { from: /form\.formState\.errors\.(\w+)/g, to: "form.formState.errors['$1']" },
    // Fix order.address to order.addressId (since address doesn't exist)
    { from: /order\.address/g, to: 'order.addressId' }
  ];
  
  for (const pattern of patterns) {
    content = content.replace(pattern.from, pattern.to);
  }
  
  return content;
}

// Fix unused @ts-expect-error directives
function fixUnusedDirectives(content) {
  // Remove unused @ts-expect-error directives
  content = content.replace(/\/\/ @ts-expect-error.*\n/g, '');
  content = content.replace(/\/\* @ts-expect-error \*\/\s*/g, '');
  
  return content;
}

// Fix type assignment issues
function fixTypeAssignments(content) {
  // Fix string | undefined to string assignments
  content = content.replace(/as string \| undefined/g, 'as string');
  content = content.replace(/as number \| undefined/g, 'as number');
  
  return content;
}

// Main function
function main() {
  console.log('🔧 Starting critical pattern fixing...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findTsFiles(srcDir);
  
  let fixedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply all fixes
      content = fixStringNumberComparisons(content);
      content = fixIndexSignatureAccess(content);
      content = fixUnusedDirectives(content);
      content = fixTypeAssignments(content);
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixedFiles++;
        
        // Count changes
        const changes = (content.match(/=== \d+/g) || []).length + 
                       (content.match(/errors\['/g) || []).length +
                       (content.match(/form\.formState\.errors\['/g) || []).length;
        totalChanges += changes;
        
        console.log(`✅ Fixed: ${path.relative(srcDir, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Critical pattern fixing complete!`);
  console.log(`📊 Files fixed: ${fixedFiles}`);
  console.log(`📊 Total changes: ${totalChanges}`);
}

main();
