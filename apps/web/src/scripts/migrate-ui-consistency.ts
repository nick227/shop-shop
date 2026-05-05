#!/usr/bin/env tsx
// @ts-nocheck

/**
 * UI Consistency Migration Script
 * 
 * This script helps migrate from inconsistent UI patterns to the unified system:
 * 1. Analyzes current UI patterns and inconsistencies
 * 2. Suggests migration patterns for components
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

// UI consistency migration mappings
const UI_MIGRATIONS = [
  // Loading state migrations
  {
    from: 'components/ui/Spinner/Spinner',
    to: 'components/ui/States/LoadingStates',
    type: 'LoadingStates',
    pattern: 'Spinner',
    replacement: 'LoadingStates.Inline'
  },
  {
    from: 'components/ui/LoadingState/LoadingState',
    to: 'components/ui/States/LoadingStates',
    type: 'LoadingStates',
    pattern: 'LoadingState',
    replacement: 'LoadingStates.Content'
  },
  {
    from: 'components/ui/DataState/DataState',
    to: 'components/ui/States/LoadingStates',
    type: 'LoadingStates',
    pattern: 'SkeletonList',
    replacement: 'LoadingStates.SkeletonList'
  },
  
  // Error state migrations
  {
    from: 'components/ui/ErrorState/ErrorState',
    to: 'components/ui/States/ErrorStates',
    type: 'ErrorStates',
    pattern: 'ErrorState',
    replacement: 'ErrorStates.Page'
  },
  {
    from: 'components/ui/Alert/Alert',
    to: 'components/ui/States/ErrorStates',
    type: 'ErrorStates',
    pattern: 'Alert',
    replacement: 'ErrorStates.Banner'
  },
  
  // Button migrations
  {
    from: 'components/ui/Button/Button',
    to: 'components/ui/Button/Button.enhanced',
    type: 'EnhancedButton',
    pattern: 'Button',
    replacement: 'EnhancedButton'
  },
  
  // Container migrations
  {
    from: 'components/ui/Container',
    to: 'components/ui/Layout/Container',
    type: 'Container',
    pattern: 'Container',
    replacement: 'Container'
  }
]

// ============================================
// Migration Functions
// ============================================

class UIConsistencyMigration {
  private readonly log: string[] = []
  private readonly stats = {
    filesProcessed: 0,
    importsUpdated: 0,
    componentsReplaced: 0,
    patternsFixed: 0,
    errors: 0
  }

  /**
   * Main migration workflow
   */
  async migrate(): Promise<void> {
    console.log('🎨 Starting UI consistency migration...')
    
    try {
      // Step 1: Analyze current UI patterns
      await this.analyzeCurrentPatterns()
      
      // Step 2: Update imports
      await this.updateImports()
      
      // Step 3: Replace component usage
      await this.replaceComponentUsage()
      
      // Step 4: Fix common patterns
      await this.fixCommonPatterns()
      
      // Step 5: Validate migration
      await this.validateMigration()
      
      console.log('✅ UI consistency migration completed successfully!')
      this.logMessage('UI consistency migration completed successfully')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.logMessage(`Migration failed: ${error}`)
      throw error
    }
  }

  /**
   * Analyze current UI patterns and inconsistencies
   */
  private async analyzeCurrentPatterns(): Promise<void> {
    console.log('📊 Analyzing current UI patterns...')
    
    const files = this.getAllTypeScriptFiles()
    const patterns = {
      loadingStates: 0,
      errorStates: 0,
      buttonVariants: 0,
      hardcodedSpacing: 0,
      inconsistentSizing: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Count UI patterns
      if (content.includes('Spinner') || content.includes('LoadingState')) patterns.loadingStates++
      if (content.includes('ErrorState') || content.includes('Alert')) patterns.errorStates++
      if (content.includes('Button')) patterns.buttonVariants++
      if (content.includes('p-') || content.includes('m-') || content.includes('px-') || content.includes('py-')) patterns.hardcodedSpacing++
      if (content.includes('h-') || content.includes('w-') || content.includes('text-')) patterns.inconsistentSizing++
    }
    
    console.log('📈 Current UI Patterns:')
    console.log(`  - Loading States: ${patterns.loadingStates} files`)
    console.log(`  - Error States: ${patterns.errorStates} files`)
    console.log(`  - Button Variants: ${patterns.buttonVariants} files`)
    console.log(`  - Hardcoded Spacing: ${patterns.hardcodedSpacing} files`)
    console.log(`  - Inconsistent Sizing: ${patterns.inconsistentSizing} files`)
    
    this.logMessage(`Pattern analysis: ${JSON.stringify(patterns)}`)
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
      
      // Update imports for each UI component
      for (const migration of UI_MIGRATIONS) {
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
        // Loading state replacements
        {
          pattern: /<Spinner\s+([^>]+)\s*\/>/g,
          replacement: '<LoadingStates.Inline $1 />'
        },
        {
          pattern: /<LoadingState\s+([^>]+)\s*\/>/g,
          replacement: '<LoadingStates.Content $1 />'
        },
        {
          pattern: /<SkeletonList\s+([^>]+)\s*\/>/g,
          replacement: '<LoadingStates.SkeletonList $1 />'
        },
        
        // Error state replacements
        {
          pattern: /<ErrorState\s+([^>]+)\s*\/>/g,
          replacement: '<ErrorStates.Page $1 />'
        },
        {
          pattern: /<Alert\s+([^>]+)\s*\/>/g,
          replacement: '<ErrorStates.Banner $1 />'
        },
        
        // Button replacements
        {
          pattern: /<Button\s+([^>]+)\s*\/>/g,
          replacement: '<EnhancedButton $1 />'
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
   * Fix common UI patterns
   */
  private async fixCommonPatterns(): Promise<void> {
    console.log('🔧 Fixing common UI patterns...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Fix common patterns
      const patternFixes = [
        // Fix hardcoded spacing
        {
          pattern: /className="[^"]*p-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded padding with semantic spacing
            return match.replaceAll(/p-(\d+)/g, 'p-4') // Default to p-4
          }
        },
        {
          pattern: /className="[^"]*m-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded margin with semantic spacing
            return match.replaceAll(/m-(\d+)/g, 'm-4') // Default to m-4
          }
        },
        
        // Fix inconsistent sizing
        {
          pattern: /className="[^"]*h-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded heights with semantic sizing
            return match.replaceAll(/h-(\d+)/g, 'h-10') // Default to h-10
          }
        },
        {
          pattern: /className="[^"]*w-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded widths with semantic sizing
            return match.replaceAll(/w-(\d+)/g, 'w-full') // Default to w-full
          }
        },
        
        // Fix inconsistent text sizing
        {
          pattern: /className="[^"]*text-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded text sizes with semantic sizing
            return match.replaceAll(/text-(\d+)/g, 'text-base') // Default to text-base
          }
        }
      ]
      
      for (const fix of patternFixes) {
        if (fix.pattern.test(content)) {
          content = content.replace(fix.pattern, fix.replacement)
          hasChanges = true
          this.stats.patternsFixed++
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedFiles++
        console.log(`  ✅ Fixed patterns in ${file}`)
        this.logMessage(`Fixed patterns in ${file}`)
      }
    }
    
    console.log(`✅ Fixed patterns in ${updatedFiles} files`)
  }

  /**
   * Validate migration success
   */
  private async validateMigration(): Promise<void> {
    console.log('✅ Validating migration...')
    
    const files = this.getAllTypeScriptFiles()
    const remainingIssues = {
      oldImports: 0,
      hardcodedValues: 0,
      inconsistentPatterns: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Check for remaining old imports
      if (content.includes('components/ui/Spinner') || 
          content.includes('components/ui/LoadingState') ||
          content.includes('components/ui/ErrorState')) {
        remainingIssues.oldImports++
      }
      
      // Check for hardcoded values
      if (content.includes('p-') || content.includes('m-') || 
          content.includes('h-') || content.includes('w-')) {
        remainingIssues.hardcodedValues++
      }
      
      // Check for inconsistent patterns
      if (content.includes('className=') && content.includes(' ')) {
        remainingIssues.inconsistentPatterns++
      }
    }
    
    console.log('📊 Remaining Issues:')
    console.log(`  - Old Imports: ${remainingIssues.oldImports}`)
    console.log(`  - Hardcoded Values: ${remainingIssues.hardcodedValues}`)
    console.log(`  - Inconsistent Patterns: ${remainingIssues.inconsistentPatterns}`)
    
    this.logMessage(`Validation completed: ${JSON.stringify(remainingIssues)}`)
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
      'migrate-ui-consistency.ts'
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
  
  const migration = new UIConsistencyMigration()
  
  try {
    switch (command) {
      case 'migrate': {
        await migration.migrate()
        break
      }
      
      case 'analyze': {
        await migration.analyzeCurrentPatterns()
        break
      }
      
      case 'validate': {
        await migration.validateMigration()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  migrate  - Run full UI consistency migration')
        console.log('  analyze  - Analyze current UI patterns')
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

export { UIConsistencyMigration }
