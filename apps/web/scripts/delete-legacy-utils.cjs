const fs = require('fs');
const path = require('path');

// Identify and delete legacy/unused utils files
const legacyFiles = [
  // Test files that might be outdated
  'src/utils/colorGenerator.test.ts',
  'src/utils/format.test.ts', 
  'src/utils/image.test.ts',
  'src/utils/media-compression.test.ts',
  'src/utils/slugify.test.ts',
  'src/utils/validation.test.ts',
  
  // Documentation files that might be outdated
  'src/utils/performance/COMPLETE_OPTIMIZATION_GUIDE.md',
  'src/utils/performance/FINAL_OPTIMIZATION_SUMMARY.md',
  'src/utils/performance/LOOP_OPTIMIZATION_ANALYSIS.md',
  'src/utils/performance/MEMORY_OPTIMIZATION_GUIDE.md',
  'src/utils/performance/optimization-guide.md',
  'src/utils/performance/PHASE_2_3_OPTIMIZATION_SUMMARY.md',
  'src/utils/validation/CONSOLIDATION_SUMMARY.md',
  'src/utils/validation/PRODUCTION_SUMMARY.md',
  'src/utils/validation/README.md',
  
  // Potentially unused files
  'src/utils/page-builder.tsx',
  'src/utils/motion.ts',
  'src/utils/view-transitions.ts',
  'src/utils/orderTimeEstimates.ts',
  'src/utils/pricing.ts',
  'src/utils/media.ts',
  'src/utils/performance/string-interning.ts',
  'src/utils/performance/memory-pool.ts',
  'src/utils/performance/ultra-optimized-loops.ts'
];

let deletedCount = 0;
let keptCount = 0;

legacyFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Deleted legacy file: ${filePath}`);
      deletedCount++;
    } catch (error) {
      console.log(`❌ Could not delete ${filePath}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
    keptCount++;
  }
});

console.log(`\n📊 LEGACY CLEANUP SUMMARY:`);
console.log(`✅ Files deleted: ${deletedCount}`);
console.log(`⚠️  Files not found: ${keptCount}`);
console.log(`🎯 Total files processed: ${legacyFiles.length}`);
