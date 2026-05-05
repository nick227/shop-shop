#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Composition Migration Script
 * 
 * This script automates the migration of existing components to use the new
 * unified composition system. It provides utilities for:
 * 1. Converting page components to use PageCompositionFactory
 * 2. Converting card components to use CardCompositionFactory
 * 3. Converting layout components to use LayoutCompositionFactory
 * 4. Adding composition imports and patterns
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { execSync } from 'node:child_process'

// ========================================
// Configuration
// ========================================

const CONFIG = {
  srcPath: './src',
  backupDir: './composition-migration-backups',
  logFile: './composition-migration-log.txt',
  fileExtensions: ['.tsx', '.ts'],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'migration-backups',
    'composition-migration-backups'
  ]
}

// ========================================
// Migration Patterns
// ========================================

const MIGRATION_PATTERNS = {
  // Page composition patterns
  pageComposition: {
    // Marketing pages
    marketingPage: {
      pattern: /<div className="min-h-screen[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="min-h-screen[^>]*>/,
          '<PageCompositionFactory.Marketing\n      layout="top-nav"\n      sections={[\'header\', \'content\']}\n      responsive={true}\n      accessibility={true}\n      className="min-h-screen'
        ).replace(
          /<\/div>$/,
          '</PageCompositionFactory.Marketing>'
        )
      }
    },
    
    // App pages
    appPage: {
      pattern: /<div className={styles\.container}>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className={styles\.container}>/,
          '<PageCompositionFactory.App\n      layout="sidebar"\n      sections={[\'header\', \'content\']}\n      responsive={true}\n      accessibility={true}\n      className="min-h-screen bg-gray-50 px-4 md:px-6 py-8"'
        ).replace(
          /<\/div>$/,
          '</PageCompositionFactory.App>'
        )
      }
    }
  },
  
  // Card composition patterns
  cardComposition: {
    // Basic card
    basicCard: {
      pattern: /<div className="bg-white rounded-lg border[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="bg-white rounded-lg border[^>]*>/,
          '<CardCompositionFactory.Custom\n        layout="vertical"\n        size="md"\n        features={{}}\n        responsive={true}\n        interactive={true}'
        ).replace(
          /<\/div>$/,
          '</CardCompositionFactory.Custom>'
        )
      }
    },
    
    // Product card
    productCard: {
      pattern: /<div className="[^"]*product[^"]*"[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="[^"]*product[^"]*"[^>]*>/,
          '<CardCompositionFactory.Product\n        layout="vertical"\n        size="md"\n        features={{\n          image: { aspectRatio: \'4/3\', zoom: true },\n          actions: { primary: { label: \'Add to Cart\' } },\n          meta: { price: { amount: 0 } }\n        }}\n        responsive={true}\n        interactive={true}'
        ).replace(
          /<\/div>$/,
          '</CardCompositionFactory.Product>'
        )
      }
    },
    
    // Store card
    storeCard: {
      pattern: /<div className="[^"]*store[^"]*"[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="[^"]*store[^"]*"[^>]*>/,
          '<CardCompositionFactory.Store\n        layout="vertical"\n        size="lg"\n        features={{\n          image: { aspectRatio: \'16/9\' },\n          actions: { primary: { label: \'View Store\' } },\n          badges: { featured: true },\n          meta: { rating: { value: 0, count: 0 } }\n        }}\n        responsive={true}\n        interactive={true}'
        ).replace(
          /<\/div>$/,
          '</CardCompositionFactory.Store>'
        )
      }
    }
  },
  
  // Layout composition patterns
  layoutComposition: {
    // Grid layout
    gridLayout: {
      pattern: /<div className="grid[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="grid[^>]*>/,
          '<LayoutCompositionFactory.Grid\n        columns={{ mobile: 1, tablet: 2, desktop: 3 }}\n        gap="md"\n        responsive={true}'
        ).replace(
          /<\/div>$/,
          '</LayoutCompositionFactory.Grid>'
        )
      }
    },
    
    // Flex layout
    flexLayout: {
      pattern: /<div className="flex[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="flex[^>]*>/,
          '<LayoutCompositionFactory.Flex\n        direction="row"\n        alignment="start"\n        justify="start"\n        gap="md"\n        responsive={true}'
        ).replace(
          /<\/div>$/,
          '</LayoutCompositionFactory.Flex>'
        )
      }
    },
    
    // Stack layout
    stackLayout: {
      pattern: /<div className="space-y-[^>]*>[\S\s]*?<\/div>/g,
      replacement: (match: string) => {
        return match.replace(
          /<div className="space-y-[^>]*>/,
          '<LayoutCompositionFactory.Stack\n        direction="column"\n        gap="lg"\n        responsive={true}'
        ).replace(
          /<\/div>$/,
          '</LayoutCompositionFactory.Stack>'
        )
      }
    }
  }
}

