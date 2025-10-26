#!/usr/bin/env node
/**
 * Convert Relative Imports to Path Aliases
 * 
 * Converts all relative imports to use clean path aliases:
 * - @ui for components/ui
 * - @features/* for features
 * - @hooks for hooks
 * - @api for api
 * - @utils for utils
 * 
 * Usage: node convert-to-aliases.cjs [--dry-run] [--verbose]
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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let stats = {
  filesProcessed: 0,
  filesUpdated: 0,
  importsConverted: 0,
};

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function convertImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let count = 0;

  // Define conversion patterns
  const conversions = [
    // UI components: ../../../components/ui → @ui
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/components\/ui['"]/g, replace: "from '@ui'", desc: '@ui' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/components\/ui['"]/g, replace: "from '@ui'", desc: '@ui' },
    { pattern: /from ['"]\.\.\/\.\.\/components\/ui['"]/g, replace: "from '@ui'", desc: '@ui' },
    { pattern: /from ['"]\.\.\/components\/ui['"]/g, replace: "from '@ui'", desc: '@ui' },
    
    // UI components with subpath: ../../../../components/ui/Button → @ui/Button
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/components\/ui\/([^'"]+)['"]/g, replace: "from '@ui/$1'", desc: '@ui/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/components\/ui\/([^'"]+)['"]/g, replace: "from '@ui/$1'", desc: '@ui/*' },
    { pattern: /from ['"]\.\.\/\.\.\/components\/ui\/([^'"]+)['"]/g, replace: "from '@ui/$1'", desc: '@ui/*' },
    { pattern: /from ['"]\.\.\/components\/ui\/([^'"]+)['"]/g, replace: "from '@ui/$1'", desc: '@ui/*' },
    
    // Hooks: ../../../../hooks → @hooks
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/hooks['"]/g, replace: "from '@hooks'", desc: '@hooks' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/hooks['"]/g, replace: "from '@hooks'", desc: '@hooks' },
    { pattern: /from ['"]\.\.\/\.\.\/hooks['"]/g, replace: "from '@hooks'", desc: '@hooks' },
    { pattern: /from ['"]\.\.\/hooks['"]/g, replace: "from '@hooks'", desc: '@hooks' },
    
    // Hooks with subpath: ../../../../hooks/useCart → @hooks/useCart
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/hooks\/([^'"]+)['"]/g, replace: "from '@hooks/$1'", desc: '@hooks/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/hooks\/([^'"]+)['"]/g, replace: "from '@hooks/$1'", desc: '@hooks/*' },
    { pattern: /from ['"]\.\.\/\.\.\/hooks\/([^'"]+)['"]/g, replace: "from '@hooks/$1'", desc: '@hooks/*' },
    { pattern: /from ['"]\.\.\/hooks\/([^'"]+)['"]/g, replace: "from '@hooks/$1'", desc: '@hooks/*' },
    
    // API: ../../../../api → @api
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/api['"]/g, replace: "from '@api'", desc: '@api' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/api['"]/g, replace: "from '@api'", desc: '@api' },
    { pattern: /from ['"]\.\.\/\.\.\/api['"]/g, replace: "from '@api'", desc: '@api' },
    { pattern: /from ['"]\.\.\/api['"]/g, replace: "from '@api'", desc: '@api' },
    
    // API with subpath: ../../../../api/types → @api/types
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/api\/([^'"]+)['"]/g, replace: "from '@api/$1'", desc: '@api/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/api\/([^'"]+)['"]/g, replace: "from '@api/$1'", desc: '@api/*' },
    { pattern: /from ['"]\.\.\/\.\.\/api\/([^'"]+)['"]/g, replace: "from '@api/$1'", desc: '@api/*' },
    { pattern: /from ['"]\.\.\/api\/([^'"]+)['"]/g, replace: "from '@api/$1'", desc: '@api/*' },
    
    // Utils: ../../../../utils → @utils
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/utils['"]/g, replace: "from '@utils'", desc: '@utils' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils['"]/g, replace: "from '@utils'", desc: '@utils' },
    { pattern: /from ['"]\.\.\/\.\.\/utils['"]/g, replace: "from '@utils'", desc: '@utils' },
    { pattern: /from ['"]\.\.\/utils['"]/g, replace: "from '@utils'", desc: '@utils' },
    
    // Utils with subpath: ../../../../utils/format → @utils/format
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g, replace: "from '@utils/$1'", desc: '@utils/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/utils\/([^'"]+)['"]/g, replace: "from '@utils/$1'", desc: '@utils/*' },
    { pattern: /from ['"]\.\.\/\.\.\/utils\/([^'"]+)['"]/g, replace: "from '@utils/$1'", desc: '@utils/*' },
    { pattern: /from ['"]\.\.\/utils\/([^'"]+)['"]/g, replace: "from '@utils/$1'", desc: '@utils/*' },
    
    // Stores: ../../../../stores → @stores
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/stores['"]/g, replace: "from '@stores'", desc: '@stores' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/stores['"]/g, replace: "from '@stores'", desc: '@stores' },
    { pattern: /from ['"]\.\.\/\.\.\/stores['"]/g, replace: "from '@stores'", desc: '@stores' },
    { pattern: /from ['"]\.\.\/stores['"]/g, replace: "from '@stores'", desc: '@stores' },
    
    // Stores with subpath
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/stores\/([^'"]+)['"]/g, replace: "from '@stores/$1'", desc: '@stores/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/stores\/([^'"]+)['"]/g, replace: "from '@stores/$1'", desc: '@stores/*' },
    { pattern: /from ['"]\.\.\/\.\.\/stores\/([^'"]+)['"]/g, replace: "from '@stores/$1'", desc: '@stores/*' },
    
    // Services
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, replace: "from '@services/$1'", desc: '@services/*' },
    { pattern: /from ['"]\.\.\/\.\.\/\.\.\/services\/([^'"]+)['"]/g, replace: "from '@services/$1'", desc: '@services/*' },
    { pattern: /from ['"]\.\.\/\.\.\/services\/([^'"]+)['"]/g, replace: "from '@services/$1'", desc: '@services/*' },
  ];

  // Apply conversions
  conversions.forEach(({ pattern, replace }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replace);
      count += matches.length;
    }
  });

  // Update file if changed
  if (content !== original) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesUpdated++;
    }
    
    stats.importsConverted += count;
    
    if (VERBOSE) {
      const relPath = path.relative(srcPath, filePath);
      log(`  ✅ ${DRY_RUN ? 'Would update' : 'Updated'}: ${relPath} (${count} imports)`, 'cyan');
    }
    
    return true;
  }
  
  return false;
}

function convert() {
  log('\n🔄 Converting Relative Imports to Path Aliases', 'cyan');
  log('='.repeat(60), 'cyan');
  
  if (DRY_RUN) {
    log('\n🔍 DRY RUN MODE - No changes will be made\n', 'yellow');
  }

  const allFiles = getAllFiles(srcPath);
  stats.filesProcessed = allFiles.length;

  log(`\n📁 Processing ${allFiles.length} files...\n`, 'blue');

  allFiles.forEach((file) => {
    convertImports(file);
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Conversion Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n📁 Files processed: ${stats.filesProcessed}`, 'blue');
  log(`✅ Files updated: ${stats.filesUpdated}`, 'green');
  log(`🔄 Imports converted: ${stats.importsConverted}`, 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  if (DRY_RUN) {
    log('💡 Run without --dry-run to apply changes\n', 'yellow');
  } else {
    log('✨ Conversion complete!\n', 'green');
    log('📋 Next steps:', 'cyan');
    log('  1. Verify imports: npm run lint', 'blue');
    log('  2. Test app: npm run dev', 'blue');
    log('  3. Build: npm run build\n', 'blue');
  }
}

// Run
try {
  convert();
} catch (error) {
  log(`\n❌ Conversion failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

