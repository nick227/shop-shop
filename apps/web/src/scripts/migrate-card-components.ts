#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Card Component Migration Script
 * 
 * This script helps migrate from individual card components to the unified BaseCard system:
 * 1. Analyzes current card component usage
 * 2. Suggests migration patterns
 * 3. Updates imports and component usage
 * 4. Validates migration success
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

// ============================================
// Configuration
// ============================================

const SRC_PATH = './src'
const COMPONENTS_PATH = './src/components'
const FEATURES_PATH = './src/features'

// Card component migration mappings
const CARD_MIGRATIONS = [
  {
    // Store cards
    from: 'features/stores/components/StoreCard/StoreCard',
    to: 'components/cards/StoreCard',
    type: 'StoreCard'
  },
  {
    from: 'features/stores/components/StoreCard/StoreCardCompact',
    to: 'components/cards/StoreCard',
    type: 'StoreCard',
    variant: 'compact'
  },
  {
    from: 'features/stores/components/StoreCard/StoreCardExpanded',
    to: 'components/cards/StoreCard',
    type: 'StoreCard',
    variant: 'expanded'
  },
  
  // Order cards
  {
    from: 'features/orders/components/OrderCard/OrderCard',
    to: 'components/cards/OrderCard',
    type: 'OrderCard'
  },
  {
    from: 'features/orders/components/vendor/VendorOrderCard',
    to: 'components/cards/OrderCard',
    type: 'OrderCard'
  },
  
  // Item/Product cards
  {
    from: 'features/items/components/ItemCard/ItemCard',
    to: 'components/cards/ItemCard',
    type: 'ItemCard'
  },
  {
    from: 'features/products/components/ProductCard/ProductCard',
    to: 'components/cards/ItemCard',
    type: 'ItemCard'
  },
  
  // Bundle cards
  {
    from: 'features/bundles/components/BundleCard',
    to: 'components/cards/BaseCard',
    type: 'BaseCard',
    custom: true // Requires custom implementation
  },
  {
    from: 'features/bundles/components/customer/BundleCard',
    to: 'components/cards/BaseCard',
    type: 'BaseCard',
    custom: true
  },
  
  // River cards
  {
    from: 'features/river/components/PostCard/PostCard',
    to: 'components/cards/BaseCard',
    type: 'BaseCard',
    custom: true
  },
  
  // Search cards
  {
    from: 'features/search/components/SearchResults/ResultCard',
    to: 'components/cards/BaseCard',
    type: 'BaseCard',
    custom: true
  }
]

// ============================================
// Migration Functions
// ============================================

class CardMigration {
  private readonly log: string[] = []
  private readonly stats = {
    filesProcessed: 0,
    importsUpdated: 0,
    componentsReplaced: 0,
    errors: 0
  }

  /**
   * Main migration workflow
   */
  async migrate(): Promise<void> {
    console.log('🔄 Starting card component migration...')
    
    try {
      // Step 1: Analyze current usage
      await this.analyzeCurrentUsage()
      
      // Step 2: Update imports
      await this.updateImports()
      
      // Step 3: Replace component usage
      await this.replaceComponentUsage()
      
      // Step 4: Validate migration
      await this.validateMigration()
      
      console.log('✅ Card migration completed successfully!')
      this.logMessage('Card migration completed successfully')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.logMessage(`Migration failed: ${error}`)
      throw error
    }
  }

  /**
   * Analyze current card component usage
   */
  private async analyzeCurrentUsage(): Promise<void> {
    console.log('📊 Analyzing current card component usage...')
    
    const files = this.getAllTypeScriptFiles()
    const usage = {
      storeCards: 0,
      orderCards: 0,
      itemCards: 0,
      bundleCards: 0,
      postCards: 0,
      searchCards: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Count card component usage
      if (content.includes('StoreCard')) usage.storeCards++
      if (content.includes('OrderCard')) usage.orderCards++
      if (content.includes('ItemCard')) usage.itemCards++
      if (content.includes('BundleCard')) usage.bundleCards++
      if (content.includes('PostCard')) usage.postCards++
      if (content.includes('ResultCard')) usage.searchCards++
    }
    
    console.log('📈 Current Usage:')
    console.log(`  - Store Cards: ${usage.storeCards} files`)
    console.log(`  - Order Cards: ${usage.orderCards} files`)
    console.log(`  - Item Cards: ${usage.itemCards} files`)
    console.log(`  - Bundle Cards: ${usage.bundleCards} files`)
    console.log(`  - Post Cards: ${usage.postCards} files`)
    console.log(`  - Search Cards: ${usage.searchCards} files`)
    
    this.logMessage(`Usage analysis: ${JSON.stringify(usage)}`)
  }

