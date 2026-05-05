#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Layout Consistency Migration Script
 * 
 * This script helps migrate from inconsistent layout patterns to the unified system:
 * 1. Analyzes current layout patterns and inconsistencies
 * 2. Suggests migration patterns for layouts and pages
 * 3. Updates imports and component usage
 * 4. Validates migration success
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

// ============================================
// Configuration
// ============================================

const SRC_PATH = './src'
const LAYOUTS_PATH = './src/layouts'
const PAGES_PATH = './src/pages'
const COMPONENTS_PATH = './src/components'

// Layout consistency migration mappings
const LAYOUT_MIGRATIONS = [
  // Layout component migrations
  {
    from: 'layouts/MainLayout/Layout',
    to: 'layouts/UnifiedLayout/UnifiedLayout',
    type: 'UnifiedLayout',
    pattern: 'Layout',
    replacement: 'UnifiedLayout'
  },
  {
    from: 'layouts/VendorLayout/VendorLayout',
    to: 'layouts/UnifiedLayout/UnifiedLayout',
    type: 'UnifiedLayout',
    pattern: 'VendorLayout',
    replacement: 'AdminLayout'
  },
  {
    from: 'layouts/CustomerLayout/CustomerLayout',
    to: 'layouts/UnifiedLayout/UnifiedLayout',
    type: 'UnifiedLayout',
    pattern: 'CustomerLayout',
    replacement: 'AppLayout'
  },
  {
    from: 'layouts/MobileShell/MobileShell',
    to: 'layouts/UnifiedLayout/UnifiedLayout',
    type: 'UnifiedLayout',
    pattern: 'MobileShell',
    replacement: 'MobileLayout'
  },
  
  // Page template migrations
  {
    from: 'components/templates/FormPageTemplate',
    to: 'components/layout/PageTemplates/FormPageTemplate',
    type: 'FormPageTemplate',
    pattern: 'FormPageTemplate',
    replacement: 'FormPageTemplate'
  },
  
  // Header component migrations
  {
    from: 'layouts/PageHeader/PageHeader',
    to: 'layouts/UnifiedLayout/components/UnifiedHeader',
    type: 'UnifiedHeader',
    pattern: 'PageHeader',
    replacement: 'UnifiedHeader'
  }
]

// ============================================
// Migration Functions
// ============================================

class LayoutConsistencyMigration {
  private readonly log: string[] = []
  private readonly stats = {
    filesProcessed: 0,
    layoutsUpdated: 0,
    pagesUpdated: 0,
    componentsUpdated: 0,
    patternsFixed: 0,
    errors: 0
  }

  /**
   * Main migration workflow
   */
  async migrate(): Promise<void> {
    console.log('🎨 Starting layout consistency migration...')
    
    try {
      // Step 1: Analyze current layout patterns
      await this.analyzeCurrentLayouts()
      
      // Step 2: Update layout imports
      await this.updateLayoutImports()
      
      // Step 3: Replace layout usage
      await this.replaceLayoutUsage()
      
      // Step 4: Fix common layout patterns
      await this.fixCommonLayoutPatterns()
      
      // Step 5: Validate migration
      await this.validateMigration()
      
      console.log('✅ Layout consistency migration completed successfully!')
      this.logMessage('Layout consistency migration completed successfully')
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.logMessage(`Migration failed: ${error}`)
      throw error
    }
  }

  /**
   * Analyze current layout patterns and inconsistencies
   */
  private async analyzeCurrentLayouts(): Promise<void> {
    console.log('📊 Analyzing current layout patterns...')
    
    const files = this.getAllTypeScriptFiles()
    const patterns = {
      layoutComponents: 0,
      pageTemplates: 0,
      headerComponents: 0,
      navigationComponents: 0,
      hardcodedLayouts: 0,
      inconsistentSpacing: 0
    }
    
    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      
      // Count layout patterns
      if (content.includes('Layout') || content.includes('layout')) patterns.layoutComponents++
      if (content.includes('Template') || content.includes('template')) patterns.pageTemplates++
      if (content.includes('Header') || content.includes('header')) patterns.headerComponents++
      if (content.includes('Navigation') || content.includes('navigation')) patterns.navigationComponents++
      if (content.includes('max-w-') || content.includes('px-') || content.includes('py-')) patterns.hardcodedLayouts++
      if (content.includes('className=') && content.includes(' ')) patterns.inconsistentSpacing++
    }
    
    console.log('📈 Current Layout Patterns:')
    console.log(`  - Layout Components: ${patterns.layoutComponents} files`)
    console.log(`  - Page Templates: ${patterns.pageTemplates} files`)
    console.log(`  - Header Components: ${patterns.headerComponents} files`)
    console.log(`  - Navigation Components: ${patterns.navigationComponents} files`)
    console.log(`  - Hardcoded Layouts: ${patterns.hardcodedLayouts} files`)
    console.log(`  - Inconsistent Spacing: ${patterns.inconsistentSpacing} files`)
    
