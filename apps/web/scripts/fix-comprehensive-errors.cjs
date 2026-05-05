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

// Fix String() function errors
function fixStringErrors(content) {
  // Fix String(length) to .length
  content = content.replace(/\.String\(length\)/g, '.length');
  content = content.replace(/String\(length\)/g, 'length');
  
  // Fix String(size) to .size
  content = content.replace(/\.String\(size\)/g, '.size');
  content = content.replace(/String\(size\)/g, 'size');
  
  // Fix String(status) to .status
  content = content.replace(/response\.String\(status\)/g, 'response.status');
  content = content.replace(/\.String\(status\)/g, '.status');
  
  return content;
}

// Fix index signature property access
function fixIndexSignatureErrors(content) {
  // Fix obj['prop'] to obj.prop for common patterns
  const patterns = [
    { from: /(\w+)\['(\w+)'\]/g, to: '$1.$2' },
    { from: /(\w+)\.(\w+)\['(\w+)'\]/g, to: '$1.$2.$3' },
    { from: /(\w+)\['(\w+)'\]\.(\w+)/g, to: '$1.$2.$3' }
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

// Fix type assertion issues
function fixTypeAssertions(content) {
  // Fix common type assertion patterns
  content = content.replace(/as any\[\]/g, 'as any[]');
  content = content.replace(/as unknown\[\]/g, 'as unknown[]');
  
  return content;
}

// Main function
function main() {
  console.log('🔧 Starting comprehensive error fixing...');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findTsFiles(srcDir);
  
  let fixedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Apply all fixes
      content = fixStringErrors(content);
      content = fixIndexSignatureErrors(content);
      content = fixUnusedDirectives(content);
      content = fixTypeAssertions(content);
      
      // Only write if content changed
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        fixedFiles++;
        
        // Count changes
        const changes = (content.match(/\.length/g) || []).length + 
                       (content.match(/\.size/g) || []).length +
                       (content.match(/\.status/g) || []).length;
        totalChanges += changes;
        
        console.log(`✅ Fixed: ${path.relative(srcDir, file)}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Comprehensive error fixing complete!`);
  console.log(`📊 Files fixed: ${fixedFiles}`);
  console.log(`📊 Total changes: ${totalChanges}`);
}

main();
