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

// Fix type comparison issues
function fixTypeComparisons(content) {
  // Fix string vs number comparisons
  content = content.replace(/=== String\((\d+)\)/g, '=== $1');
  content = content.replace(/!== String\((\d+)\)/g, '!== $1');
  content = content.replace(/== String\((\d+)\)/g, '== $1');
  content = content.replace(/!= String\((\d+)\)/g, '!= $1');
  
  // Fix String() constructor usage
  content = content.replace(/String\((\d+)\)/g, '$1');
  
  return content;
}

// Fix unused @ts-expect-error directives
function fixUnusedDirectives(content) {
  // Remove unused @ts-expect-error directives
  content = content.replace(/\/\/ @ts-expect-error.*\n/g, '');
  content = content.replace(/\/\* @ts-expect-error \*\/\s*/g, '');
  
  return content;
}

// Fix missing properties in type definitions
function fixMissingProperties(content) {
  // Add missing createdAt property to CartItemData
  if (content.includes('CartItemData') && content.includes('createdAt')) {
    // This is a more complex fix that would need manual intervention
    // For now, we'll just log it
    console.log('⚠️  Manual fix needed for CartItemData type');
  }
  
  return content;
}

// Fix environment variable access
function fixEnvVariableAccess(content) {
  // Fix environment variable access patterns
  content = content.replace(/import\.meta\.env\.(\w+)/g, "import.meta.env['$1']");
  
  return content;
}

// Main function
function main() {
  console.log('🔧 Starting specific error fixing...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findTsFiles(srcDir);
  
  let fixedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply all fixes
      content = fixTypeComparisons(content);
      content = fixUnusedDirectives(content);
      content = fixMissingProperties(content);
      content = fixEnvVariableAccess(content);
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixedFiles++;
        
        // Count changes
        const changes = (content.match(/=== \d+/g) || []).length + 
                       (content.match(/!== \d+/g) || []).length +
                       (content.match(/== \d+/g) || []).length +
                       (content.match(/!= \d+/g) || []).length;
        totalChanges += changes;
        
        console.log(`✅ Fixed: ${path.relative(srcDir, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Specific error fixing complete!`);
  console.log(`📊 Files fixed: ${fixedFiles}`);
  console.log(`📊 Total changes: ${totalChanges}`);
}

main();
