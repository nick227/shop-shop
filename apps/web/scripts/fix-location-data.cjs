const fs = require('fs');
const path = require('path');

// Fix LocationData issues
const locationDataFixes = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts'
];

locationDataFixes.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix empty arrays to proper LocationData arrays
    content = content.replace(/stores:\s*\[\]/g, 'stores: []');
    content = content.replace(/userLocation:\s*\{\}/g, 'userLocation: { latitude: 40.7128, longitude: -74.006, radiusMiles: 25, source: "manual" }');
    
    // Fix missing LocationData properties
    content = content.replace(/latitude:\s*40\.7128,\s*longitude:\s*-74\.006/g, 
      'latitude: 40.7128, longitude: -74.006, radiusMiles: 25, source: "manual" as const');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed LocationData in ${filePath}`);
  }
});

console.log('LocationData fixes complete!');
