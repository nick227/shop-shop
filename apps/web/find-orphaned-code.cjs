#!/usr/bin/env node
/**
 * Orphaned Code Detector
 * 
 * Finds:
 * - Unused files (not imported anywhere)
 * - Unused exports (exported but never imported)
 * - Unused dependencies
 * - Deprecated code
 * - Legacy components
 * 
 * Usage: node find-orphaned-code.cjs [--fix] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const VERBOSE = args.includes('--verbose');

const srcPath = path.join(__dirname, 'src');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const findings = {
  unusedFiles: [],
  unusedExports: [],
  deprecatedCode: [],
  legacyComponents: [],
  emptyDirs: [],
};

// Get all TS/TSX files
function getAllFiles(dir, fileList = [], exclude = ['node_modules', 'dist', '.git', 'test-results', 'playwright-report']) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    
    if (exclude.includes(file)) return;
    
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList, exclude);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Check if file is imported anywhere
function isFileImported(targetFile, allFiles) {
  const targetBaseName = path.basename(targetFile, path.extname(targetFile));
  const targetDir = path.dirname(targetFile);
  
  // Skip entry points
  if (targetBaseName === 'main' || targetBaseName === 'App' || targetBaseName === 'router') {
    return true;
  }
  
  // Skip test files
  if (targetFile.includes('.test.') || targetFile.includes('__tests__')) {
    return true;
  }
  
  // Check if imported in any file
  for (const file of allFiles) {
    if (file === targetFile) continue;
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for various import patterns
    const importPatterns = [
      new RegExp(`from ['"].*${targetBaseName}['"]`, 'g'),
      new RegExp(`import.*['"].*${targetBaseName}['"]`, 'g'),
      new RegExp(`require\\(['"].*${targetBaseName}['"]\\)`, 'g'),
    ];
    
    if (importPatterns.some(pattern => pattern.test(content))) {
      return true;
    }
  }
  
  return false;
}

// Find deprecated or legacy code
function findDeprecatedCode(file) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(srcPath, file);
  
  // Patterns indicating deprecated/legacy code
  const patterns = [
    { regex: /@deprecated/i, type: 'Deprecated annotation' },
    { regex: /\/\/ TODO.*remove|\/\/ FIXME.*remove|\/\* TODO.*remove/i, type: 'Marked for removal' },
    { regex: /legacy|old|deprecated/i, type: 'Legacy naming' },
    { regex: /PageOld|ComponentOld|Old[A-Z]/,type: 'Old version' },
  ];
  
  const found = [];
  patterns.forEach(({ regex, type }) => {
    if (regex.test(content)) {
      found.push({ file: relPath, type, pattern: regex.toString() });
    }
  });
  
  return found;
}

// Find unused exports
function findUnusedExports(file, allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(srcPath, file);
  
  // Skip index files (they're just re-exports)
  if (path.basename(file) === 'index.ts' || path.basename(file) === 'index.tsx') {
    return [];
  }
  
  // Find all export statements
  const exportRegex = /export\s+(?:const|function|class|interface|type)\s+([A-Za-z0-9_]+)/g;
  const exports = [];
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  if (exports.length === 0) return [];
  
  // Check if each export is imported anywhere
  const unused = [];
  exports.forEach((exportName) => {
    let isUsed = false;
    
    for (const otherFile of allFiles) {
      if (otherFile === file) continue;
      
      const otherContent = fs.readFileSync(otherFile, 'utf8');
      
      // Check if exported name is imported
      const importPattern = new RegExp(`\\{[^}]*\\b${exportName}\\b[^}]*\\}|import\\s+${exportName}\\s+from`, 'g');
      if (importPattern.test(otherContent)) {
        isUsed = true;
        break;
      }
    }
    
    if (!isUsed) {
      unused.push({ file: relPath, export: exportName });
    }
  });
  
  return unused;
}

// Find empty directories
function findEmptyDirs(dir, emptyDirs = []) {
  if (!fs.existsSync(dir)) return emptyDirs;
  
  const files = fs.readdirSync(dir);
  
  if (files.length === 0) {
    emptyDirs.push(dir);
    return emptyDirs;
  }
  
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && 
        file !== 'node_modules' && 
        file !== 'dist' && 
        file !== '.git') {
      findEmptyDirs(filePath, emptyDirs);
    }
  });
  
  return emptyDirs;
}

// Analyze codebase
function analyze() {
  log('\n🔍 Orphaned Code Detection', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log('\n📁 Scanning codebase...\n', 'blue');
  
  const allFiles = getAllFiles(srcPath);
  log(`Found ${allFiles.length} TypeScript files\n`, 'blue');
  
  // Step 1: Find unused files
  log('🔎 Step 1: Finding unused files...', 'yellow');
  allFiles.forEach((file) => {
    if (!isFileImported(file, allFiles)) {
      findings.unusedFiles.push(path.relative(srcPath, file));
    }
  });
  log(`  Found ${findings.unusedFiles.length} potentially unused files\n`, 'cyan');
  
  // Step 2: Find deprecated code
  log('🔎 Step 2: Finding deprecated code...', 'yellow');
  allFiles.forEach((file) => {
    const deprecated = findDeprecatedCode(file);
    findings.deprecatedCode.push(...deprecated);
  });
  log(`  Found ${findings.deprecatedCode.length} deprecated items\n`, 'cyan');
  
  // Step 3: Find unused exports (sample - this is expensive)
  log('🔎 Step 3: Finding unused exports (sample)...', 'yellow');
  const sampleFiles = allFiles.slice(0, 50); // Sample first 50 files
  sampleFiles.forEach((file) => {
    const unused = findUnusedExports(file, allFiles);
    findings.unusedExports.push(...unused);
  });
  log(`  Found ${findings.unusedExports.length} potentially unused exports (sampled)\n`, 'cyan');
  
  // Step 4: Find empty directories
  log('🔎 Step 4: Finding empty directories...', 'yellow');
  findings.emptyDirs = findEmptyDirs(srcPath);
  log(`  Found ${findings.emptyDirs.length} empty directories\n`, 'cyan');
  
  // Print results
  printResults();
  
  // Generate report
  generateReport();
}

function printResults() {
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 Analysis Results', 'cyan');
  log('='.repeat(70), 'cyan');
  
  // Unused Files
  if (findings.unusedFiles.length > 0) {
    log(`\n🗑️  Potentially Unused Files (${findings.unusedFiles.length}):`, 'red');
    findings.unusedFiles.slice(0, VERBOSE ? 100 : 10).forEach((file) => {
      log(`  - ${file}`, 'yellow');
    });
    if (!VERBOSE && findings.unusedFiles.length > 10) {
      log(`  ... and ${findings.unusedFiles.length - 10} more`, 'yellow');
    }
  } else {
    log('\n✅ No unused files found', 'green');
  }
  
  // Deprecated Code
  if (findings.deprecatedCode.length > 0) {
    log(`\n⚠️  Deprecated Code (${findings.deprecatedCode.length}):`, 'yellow');
    findings.deprecatedCode.slice(0, VERBOSE ? 100 : 10).forEach((item) => {
      log(`  - ${item.file}: ${item.type}`, 'yellow');
    });
    if (!VERBOSE && findings.deprecatedCode.length > 10) {
      log(`  ... and ${findings.deprecatedCode.length - 10} more`, 'yellow');
    }
  } else {
    log('\n✅ No deprecated code found', 'green');
  }
  
  // Unused Exports
  if (findings.unusedExports.length > 0) {
    log(`\n📤 Potentially Unused Exports (${findings.unusedExports.length} sampled):`, 'yellow');
    findings.unusedExports.slice(0, VERBOSE ? 100 : 10).forEach((item) => {
      log(`  - ${item.file}: export ${item.export}`, 'yellow');
    });
    if (!VERBOSE && findings.unusedExports.length > 10) {
      log(`  ... and ${findings.unusedExports.length - 10} more`, 'yellow');
    }
  } else {
    log('\n✅ No unused exports found (in sample)', 'green');
  }
  
  // Empty Directories
  if (findings.emptyDirs.length > 0) {
    log(`\n📁 Empty Directories (${findings.emptyDirs.length}):`, 'yellow');
    findings.emptyDirs.forEach((dir) => {
      log(`  - ${path.relative(srcPath, dir)}`, 'yellow');
    });
  } else {
    log('\n✅ No empty directories found', 'green');
  }
  
  log('\n' + '='.repeat(70) + '\n', 'cyan');
}

function generateReport() {
  const reportPath = path.join(__dirname, 'orphaned-code-report.md');
  
  let report = `# Orphaned Code Analysis Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Unused Files**: ${findings.unusedFiles.length}\n`;
  report += `- **Deprecated Code**: ${findings.deprecatedCode.length}\n`;
  report += `- **Unused Exports**: ${findings.unusedExports.length} (sampled)\n`;
  report += `- **Empty Directories**: ${findings.emptyDirs.length}\n\n`;
  
  if (findings.unusedFiles.length > 0) {
    report += `## 🗑️ Unused Files\n\n`;
    report += `These files are not imported anywhere:\n\n`;
    findings.unusedFiles.forEach((file) => {
      report += `- \`${file}\`\n`;
    });
    report += `\n`;
  }
  
  if (findings.deprecatedCode.length > 0) {
    report += `## ⚠️ Deprecated Code\n\n`;
    findings.deprecatedCode.forEach((item) => {
      report += `- \`${item.file}\` - ${item.type}\n`;
    });
    report += `\n`;
  }
  
  if (findings.unusedExports.length > 0) {
    report += `## 📤 Unused Exports (Sample)\n\n`;
    findings.unusedExports.forEach((item) => {
      report += `- \`${item.file}\`: \`export ${item.export}\`\n`;
    });
    report += `\n`;
  }
  
  if (findings.emptyDirs.length > 0) {
    report += `## 📁 Empty Directories\n\n`;
    findings.emptyDirs.forEach((dir) => {
      report += `- \`${path.relative(srcPath, dir)}\`\n`;
    });
    report += `\n`;
  }
  
  report += `## 🔧 Recommended Actions\n\n`;
  report += `1. Review unused files and remove if truly unused\n`;
  report += `2. Update or remove deprecated code\n`;
  report += `3. Remove unused exports\n`;
  report += `4. Clean up empty directories\n\n`;
  report += `Run with \`--fix\` to automatically clean up empty directories.\n`;
  
  fs.writeFileSync(reportPath, report, 'utf8');
  log(`📄 Detailed report saved to: orphaned-code-report.md`, 'green');
}

// Run analysis
try {
  analyze();
  
  if (FIX && findings.emptyDirs.length > 0) {
    log(`\n🧹 Cleaning up ${findings.emptyDirs.length} empty directories...\n`, 'yellow');
    findings.emptyDirs.forEach((dir) => {
      fs.rmdirSync(dir);
      log(`  ✅ Removed: ${path.relative(srcPath, dir)}`, 'green');
    });
  }
  
  const issueCount = findings.unusedFiles.length + findings.deprecatedCode.length;
  if (issueCount > 0) {
    log(`\n⚠️  Found ${issueCount} potential issues - review the report\n`, 'yellow');
  } else {
    log(`\n✨ No orphaned code found - codebase is clean!\n`, 'green');
  }
} catch (error) {
  log(`\n❌ Analysis failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

