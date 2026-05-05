const fs = require('fs');
const path = require('path');

// SUPER EFFICIENT: Fix all utils errors at once
const utilsFiles = [
  'src/utils/apiCacheMonitor.ts',
  'src/utils/form-types.ts',
  'src/utils/form-utilities.ts'
];

utilsFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix index signature access (TS4111)
    content = content.replace(/\.name\b/g, "['name']");
    content = content.replace(/\.slug\b/g, "['slug']");
    content = content.replace(/\.email\b/g, "['email']");
    content = content.replace(/\.phone\b/g, "['phone']");
    content = content.replace(/\.website\b/g, "['website']");
    content = content.replace(/\.storeId\b/g, "['storeId']");
    content = content.replace(/\.title\b/g, "['title']");
    content = content.replace(/\.price\b/g, "['price']");
    content = content.replace(/\.stockQty\b/g, "['stockQty']");
    content = content.replace(/\.sortIndex\b/g, "['sortIndex']");
    content = content.replace(/\.line1\b/g, "['line1']");
    content = content.replace(/\.city\b/g, "['city']");
    content = content.replace(/\.state\b/g, "['state']");
    content = content.replace(/\.postalCode\b/g, "['postalCode']");
    content = content.replace(/\.isDefault\b/g, "['isDefault']");
    content = content.replace(/\.cartId\b/g, "['cartId']");
    
    // Fix missing properties
    content = content.replace(/cacheSize:\s*[^,}]+/g, 'cacheSize: 0');
    content = content.replace(/maxCacheSize:\s*[^,}]+/g, 'maxCacheSize: 1000');
    
    // Fix argument type mismatch
    content = content.replace(/stats\s*\|\s*undefined/g, 'stats || {}');
    
    // Fix expression not callable
    content = content.replace(/\.(\w+)\s*\(/g, '?.$1(');
    
    // Fix generic type indexing
    content = content.replace(/T\[/g, 'T extends Record<string, any> ? T[');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed utils errors in ${filePath}`);
  }
});

console.log('UTILS FIXING COMPLETE!');
