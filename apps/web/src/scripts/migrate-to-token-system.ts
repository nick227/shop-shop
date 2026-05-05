#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Token System Migration Script
 * 
 * This script helps migrate from hardcoded values to the unified token system:
 * 1. Analyzes current usage patterns
 * 2. Suggests token replacements
 * 3. Updates utility classes
 * 4. Validates token consistency
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

// ============================================
// Configuration
// ============================================

const SRC_PATH = './src'
const STYLES_PATH = './src/styles'
const UTILS_PATH = './src/utils/tailwind-classes'

// Common hardcoded value patterns to replace
const MIGRATION_PATTERNS = [
  // Colors
  {
    pattern: /bg-white/g,
    replacement: 'bg-surface-base',
    description: 'Replace hardcoded white background with semantic token'
  },
  {
    pattern: /bg-gray-100/g,
    replacement: 'bg-muted',
    description: 'Replace hardcoded gray background with semantic token'
  },
  {
    pattern: /bg-gray-200/g,
    replacement: 'bg-muted',
    description: 'Replace hardcoded gray background with semantic token'
  },
  {
    pattern: /text-gray-900/g,
    replacement: 'text-primary',
    description: 'Replace hardcoded text color with semantic token'
  },
  {
    pattern: /text-gray-600/g,
    replacement: 'text-secondary',
    description: 'Replace hardcoded text color with semantic token'
  },
  {
    pattern: /text-gray-500/g,
    replacement: 'text-tertiary',
    description: 'Replace hardcoded text color with semantic token'
  },
  {
    pattern: /border-gray-200/g,
    replacement: 'border-border',
    description: 'Replace hardcoded border color with semantic token'
  },
  {
    pattern: /border-gray-300/g,
    replacement: 'border-border',
    description: 'Replace hardcoded border color with semantic token'
  },
  
  // Spacing
  {
    pattern: /p-4/g,
    replacement: 'p-component',
    description: 'Replace hardcoded padding with semantic token'
  },
  {
    pattern: /p-6/g,
    replacement: 'p-component',
    description: 'Replace hardcoded padding with semantic token'
  },
  {
    pattern: /mb-4/g,
    replacement: 'mb-component',
    description: 'Replace hardcoded margin with semantic token'
  },
  {
    pattern: /mb-6/g,
    replacement: 'mb-component',
    description: 'Replace hardcoded margin with semantic token'
  },
  {
    pattern: /gap-2/g,
    replacement: 'gap-element',
    description: 'Replace hardcoded gap with semantic token'
  },
  {
    pattern: /gap-4/g,
    replacement: 'gap-gap',
    description: 'Replace hardcoded gap with semantic token'
  },
  
  // Typography
  {
    pattern: /text-xl/g,
    replacement: 'text-xl',
    description: 'Typography scale already uses tokens'
  },
  {
    pattern: /font-bold/g,
    replacement: 'font-bold',
    description: 'Font weights already use tokens'
  },
  
  // Shadows
  {
    pattern: /shadow-md/g,
    replacement: 'shadow-card',
    description: 'Replace generic shadow with semantic token'
  },
  {
    pattern: /shadow-lg/g,
    replacement: 'shadow-card-hover',
    description: 'Replace generic shadow with semantic token'
  },
  
  // Border radius
  {
    pattern: /rounded-lg/g,
    replacement: 'rounded-card',
    description: 'Replace generic radius with semantic token'
  },
  {
    pattern: /rounded-md/g,
    replacement: 'rounded-input',
    description: 'Replace generic radius with semantic token'
  },
]

// Component-specific patterns
const COMPONENT_PATTERNS = [
  // Button patterns
  {
    pattern: /px-4 py-2 rounded/g,
    replacement: 'button buttonMd',
    description: 'Replace button classes with semantic tokens'
  },
  {
    pattern: /bg-blue-600 text-white/g,
    replacement: 'buttonPrimary',
    description: 'Replace primary button colors with semantic tokens'
  },
  {
    pattern: /hover:bg-blue-700/g,
    replacement: 'hover:bg-brand-primary-hover',
    description: 'Replace button hover with semantic token'
  },
  
  // Card patterns
  {
    pattern: /bg-white rounded-lg border border-gray-200 p-6/g,
    replacement: 'card',
    description: 'Replace card classes with semantic tokens'
  },
  {
    pattern: /hover:shadow-md/g,
    replacement: 'hover:shadow-card-hover',
    description: 'Replace card hover with semantic token'
  },
  
  // Badge patterns
  {
    pattern: /px-2 py-1 text-xs rounded/g,
    replacement: 'badge',
    description: 'Replace badge classes with semantic tokens'
  },
  {
    pattern: /bg-blue-100 text-blue-800/g,
    replacement: 'badgePrimary',
    description: 'Replace badge colors with semantic tokens'
  },
]

// ============================================
// Migration Functions
// ============================================

class TokenMigration {
  private readonly log: string[] = []
  private readonly stats = {
    filesProcessed: 0,
    replacements: 0,
    errors: 0
  }

