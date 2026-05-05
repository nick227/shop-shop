const fs = require('fs');
const path = require('path');

// Fix exactOptionalPropertyTypes issues
const exactOptionalFixes = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapZoom.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts'
];

exactOptionalFixes.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove undefined properties
    content = content.replace(/radiusMiles:\s*undefined,?\s*/g, '');
    content = content.replace(/userLocation:\s*undefined,?\s*/g, '');
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/{\s*,/g, '{');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed exactOptionalPropertyTypes in ${filePath}`);
  }
});

console.log('ExactOptionalPropertyTypes fixes complete!');
