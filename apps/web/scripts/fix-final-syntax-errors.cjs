const fs = require('fs');
const path = require('path');

// Function to fix final syntax errors
function fixSyntaxErrors(content, filePath) {
  let fixes = 0;
  let newContent = content;

  // Fix 1: Fix missing semicolons in helpers.ts
  if (filePath.includes('helpers.ts')) {
    // Fix the serviceFee calculation
    if (newContent.includes('const serviceFee = storeFees?.serviceFeePercent') && !newContent.includes(';')) {
      newContent = newContent.replace(
        /const serviceFee = storeFees\?\.serviceFeePercent\s*\?\s*subtotal \* \(storeFees\.serviceFeePercent \/ 100\)\s*:\s*0/g,
        'const serviceFee = storeFees?.serviceFeePercent\n    ? subtotal * (storeFees.serviceFeePercent / 100)\n    : 0;'
      );
      fixes++;
    }
  }

  // Fix 2: Fix JSX syntax in StoreHeroCard.tsx
  if (filePath.includes('StoreHeroCard.tsx')) {
    // Fix the malformed JSX cast
    if (newContent.includes('as React.ReactNode')) {
      newContent = newContent.replace(
        /\(\s*\([^)]*\)\s*:\s*null\)\s*as\s*React\.ReactNode\s*\}/g,
        'null}'
      );
      fixes++;
    }
  }

  return { content: newContent, fixes };
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixSyntaxErrors(content, filePath);
    
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

// Main execution
console.log('🔧 Fixing final syntax errors...\n');

const files = [
  'src/api/types/helpers.ts',
  'src/features/stores/components/StoreHeroCard/StoreHeroCard.tsx'
];

let totalFixes = 0;
let filesProcessed = 0;

for (const file of files) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const fixes = processFile(fullPath);
    totalFixes += fixes;
    if (fixes > 0) {
      filesProcessed++;
    }
  }
}

console.log(`\n🎉 Fixed ${totalFixes} issues across ${filesProcessed} files!`);