  /**
   * Main migration workflow
   */
  async migrate(): Promise<void> {
    console.log('🎨 Starting token system migration...')
    
    try {
      // Step 1: Analyze current usage
      await this.analyzeCurrentUsage()
      
      // Step 2: Update utility classes
      await this.updateUtilityClasses()
      
      // Step 3: Migrate component files
      await this.migrateComponentFiles()
      
      // Step 4: Validate changes
      await this.validateChanges()
      
      console.log('✅ Token migration completed successfully!')
      this.logMessage('Token migration completed successfully')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.logMessage(`Migration failed: ${error}`)
      throw error
    }
  }

  /**
   * Analyze current usage patterns
   */
  private async analyzeCurrentUsage(): Promise<void> {
    console.log('📊 Analyzing current usage patterns...')
    
    const files = this.getAllTypeScriptFiles()
    const analysis = {
      hardcodedColors: 0,
      hardcodedSpacing: 0,
      hardcodedTypography: 0,
      componentPatterns: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Count hardcoded patterns
      analysis.hardcodedColors += (content.match(/bg-(white|gray-\d+|blue-\d+|red-\d+|green-\d+|yellow-\d+)/g) || []).length
      analysis.hardcodedSpacing += (content.match(/(p|m|gap)-\d+/g) || []).length
      analysis.hardcodedTypography += (content.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/g) || []).length
      analysis.componentPatterns += (content.match(/bg-white rounded-lg border/g) || []).length
    }
    
    console.log('📈 Analysis Results:')
    console.log(`  - Hardcoded colors: ${analysis.hardcodedColors}`)
    console.log(`  - Hardcoded spacing: ${analysis.hardcodedSpacing}`)
    console.log(`  - Hardcoded typography: ${analysis.hardcodedTypography}`)
    console.log(`  - Component patterns: ${analysis.componentPatterns}`)
    
    this.logMessage(`Analysis completed: ${JSON.stringify(analysis)}`)
  }

  /**
   * Update utility classes to use tokens
   */
  private async updateUtilityClasses(): Promise<void> {
    console.log('🔧 Updating utility classes...')
    
    const utilityFiles = [
      'components.ts',
      'forms.ts',
      'layout.ts',
      'lists.ts',
      'states.ts',
      'utilities.ts'
    ]
    
    for (const file of utilityFiles) {
      const filePath = join(UTILS_PATH, file)
      if (!existsSync(filePath)) continue
      
      let content = readFileSync(filePath, 'utf-8')
      let hasChanges = false
      
      // Apply migration patterns
      for (const pattern of MIGRATION_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement)
          hasChanges = true
          this.stats.replacements++
        }
      }
      
      // Apply component patterns
      for (const pattern of COMPONENT_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement)
          hasChanges = true
          this.stats.replacements++
        }
      }
      
      if (hasChanges) {
        writeFileSync(filePath, content)
        console.log(`  ✅ Updated ${file}`)
        this.logMessage(`Updated utility file: ${file}`)
      }
    }
  }

  /**
   * Migrate component files
   */
  private async migrateComponentFiles(): Promise<void> {
    console.log('🔄 Migrating component files...')
    
    const files = this.getAllTypeScriptFiles()
    let migratedCount = 0
    
    for (const file of files) {
      if (this.shouldSkipFile(file)) continue
      
      const migrated = await this.migrateFile(file)
      if (migrated) {
        migratedCount++
        console.log(`  ✅ Migrated ${file}`)
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} component files`)
  }

  /**
   * Migrate a single file
   */
  private async migrateFile(filePath: string): Promise<boolean> {
    try {
      let content = readFileSync(filePath, 'utf-8')
      let hasChanges = false
      
      // Apply migration patterns
      for (const pattern of MIGRATION_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement)
          hasChanges = true
          this.stats.replacements++
        }
      }
      
      // Apply component patterns
      for (const pattern of COMPONENT_PATTERNS) {
        if (pattern.pattern.test(content)) {
          content = content.replace(pattern.pattern, pattern.replacement)
          hasChanges = true
          this.stats.replacements++
        }
      }
      
      if (hasChanges) {
        writeFileSync(filePath, content)
        this.stats.filesProcessed++
        return true
      }
      
      return false
      
    } catch (error) {
      console.warn(`⚠️ Could not migrate ${filePath}:`, error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Validate changes
   */
  private async validateChanges(): Promise<void> {
    console.log('✅ Validating changes...')
    
    // Check for remaining hardcoded values
    const files = this.getAllTypeScriptFiles()
    const remainingHardcoded = {
      colors: 0,
      spacing: 0,
      patterns: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      remainingHardcoded.colors += (content.match(/bg-(white|gray-\d+|blue-\d+)/g) || []).length
      remainingHardcoded.spacing += (content.match(/(p|m|gap)-\d+/g) || []).length
      remainingHardcoded.patterns += (content.match(/bg-white rounded-lg border/g) || []).length
    }
    
    console.log('📊 Remaining hardcoded values:')
    console.log(`  - Colors: ${remainingHardcoded.colors}`)
    console.log(`  - Spacing: ${remainingHardcoded.spacing}`)
    console.log(`  - Patterns: ${remainingHardcoded.patterns}`)
    
    this.logMessage(`Validation completed: ${JSON.stringify(remainingHardcoded)}`)
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
      'migrate-to-token-system.ts'
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
  
  const migration = new TokenMigration()
  
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
        await migration.validateChanges()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  migrate  - Run full migration to token system')
        console.log('  analyze  - Analyze current usage patterns')
        console.log('  validate - Validate token consistency')
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

export { TokenMigration }