// ========================================
// Import Patterns
// ========================================

const IMPORT_PATTERNS = {
  // Page composition imports
  pageComposition: "import { PageCompositionFactory, LayoutCompositionFactory } from '@components/composition'",
  
  // Card composition imports
  cardComposition: "import { CardCompositionFactory } from '@components/composition'",
  
  // Layout composition imports
  layoutComposition: "import { LayoutCompositionFactory } from '@components/composition'",
  
  // Full composition imports
  fullComposition: "import { PageCompositionFactory, CardCompositionFactory, LayoutCompositionFactory } from '@components/composition'"
}

// ========================================
// Migration Functions
// ========================================

class CompositionMigration {
  private readonly logFile: string
  private readonly backupDir: string
  
  constructor() {
    this.logFile = CONFIG.logFile
    this.backupDir = CONFIG.backupDir
    this.setupDirectories()
  }
  
  private setupDirectories() {
    if (!existsSync(this.backupDir)) {
      execSync(`mkdir -p "${this.backupDir}"`)
    }
  }
  
  private log(message: string) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`
    writeFileSync(this.logFile, logMessage, { flag: 'a' })
    console.log(message)
  }
  
  private backupFile(filePath: string) {
    const backupPath = join(this.backupDir, filePath)
    const backupDir = dirname(backupPath)
    
    if (!existsSync(backupDir)) {
      execSync(`mkdir -p "${backupDir}"`)
    }
    
    const content = readFileSync(filePath, 'utf-8')
    writeFileSync(backupPath, content)
    this.log(`Backed up: ${filePath} -> ${backupPath}`)
  }
  
  private addCompositionImports(content: string, filePath: string): string {
    // Check if composition imports already exist
    if (content.includes('@components/composition')) {
      return content
    }
    
    // Determine which imports to add based on file content
    const importsToAdd: string[] = []
    
    if (content.includes('PageCompositionFactory') || content.includes('PageComposition')) {
      importsToAdd.push('PageCompositionFactory')
    }
    
    if (content.includes('CardCompositionFactory') || content.includes('CardComposition')) {
      importsToAdd.push('CardCompositionFactory')
    }
    
    if (content.includes('LayoutCompositionFactory') || content.includes('LayoutComposition')) {
      importsToAdd.push('LayoutCompositionFactory')
    }
    
    if (importsToAdd.length === 0) {
      return content
    }
    
    // Add imports after existing imports
    const importStatement = `import { ${importsToAdd.join(', ')} } from '@components/composition'`
    
    // Find the last import statement
    const importRegex = /^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm
    const imports = content.match(importRegex)
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1]
      const lastImportIndex = content.lastIndexOf(lastImport)
      const insertIndex = lastImportIndex + lastImport.length
      
      return content.slice(0, insertIndex) + '\n' + importStatement + '\n' + content.slice(insertIndex)
    } else {
      // No imports found, add at the beginning
      return importStatement + '\n\n' + content
    }
  }
  
  private migratePageComposition(content: string): string {
    let migratedContent = content
    
    // Apply page composition patterns
    for (const [patternName, pattern] of Object.entries(MIGRATION_PATTERNS.pageComposition)) {
      migratedContent = migratedContent.replace(pattern.pattern, pattern.replacement)
      if (migratedContent !== content) {
        this.log(`Applied ${patternName} pattern`)
      }
    }
    
    return migratedContent
  }
  
  private migrateCardComposition(content: string): string {
    let migratedContent = content
    
    // Apply card composition patterns
    for (const [patternName, pattern] of Object.entries(MIGRATION_PATTERNS.cardComposition)) {
      migratedContent = migratedContent.replace(pattern.pattern, pattern.replacement)
      if (migratedContent !== content) {
        this.log(`Applied ${patternName} pattern`)
      }
    }
    
    return migratedContent
  }
  
  private migrateLayoutComposition(content: string): string {
    let migratedContent = content
    
    // Apply layout composition patterns
    for (const [patternName, pattern] of Object.entries(MIGRATION_PATTERNS.layoutComposition)) {
      migratedContent = migratedContent.replace(pattern.pattern, pattern.replacement)
      if (migratedContent !== content) {
        this.log(`Applied ${patternName} pattern`)
      }
    }
    
    return migratedContent
  }
  
  private migrateFile(filePath: string): boolean {
    try {
      this.log(`Migrating file: ${filePath}`)
      
      // Backup original file
      this.backupFile(filePath)
      
      // Read file content
      const content = readFileSync(filePath, 'utf-8')
      
      // Apply migrations
      let migratedContent = content
      
      // Add composition imports
      migratedContent = this.addCompositionImports(migratedContent, filePath)
      
      // Apply page composition patterns
      migratedContent = this.migratePageComposition(migratedContent)
      
      // Apply card composition patterns
      migratedContent = this.migrateCardComposition(migratedContent)
      
      // Apply layout composition patterns
      migratedContent = this.migrateLayoutComposition(migratedContent)
      
      // Write migrated content if changes were made
      if (migratedContent !== content) {
        writeFileSync(filePath, migratedContent)
        this.log(`Successfully migrated: ${filePath}`)
        return true
      } else {
        this.log(`No changes needed: ${filePath}`)
        return false
      }
    } catch (error) {
      this.log(`Error migrating ${filePath}: ${error}`)
      return false
    }
  }
  
  private getFilesToMigrate(): string[] {
    const files: string[] = []
    
    const scanDirectory = (dir: string) => {
      const items = readdirSync(dir)
      
      for (const item of items) {
        const fullPath = join(dir, item)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!CONFIG.excludePatterns.some(pattern => fullPath.includes(pattern))) {
            scanDirectory(fullPath)
          }
        } else if (stat.isFile()) {
          // Check if file should be migrated
          const ext = extname(fullPath)
          if (CONFIG.fileExtensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    }
    
    scanDirectory(CONFIG.srcPath)
    return files
  }
  
  public async migrateAll(): Promise<void> {
    this.log('Starting composition migration...')
    
    const files = this.getFilesToMigrate()
    this.log(`Found ${files.length} files to migrate`)
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const file of files) {
      try {
        const migrated = this.migrateFile(file)
        if (migrated) {
          migratedCount++
        }
      } catch (error) {
        errorCount++
        this.log(`Error migrating ${file}: ${error}`)
      }
    }
    
    this.log(`Migration complete!`)
    this.log(`Files migrated: ${migratedCount}`)
    this.log(`Errors: ${errorCount}`)
    this.log(`Total files processed: ${files.length}`)
  }
  
  public async migrateFile(filePath: string): Promise<void> {
    this.log(`Migrating single file: ${filePath}`)
    
    if (!existsSync(filePath)) {
      this.log(`File not found: ${filePath}`)
      return
    }
    
    const migrated = this.migrateFile(filePath)
    if (migrated) {
      this.log(`Successfully migrated: ${filePath}`)
    } else {
      this.log(`No changes needed: ${filePath}`)
    }
  }
  
  public async migrateDirectory(dirPath: string): Promise<void> {
    this.log(`Migrating directory: ${dirPath}`)
    
    if (!existsSync(dirPath)) {
      this.log(`Directory not found: ${dirPath}`)
      return
    }
    
    const files = this.getFilesToMigrate().filter(file => file.startsWith(dirPath))
    this.log(`Found ${files.length} files in directory`)
    
    let migratedCount = 0
    
    for (const file of files) {
      try {
        const migrated = this.migrateFile(file)
        if (migrated) {
          migratedCount++
        }
      } catch (error) {
        this.log(`Error migrating ${file}: ${error}`)
      }
    }
    
    this.log(`Directory migration complete!`)
    this.log(`Files migrated: ${migratedCount}`)
  }
}

// ========================================
// CLI Interface
// ========================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const target = args[1]
  
  const migration = new CompositionMigration()
  
  switch (command) {
    case 'all': {
      await migration.migrateAll()
      break
    }
      
    case 'file': {
      if (!target) {
        console.error('Please provide a file path')
        process.exit(1)
      }
      await migration.migrateFile(target)
      break
    }
      
    case 'directory': {
      if (!target) {
        console.error('Please provide a directory path')
        process.exit(1)
      }
      await migration.migrateDirectory(target)
      break
    }
      
    default: {
      console.log('Usage:')
      console.log('  tsx scripts/composition-migration.ts all')
      console.log('  tsx scripts/composition-migration.ts file <file-path>')
      console.log('  tsx scripts/composition-migration.ts directory <directory-path>')
      break
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { CompositionMigration }
