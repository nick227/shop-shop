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

// Fix malformed template literals
function fixTemplateLiterals(content) {
  // Fix malformed template literals like {'${styles['prop']} ' + className + ''}
  content = content.replace(/\{'(\$\{[^}]+\}) ' \+ (\w+) \+ ''\}/g, '`$1 ${$2 || \'\'}`');
  
  // Fix malformed template literals like {'${styles['prop']} ' + styles['prop2'] + ''}
  content = content.replace(/\{'(\$\{[^}]+\}) ' \+ (\w+)\['(\w+)'\] \+ ''\}/g, '`$1 ${$2[\'$3\']}`');
  
  // Fix malformed template literals like {'${styles['prop']} ' + styles['prop2'] + ''}
  content = content.replace(/\{'(\$\{[^}]+\}) ' \+ (\w+)\['(\w+)'\] \+ ''\}/g, '`$1 ${$2[\'$3\']}`');
  
  return content;
}

// Main function
function main() {
  console.log('🔧 Starting template literal fixing...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findTsFiles(srcDir);
  
  let fixedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply all fixes
      content = fixTemplateLiterals(content);
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixedFiles++;
        
        // Count changes
        const changes = (content.match(/`\$\{/g) || []).length;
        totalChanges += changes;
        
        console.log(`✅ Fixed: ${path.relative(srcDir, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Template literal fixing complete!`);
  console.log(`📊 Files fixed: ${fixedFiles}`);
  console.log(`📊 Total changes: ${totalChanges}`);
}

main();