const fs = require('fs');
const path = require('path');

// Fix import path issues
const importFixes = [
  {
    file: 'src/features/stores/components/LocationSearch/LocationHistory.tsx',
    from: '@types/location.types',
    to: 'location.types'
  },
  {
    file: 'src/features/stores/components/StoreMap/components/UserLocationMarker.tsx', 
    from: '@types/component-props',
    to: 'component-props'
  }
];

importFixes.forEach(fix => {
  const fullPath = path.join(__dirname, '..', fix.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(new RegExp(fix.from, 'g'), fix.to);
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed import in ${fix.file}`);
  }
});

console.log('Import path fixes complete!');