    this.logMessage(`Layout analysis: ${JSON.stringify(patterns)}`)
  }

  /**
   * Update layout imports across all files
   */
  private async updateLayoutImports(): Promise<void> {
    console.log('🔄 Updating layout imports...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Update imports for each layout component
      for (const migration of LAYOUT_MIGRATIONS) {
        const oldImport = `from '${migration.from}'`
        const newImport = `from '${migration.to}'`
        
        if (content.includes(oldImport)) {
          content = content.replaceAll(new RegExp(oldImport, 'g'), newImport)
          hasChanges = true
          this.stats.layoutsUpdated++
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedFiles++
        console.log(`  ✅ Updated layout imports in ${file}`)
        this.logMessage(`Updated layout imports in ${file}`)
      }
    }
    
    console.log(`✅ Updated layout imports in ${updatedFiles} files`)
  }

  /**
   * Replace layout usage with new unified components
   */
  private async replaceLayoutUsage(): Promise<void> {
    console.log('🔄 Replacing layout usage...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Replace layout usage patterns
      const replacements = [
        // Layout component replacements
        {
          pattern: /<Layout\s+([^>]+)\s*\/>/g,
          replacement: '<UnifiedLayout $1 />'
        },
        {
          pattern: /<VendorLayout\s+([^>]+)\s*\/>/g,
          replacement: '<AdminLayout $1 />'
        },
        {
          pattern: /<CustomerLayout\s+([^>]+)\s*\/>/g,
          replacement: '<AppLayout $1 />'
        },
        {
          pattern: /<MobileShell\s+([^>]+)\s*\/>/g,
          replacement: '<MobileLayout $1 />'
        },
        
        // Header component replacements
        {
          pattern: /<PageHeader\s+([^>]+)\s*\/>/g,
          replacement: '<UnifiedHeader $1 />'
        }
      ]
      
      for (const replacement of replacements) {
        if (replacement.pattern.test(content)) {
          content = content.replace(replacement.pattern, replacement.replacement)
          hasChanges = true
          this.stats.componentsUpdated++
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedFiles++
        console.log(`  ✅ Updated layout usage in ${file}`)
        this.logMessage(`Updated layout usage in ${file}`)
      }
    }
    
    console.log(`✅ Updated layout usage in ${updatedFiles} files`)
  }

  /**
   * Fix common layout patterns
   */
  private async fixCommonLayoutPatterns(): Promise<void> {
    console.log('🔧 Fixing common layout patterns...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedFiles = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Fix common layout patterns
      const patternFixes = [
        // Fix hardcoded max-widths
        {
          pattern: /className="[^"]*max-w-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded max-widths with semantic values
            return match.replaceAll(/max-w-(\d+)/g, 'max-w-4xl') // Default to max-w-4xl
          }
        },
        
        // Fix hardcoded padding
        {
          pattern: /className="[^"]*p-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded padding with semantic values
            return match.replaceAll(/p-(\d+)/g, 'p-6') // Default to p-6
          }
        },
        
        // Fix hardcoded margins
        {
          pattern: /className="[^"]*m-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded margins with semantic values
            return match.replaceAll(/m-(\d+)/g, 'm-4') // Default to m-4
          }
        },
        
        // Fix hardcoded gaps
        {
          pattern: /className="[^"]*gap-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded gaps with semantic values
            return match.replaceAll(/gap-(\d+)/g, 'gap-4') // Default to gap-4
          }
        },
        
        // Fix hardcoded heights
        {
          pattern: /className="[^"]*h-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded heights with semantic values
            return match.replaceAll(/h-(\d+)/g, 'h-16') // Default to h-16
          }
        },
        
        // Fix hardcoded widths
        {
          pattern: /className="[^"]*w-\d+[^"]*"/g,
          replacement: (match: string) => {
            // Replace hardcoded widths with semantic values
            return match.replaceAll(/w-(\d+)/g, 'w-full') // Default to w-full
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
        console.log(`  ✅ Fixed layout patterns in ${file}`)
        this.logMessage(`Fixed layout patterns in ${file}`)
      }
    }
    
    console.log(`✅ Fixed layout patterns in ${updatedFiles} files`)
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
      if (content.includes('layouts/MainLayout') || 
          content.includes('layouts/VendorLayout') ||
          content.includes('layouts/CustomerLayout') ||
          content.includes('layouts/MobileShell')) {
        remainingIssues.oldImports++
      }
      
      // Check for hardcoded values
      if (content.includes('max-w-') || content.includes('p-') || 
          content.includes('m-') || content.includes('gap-')) {
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
      'migrate-layout-consistency.ts'
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
  
  const migration = new LayoutConsistencyMigration()
  
  try {
    switch (command) {
      case 'migrate': {
        await migration.migrate()
        break
      }
      
      case 'analyze': {
        await migration.analyzeCurrentLayouts()
        break
      }
      
      case 'validate': {
        await migration.validateMigration()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  migrate  - Run full layout consistency migration')
        console.log('  analyze  - Analyze current layout patterns')
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

export { LayoutConsistencyMigration }
