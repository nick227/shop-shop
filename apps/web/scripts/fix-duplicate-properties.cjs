const fs = require('fs');
const path = require('path');

// Fix duplicate properties
const duplicateFixes = [
  'src/features/stores/components/StoreMap/hooks/__tests__/useMapCenter.test.ts'
];

duplicateFixes.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove duplicate properties by keeping only the first occurrence
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
    
    fs.writeFileSync(fullPath, fixedLines.join('\n'));
    console.log(`Fixed duplicates in ${filePath}`);
  }
});

console.log('Duplicate properties fixes complete!');