  /**
   * Update imports across all files
   */
  private async updateImports(): Promise<void> {
    console.log('🔄 Updating imports...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Update imports for each card type
      for (const migration of CARD_MIGRATIONS) {
        const oldImport = `from '${migration.from}'`
        const newImport = `from '${migration.to}'`
        
        if (content.includes(oldImport)) {
          content = content.replaceAll(new RegExp(oldImport, 'g'), newImport)
          hasChanges = true
          this.stats.importsUpdated++
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedFiles++
        console.log(`  ✅ Updated imports in ${file}`)
        this.logMessage(`Updated imports in ${file}`)
      }
    }
    
    console.log(`✅ Updated imports in ${updatedFiles} files`)
  }

  /**
   * Replace component usage with new unified components
   */
  private async replaceComponentUsage(): Promise<void> {
    console.log('🔄 Replacing component usage...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Replace component usage patterns
      const replacements = [
        // StoreCard variants
        {
          pattern: /<StoreCardCompact\s+([^>]+)\s*\/>/g,
          replacement: '<StoreCard variant="compact" $1 />'
        },
        {
          pattern: /<StoreCardExpanded\s+([^>]+)\s*\/>/g,
          replacement: '<StoreCard variant="expanded" $1 />'
        },
        
        // ProductCard to ItemCard
        {
          pattern: /<ProductCard\s+([^>]+)\s*\/>/g,
          replacement: '<ItemCard $1 />'
        },
        
        // VendorOrderCard to OrderCard
        {
          pattern: /<VendorOrderCard\s+([^>]+)\s*\/>/g,
          replacement: '<OrderCard $1 />'
        }
      ]
      
      for (const replacement of replacements) {
        if (replacement.pattern.test(content)) {
          content = content.replace(replacement.pattern, replacement.replacement)
          hasChanges = true
          this.stats.componentsReplaced++
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedFiles++
        console.log(`  ✅ Updated component usage in ${file}`)
        this.logMessage(`Updated component usage in ${file}`)
      }
    }
    
    console.log(`✅ Updated component usage in ${updatedFiles} files`)
  }

  /**
   * Validate migration success
   */
  private async validateMigration(): Promise<void> {
    console.log('✅ Validating migration...')
    
    const files = this.getAllTypeScriptFiles()
    const remainingOldImports = {
      storeCards: 0,
      orderCards: 0,
      itemCards: 0,
      bundleCards: 0,
      postCards: 0,
      searchCards: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Check for remaining old imports
      if (content.includes('features/stores/components/StoreCard')) remainingOldImports.storeCards++
      if (content.includes('features/orders/components/OrderCard')) remainingOldImports.orderCards++
      if (content.includes('features/items/components/ItemCard')) remainingOldImports.itemCards++
      if (content.includes('features/bundles/components/BundleCard')) remainingOldImports.bundleCards++
      if (content.includes('features/river/components/PostCard')) remainingOldImports.postCards++
      if (content.includes('features/search/components/SearchResults')) remainingOldImports.searchCards++
    }
    
    console.log('📊 Remaining old imports:')
    console.log(`  - Store Cards: ${remainingOldImports.storeCards}`)
    console.log(`  - Order Cards: ${remainingOldImports.orderCards}`)
    console.log(`  - Item Cards: ${remainingOldImports.itemCards}`)
    console.log(`  - Bundle Cards: ${remainingOldImports.bundleCards}`)
    console.log(`  - Post Cards: ${remainingOldImports.postCards}`)
    console.log(`  - Search Cards: ${remainingOldImports.searchCards}`)
    
    this.logMessage(`Validation completed: ${JSON.stringify(remainingOldImports)}`)
  }

  /**
   * Get all TypeScript files
   */
  private getAllTypeScriptFiles(): string[] {
    const files: string[] = []
    
    const scanDir = (dir: string) => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          
          if (entry.isDirectory() && !this.shouldSkipFile(fullPath)) {
            scanDir(fullPath)
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath)
          }
        }
      } catch {
        // Ignore permission errors
      }
    }
    
    scanDir(SRC_PATH)
    return files
  }

  /**
   * Check if file should be skipped
   */
  private shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '__tests__',
      '.test.',
      '.spec.',
      'generated',
      'auto-generated',
      'migrate-card-components.ts'
    ]
    
    return skipPatterns.some(pattern => filePath.includes(pattern))
  }

  /**
   * Log message
   */
  private logMessage(message: string): void {
    const timestamp = new Date().toISOString()
    this.log.push(`[${timestamp}] ${message}`)
  }

  /**
   * Get migration statistics
   */
  getStats() {
    return {
      ...this.stats,
      log: this.log
    }
  }
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const migration = new CardMigration()
  
  try {
    switch (command) {
      case 'migrate': {
        await migration.migrate()
        break
      }
      
      case 'analyze': {
        await migration.analyzeCurrentUsage()
        break
      }
      
      case 'validate': {
        await migration.validateMigration()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  migrate  - Run full card component migration')
        console.log('  analyze  - Analyze current card component usage')
        console.log('  validate - Validate migration success')
        break
      }
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { CardMigration }
