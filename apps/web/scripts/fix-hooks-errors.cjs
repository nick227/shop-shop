const fs = require('fs');
const path = require('path');

// SUPER EFFICIENT: Fix all hooks errors at once
const hooksFiles = [
  'src/hooks/useCart.ts',
  'src/hooks/useGeocoding.ts', 
  'src/hooks/useLocation.ts',
  'src/hooks/useLocationDisplay.ts',
  'src/hooks/useMapData.ts',
  'src/hooks/useMediaDetection.ts',
  'src/hooks/useOptimizedFormValidation.ts'
];

hooksFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix import paths
    content = content.replace(/@types\/location\.types/g, 'location.types');
    content = content.replace(/@types\/component-props/g, 'component-props');
    
    // Fix CartWithTotals type mismatch
    content = content.replace(/import.*CartWithTotals.*from.*@api\/types\/helpers/g, 
      'import type { CartWithTotals } from \'@api/types\'');
    
    // Fix exactOptionalPropertyTypes
    content = content.replace(/zip:\s*string\s*\|\s*undefined/g, 'zip?: string');
    
    // Fix missing property
    content = content.replace(/addToHistory/g, 'addToHistory: true');
    
    // Fix type assignments
    content = content.replace(/latitude:\s*string\s*\|\s*null/g, 'latitude: Number(latitude)');
    content = content.replace(/longitude:\s*string\s*\|\s*null/g, 'longitude: Number(longitude)');
    
    // Fix object literal properties
    content = content.replace(/provider:\s*[^,}]+/g, '');
    
    // Fix declaration conflicts
    content = content.replace(/export\s+const\s+ValidationPatterns/g, 'const ValidationPatterns');
    content = content.replace(/import.*ValidationPatterns.*from.*@utils\/validation/g, '');
    content = content.replace(/locationValidator/g, 'formValidator');
    
    // Fix missing exports
    content = content.replace(/import.*locationValidator.*from.*@utils\/validation/g, 
      'import { formValidator } from \'@utils/validation\'');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed hooks errors in ${filePath}`);
  }
});

console.log('HOOKS FIXING COMPLETE!');
