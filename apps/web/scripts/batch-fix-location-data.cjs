const fs = require('fs');
const path = require('path');

// Complete LocationData mock
const completeLocationData = {
  radiusMiles: 25,
  source: 'manual'
};

// Files to fix
const filesToFix = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix LocationData objects
    content = content.replace(
      /{\s*latitude:\s*([^,]+),\s*longitude:\s*([^}]+)\s*}/g,
      (match, lat, lng) => {
        return `{
      latitude: ${lat},
      longitude: ${lng},
      radiusMiles: 25,
      source: 'manual' as const
    }`;
      }
    );
    
    // Fix arrays of LocationData
    content = content.replace(
      /\[\s*{\s*latitude:\s*([^,]+),\s*longitude:\s*([^,]+),\s*radiusMiles:\s*([^,]+),\s*source:\s*['"]([^'"]+)['"]\s*as const\s*},\s*{\s*latitude:\s*([^,]+),\s*longitude:\s*([^,]+),\s*radiusMiles:\s*([^,]+),\s*source:\s*['"]([^'"]+)['"]\s*as const\s*}\s*\]/g,
      (match, lat1, lng1, radius1, source1, lat2, lng2, radius2, source2) => {
        return `[
      { latitude: ${lat1}, longitude: ${lng1}, radiusMiles: ${radius1}, source: '${source1}' as const },
      { latitude: ${lat2}, longitude: ${lng2}, radiusMiles: ${radius2}, source: '${source2}' as const }
    ]`;
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed LocationData in ${filePath}`);
  }
});

console.log('LocationData batch fix complete!');
