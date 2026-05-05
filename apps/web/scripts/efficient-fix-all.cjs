const fs = require('fs');
const path = require('path');

// SUPER EFFICIENT: Fix all error patterns at once
const filesToFix = [
  'src/features/stores/components/LocationSearch/LocationHistory.tsx',
  'src/features/stores/components/StoreMap/components/UserLocationMarker.tsx',
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapZoom.test.ts',
  'src/features/stores/components/StoreMap/hooks/__tests__/useOptimizedMapData.test.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix import paths
    content = content.replace(/@types\/location\.types/g, 'location.types');
    content = content.replace(/@types\/component-props/g, 'component-props');
    
    // Fix LocationData issues
    content = content.replace(/stores:\s*\[\]/g, 'stores: []');
    content = content.replace(/userLocation:\s*\{\}/g, 'userLocation: { latitude: 40.7128, longitude: -74.006, radiusMiles: 25, source: "manual" as const }');
    
    // Fix exactOptionalPropertyTypes
    content = content.replace(/radiusMiles:\s*undefined,?\s*/g, '');
    content = content.replace(/userLocation:\s*undefined,?\s*/g, '');
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/{\s*,/g, '{');
    
    // Fix duplicate properties by removing duplicates
    const lines = content.split('\n');
    const seen = new Set();
    const fixedLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes(':') && !trimmed.includes('//') && !trimmed.includes('it(') && !trimmed.includes('expect(')) {
        const key = trimmed.split(':')[0].trim();
        if (seen.has(key)) {
          continue; // Skip duplicate
        }
        seen.add(key);
      }
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Efficiently fixed ${filePath}`);
  }
});

console.log('SUPER EFFICIENT fix complete!');
