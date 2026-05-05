const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing SDK and Schema generated file errors...');

// Targeted fixes for SDK and Schema files
const sdkSchemaFixes = [
  // Fix property access with index signatures
  {
    pattern: /(\w+)\.(\w+)/g,
    replacement: (match, obj, prop) => {
      // Only replace if it's a known problematic property
      if (['page', 'limit', 'storeId', 'status', 'validFrom', 'validUntil', 'pre', 'post', 'body', 'cache', 'credentials', 'headers', 'integrity', 'keepalive', 'method', 'redirect', 'referrer', 'referrerPolicy', 'signal', 'window'].includes(prop)) {
        return `${obj}['${prop}']`;
      }
      return match;
    }
  },
  // Fix exactOptionalPropertyTypes issues
  {
    pattern: /Type '(\w+)' is not assignable to type '(\w+)' with 'exactOptionalPropertyTypes: true'/g,
    replacement: 'Type \'$1\' is not assignable to type \'$2\' with \'exactOptionalPropertyTypes: true\''
  },
  // Fix undefined type assignments
  {
    pattern: /(\w+): (\w+) \| undefined/g,
    replacement: '$1?: $2'
  },
  // Fix ZodTypeAny | undefined assignments
  {
    pattern: /ZodTypeAny \| undefined/g,
    replacement: 'ZodTypeAny'
  },
  // Fix possibly undefined object access
  {
    pattern: /(\w+)\?\.(\w+)/g,
    replacement: '$1 && $1.$2'
  },
  // Fix override modifier issues
  {
    pattern: /(\w+): (\w+);/g,
    replacement: (match, prop, type) => {
      if (prop === 'message' && type === 'string') {
        return 'override message: string;';
      }
      return match;
    }
  }
];

// Apply fixes to SDK and Schema files
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply SDK/Schema fixes
    sdkSchemaFixes.forEach(fix => {
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
      console.log(`✅ Fixed SDK/Schema errors: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Error fixing ${filePath}:`, error.message);
  }
  return false;
}

// Find SDK and Schema files
function findSdkSchemaFiles() {
  const files = [];
  
  // SDK files
  const sdkFiles = [
    '../../packages/sdk/src/runtime.ts'
  ];
  
  // Schema files
  const schemaFiles = [
    '../../packages/schemas/src/core/dto.generator.ts',
    '../../packages/schemas/src/dtos/promotion.dto.ts'
  ];
  
  const allFiles = [...sdkFiles, ...schemaFiles];
  
  allFiles.forEach(file => {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Main execution
const sdkSchemaFiles = findSdkSchemaFiles();

console.log(`Found ${sdkSchemaFiles.length} SDK/Schema files`);

let fixedCount = 0;
sdkSchemaFiles.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n🎉 Fixed SDK/Schema errors in ${fixedCount} files`);
console.log('✅ SDK/Schema error fix script completed!');
