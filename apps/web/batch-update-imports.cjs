#!/usr/bin/env node
/**
 * Batch Import Path Updater
 * 
 * Converts ALL relative imports to clean path aliases
 * Handles all cases: ../../../, ../../, ../, etc.
 * 
 * Usage: node batch-update-imports.cjs [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

const srcPath = path.join(__dirname, 'src');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const stats = {
  filesProcessed: 0,
  filesUpdated: 0,
  importsConverted: 0,
  byAlias: {},
};

function getAllTsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist' && file !== '.git') {
      getAllTsFiles(filePath, fileList);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function trackConversion(alias) {
  stats.byAlias[alias] = (stats.byAlias[alias] || 0) + 1;
}

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let conversions = 0;

  // Pattern groups for each alias
  const replacements = [
    // UI Components - all depth levels
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}components\/ui['"](?!\/)/g,
        /from ['"](?:\.\.\/){1,10}components\/ui\/index['"](?!\/)/g,
      ],
      replace: "from '@ui'",
      alias: '@ui',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}components\/ui\/([^'"]+)['"]/g,
      ],
      replace: "from '@ui/$1'",
      alias: '@ui/*',
    },
    
    // Hooks - all depth levels
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}hooks['"](?!\/)/g,
        /from ['"](?:\.\.\/){1,10}hooks\/index['"](?!\/)/g,
      ],
      replace: "from '@hooks'",
      alias: '@hooks',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}hooks\/([^'"]+)['"]/g,
      ],
      replace: "from '@hooks/$1'",
      alias: '@hooks/*',
    },
    
    // API - all depth levels
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}api['"](?!\/)/g,
        /from ['"](?:\.\.\/){1,10}api\/index['"](?!\/)/g,
      ],
      replace: "from '@api'",
      alias: '@api',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}api\/([^'"]+)['"]/g,
      ],
      replace: "from '@api/$1'",
      alias: '@api/*',
    },
    
    // Utils - all depth levels
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}utils['"](?!\/)/g,
        /from ['"](?:\.\.\/){1,10}utils\/index['"](?!\/)/g,
      ],
      replace: "from '@utils'",
      alias: '@utils',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}utils\/([^'"]+)['"]/g,
      ],
      replace: "from '@utils/$1'",
      alias: '@utils/*',
    },
    
    // Stores (state management)
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}stores['"](?!\/)/g,
        /from ['"](?:\.\.\/){1,10}stores\/index['"](?!\/)/g,
      ],
      replace: "from '@stores'",
      alias: '@stores',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}stores\/([^'"]+)['"]/g,
      ],
      replace: "from '@stores/$1'",
      alias: '@stores/*',
    },
    
    // Services
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}services['"](?!\/)/g,
      ],
      replace: "from '@services'",
      alias: '@services',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}services\/([^'"]+)['"]/g,
      ],
      replace: "from '@services/$1'",
      alias: '@services/*',
    },
    
    // Layouts
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}layouts['"](?!\/)/g,
      ],
      replace: "from '@layouts'",
      alias: '@layouts',
    },
    {
      patterns: [
        /from ['"](?:\.\.\/){1,10}layouts\/([^'"]+)['"]/g,
      ],
      replace: "from '@layouts/$1'",
      alias: '@layouts/*',
    },
    
    // Features - keep as is for now (within features, relative is fine)
    // Only convert cross-feature references
  ];

  // Apply all replacements
  replacements.forEach(({ patterns, replace, alias }) => {
    patterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replace);
        conversions += matches.length;
        trackConversion(alias);
      }
    });
  });

  // Update file if changed
  if (content !== original) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesUpdated++;
    }
    
    stats.importsConverted += conversions;
    
    if (VERBOSE) {
      const relPath = path.relative(srcPath, filePath);
      log(`  ✅ ${DRY_RUN ? 'Would update' : 'Updated'}: ${relPath} (${conversions} imports)`, 'cyan');
    }
    
    return true;
  }
  
  return false;
}

function batchUpdate() {
  log('\n🔄 Batch Import Path Update', 'cyan');
  log('='.repeat(70), 'cyan');
  
  if (DRY_RUN) {
    log('\n🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  log('\n📁 Scanning TypeScript files...\n', 'blue');
  const allFiles = getAllTsFiles(srcPath);
  stats.filesProcessed = allFiles.length;

  log(`Found ${allFiles.length} files to process\n`, 'blue');

  // Process all files
  allFiles.forEach((file) => {
    updateImports(file);
  });

  // Print summary
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 Batch Update Summary', 'cyan');
  log('='.repeat(70), 'cyan');
  
  log(`\n📁 Files processed:   ${stats.filesProcessed}`, 'blue');
  log(`✅ Files updated:     ${stats.filesUpdated}`, 'green');
  log(`🔄 Imports converted: ${stats.importsConverted}`, 'cyan');
  
  if (Object.keys(stats.byAlias).length > 0) {
    log('\n📊 Conversions by Alias:', 'magenta');
    Object.entries(stats.byAlias)
      .sort((a, b) => b[1] - a[1])
      .forEach(([alias, count]) => {
        log(`  ${alias.padEnd(15)} → ${count} imports`, 'cyan');
      });
  }
  
  log('\n' + '='.repeat(70) + '\n', 'cyan');

  if (DRY_RUN) {
    log('💡 Run without --dry-run to apply changes\n', 'yellow');
  } else {
    log('✨ Batch update complete!\n', 'green');
    log('📋 Next steps:', 'cyan');
    log('  1. Verify: npm run lint', 'blue');
    log('  2. Test: npm run dev', 'blue');
    log('  3. Build: npm run build\n', 'blue');
  }
}

// Run
try {
  batchUpdate();
} catch (error) {
  log(`\n❌ Batch update failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

