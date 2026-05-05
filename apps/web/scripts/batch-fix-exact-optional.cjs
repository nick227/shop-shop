const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapZoom.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove undefined properties from function calls
    content = content.replace(
      /{\s*userLocation:\s*undefined,\s*([^}]+)\s*}/g,
      (match, rest) => `{ ${rest} }`
    );
    
    content = content.replace(
      /{\s*radiusMiles:\s*undefined,\s*([^}]+)\s*}/g,
      (match, rest) => `{ ${rest} }`
    );
    
    content = content.replace(
      /{\s*stores:\s*\[\],\s*userLocation:\s*undefined,\s*([^}]+)\s*}/g,
      (match, rest) => `{ stores: [], ${rest} }`
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed exactOptionalPropertyTypes in ${filePath}`);
  }
});

console.log('ExactOptionalPropertyTypes batch fix complete!');
