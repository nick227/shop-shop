#!/usr/bin/env tsx
/**
 * Auto-Generate Barrel Exports (index.ts files)
 * 
 * Scans directories and generates index.ts files with exports
 * Eliminates manual maintenance of barrel files
 * 
 * Usage: tsx packages/sdk/scripts/generate-barrel-exports.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { logger, ProgressLogger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Directories to generate barrel exports for
const targetDirs = [
  {
    path: '../../../apps/web/src/components/ui',
    exclude: ['index.ts', 'index.new.ts', 'styles', 'utils', '__tests__'],
    comment: 'UI Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/stores/components',
    exclude: ['index.ts', 'examples', '__tests__'],
    comment: 'Store Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/orders/components',
    exclude: ['index.ts', '__tests__'],
    comment: 'Order Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/items/components',
    exclude: ['index.ts', '__tests__'],
    comment: 'Item Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/cart/components',
    exclude: ['index.ts', '__tests__'],
    comment: 'Cart Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/checkout/components',
    exclude: ['index.ts', '__tests__'],
    comment: 'Checkout Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/features/river/components',
    exclude: ['index.ts', '__tests__'],
    comment: 'River Components - Auto-generated barrel exports',
  },
  {
    path: '../../../apps/web/src/components/templates',
    exclude: ['index.ts', '__tests__'],
    comment: 'Template Components - Auto-generated barrel exports',
  },
]

/**
 * ✅ Stricter file patterns to exclude from barrel exports
 */
const EXCLUDE_PATTERNS = [
  /\.module\.(css|scss|sass|less)$/,           // CSS modules
  /\.module\.(css|scss|sass|less)\.d\.ts$/,    // CSS module type definitions
  /\.test\.(ts|tsx|js|jsx)$/,                  // Test files
  /\.spec\.(ts|tsx|js|jsx)$/,                  // Spec files
  /__tests__/,                                  // Test directories
  /__mocks__/,                                  // Mock directories
  /\.stories\.(ts|tsx|js|jsx)$/,               // Storybook stories
  /\.d\.ts$/,                                   // Type definition files only
  /types\.(ts|tsx)$/,                          // Standalone type files
  /\.config\.(ts|js)$/,                        // Config files
  /\.constants\.(ts|js)$/,                     // Constants (should be imported explicitly)
]

/**
 * Check if file/directory should be exported
 */
function shouldExport(item: fs.Dirent, itemPath: string): boolean {
  // Skip excluded patterns
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(item.name))) {
    return false
  }
  
  // For directories, check if they have exportable content
  if (item.isDirectory()) {
    const dirFullPath = path.join(itemPath, item.name)
    
    // Must have index.ts or a component file to be exportable
    const hasIndex = fs.existsSync(path.join(dirFullPath, 'index.ts'))
    const hasIndexTsx = fs.existsSync(path.join(dirFullPath, 'index.tsx'))
    const hasComponentFile = fs.existsSync(path.join(dirFullPath, `${item.name}.tsx`))
    const hasComponentTs = fs.existsSync(path.join(dirFullPath, `${item.name}.ts`))
    
    return hasIndex || hasIndexTsx || hasComponentFile || hasComponentTs
  }
  
  // For files, must be .ts or .tsx (not .d.ts)
  if (item.isFile()) {
    return (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) && 
           !item.name.endsWith('.d.ts')
  }
  
  return false
}

function generateBarrelExport(dirPath: string, comment: string, exclude: string[]): string {
  const fullPath = path.resolve(__dirname, dirPath)
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Directory not found: ${fullPath}`)
    return ''
  }

  const items = fs.readdirSync(fullPath, { withFileTypes: true })
  const exports: string[] = []

  for (const item of items) {
    // Skip explicitly excluded items
    if (exclude.includes(item.name)) continue
    
    // Skip hidden files/dirs
    if (item.name.startsWith('.')) continue
    
    // ✅ Apply strict filtering
    if (!shouldExport(item, fullPath)) continue

    if (item.isDirectory()) {
      // Export from subdirectory
      exports.push(`export * from './${item.name}'`)
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
      // Export from file (remove extension)
      const nameWithoutExt = item.name.replace(/\.(tsx?|jsx?)$/, '')
      if (nameWithoutExt !== 'index') {
        exports.push(`export * from './${nameWithoutExt}'`)
      }
    }
  }

  // Sort exports alphabetically for consistency
  exports.sort()

  return `/**
 * ${comment}
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * 
 * To regenerate: pnpm gen:barrels
 */

${exports.join('\n')}
`
}

// ============================================
// Main Generation with Transaction Support
// ============================================
async function main() {
  const transaction = new GenerationTransaction()
  
  try {
    logger.section('Barrel Exports Generation')
    
    const progress = new ProgressLogger(targetDirs.length)
    let generated = 0
    let skipped = 0
    
    for (const config of targetDirs) {
      try {
        const barrelCode = generateBarrelExport(config.path, config.comment, config.exclude)
        
        if (!barrelCode) {
          progress.next(`⏭️  Skipped: ${config.path}`)
          skipped++
          continue
        }

        const outputPath = path.resolve(__dirname, config.path, 'index.ts')
        await transaction.write(outputPath, barrelCode)
        
        const relativePath = path.relative(path.resolve(__dirname, '../../..'), outputPath)
        progress.next(`Generated: ${relativePath}`)
        generated++
      } catch (error) {
        logger.error(`Failed: ${config.path}`)
        logger.error(String(error))
        skipped++
      }
    }
    
    // Commit transaction
    transaction.commit()
    
    // Summary
    logger.section('Summary')
    logger.stats('Generated', `${generated} barrel files`)
    logger.stats('Skipped', `${skipped} directories`)
    
  } catch (error) {
    logger.error('Generation failed:')
    logger.error(String(error))
    transaction.rollback()
    process.exit(1)
  }
}

// Run generation
main().catch(console.error)

