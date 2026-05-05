#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Redundancy Cleanup Script
 * 
 * This script automates the removal of redundant and legacy code:
 * 1. Identifies deprecated files and code
 * 2. Removes duplicate type definitions
 * 3. Updates imports to use centralized types
 * 4. Replaces console logs with proper logging
 * 5. Removes unused code
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execSync } from 'node:child_process'

// ============================================
// Configuration
// ============================================

const CONFIG = {
  srcPath: './src',
  backupDir: './cleanup-backups',
  logFile: './cleanup-log.txt'
}

// Files to remove (deprecated)
const DEPRECATED_FILES = [
  'api/schemas.ts',
  'utils/validation.ts', 
  'hooks/useFormValidation.ts',
  'features/stores/components/StoreList/StoreList.tsx'
]

// Directories to remove (deprecated)
const DEPRECATED_DIRS = [
  'features/stores/components/StoreList'
]

// Import replacements
const IMPORT_REPLACEMENTS = [
  {
    from: /from ["']\.\.\/\.\.\/api\/backend-types["']/g,
    to: "from '@api/types'"
  },
  {
    from: /from ["']\.\.\/\.\.\/types\/sdk-augmentations["']/g,
    to: "from '@api/types'"
  },
  {
    from: /from ["']\.\.\/api\/backend-types["']/g,
    to: "from '@api/types'"
  },
  {
    from: /from ["']\.\.\/types\/sdk-augmentations["']/g,
    to: "from '@api/types'"
  },
  {
    from: /from ["']@\/api\/backend-types["']/g,
    to: "from '@api/types'"
  },
  {
    from: /from ["']@\/types\/sdk-augmentations["']/g,
    to: "from '@api/types'"
  }
]

// Console log replacements
const CONSOLE_REPLACEMENTS = [
  {
    from: /console\.log\(/g,
    to: 'logger.info('
  },
  {
    from: /console\.warn\(/g,
    to: 'logger.warn('
  },
  {
    from: /console\.error\(/g,
    to: 'logger.error('
  }
]

// ============================================
// Cleanup Operations
// ============================================

class RedundancyCleanup {
  private readonly log: string[] = []

  /**
   * Main cleanup workflow
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Starting redundancy cleanup...')
    
    try {
      // Step 1: Create backup
      await this.createBackup()
      
      // Step 2: Remove deprecated files
      await this.removeDeprecatedFiles()
      
      // Step 3: Update imports
      await this.updateImports()
      
      // Step 4: Replace console logs
      await this.replaceConsoleLogs()
      
      // Step 5: Remove unused code
      await this.removeUnusedCode()
      
      // Step 6: Validate changes
      await this.validateChanges()
      
      console.log('✅ Cleanup completed successfully!')
      this.logMessage('Cleanup completed successfully')
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      this.logMessage(`Cleanup failed: ${error}`)
      throw error
    }
  }

  /**
   * Create backup of current state
   */
  private async createBackup(): Promise<void> {
    console.log('📦 Creating backup...')
    
    const timestamp = new Date().toISOString().replaceAll(/[.:]/g, '-')
    const backupPath = join(CONFIG.backupDir, `backup-${timestamp}`)
    
    // Create backup directory
    execSync(`mkdir -p ${backupPath}`)
    
    // Backup entire src directory
    execSync(`cp -r ${CONFIG.srcPath} ${backupPath}/`)
    
    console.log(`✅ Backup created at ${backupPath}`)
    this.logMessage(`Backup created at ${backupPath}`)
  }

  /**
   * Remove deprecated files and directories
   */
  private async removeDeprecatedFiles(): Promise<void> {
    console.log('🗑️ Removing deprecated files...')
    
    // Remove deprecated files
    for (const file of DEPRECATED_FILES) {
      const filePath = join(CONFIG.srcPath, file)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
        console.log(`  ✅ Removed ${file}`)
        this.logMessage(`Removed deprecated file: ${file}`)
      }
    }
    
    // Remove deprecated directories
    for (const dir of DEPRECATED_DIRS) {
      const dirPath = join(CONFIG.srcPath, dir)
      if (existsSync(dirPath)) {
        execSync(`rm -rf ${dirPath}`)
        console.log(`  ✅ Removed directory ${dir}`)
        this.logMessage(`Removed deprecated directory: ${dir}`)
      }
    }
  }

  /**
   * Update imports to use centralized types
   */
  private async updateImports(): Promise<void> {
    console.log('🔄 Updating imports...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedCount = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Apply import replacements
      for (const replacement of IMPORT_REPLACEMENTS) {
        if (replacement.from.test(content)) {
          content = content.replace(replacement.from, replacement.to)
          hasChanges = true
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedCount++
        console.log(`  ✅ Updated imports in ${file}`)
        this.logMessage(`Updated imports in: ${file}`)
      }
    }
    
    console.log(`✅ Updated imports in ${updatedCount} files`)
  }

  /**
   * Replace console logs with proper logging
   */
  private async replaceConsoleLogs(): Promise<void> {
    console.log('📝 Replacing console logs...')
    
    const files = this.getAllTypeScriptFiles()
    let updatedCount = 0
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      let hasChanges = false
      
      // Check if file has console logs
      if (/console\.(log|warn|error)\(/.test(content)) {
        // Add logger import if not present
        if (!content.includes('import { logger }')) {
          const importMatch = /import.*from.*["']@\/utils\/logger["']/.exec(content)
          if (!importMatch) {
            // Add logger import at the top
            const lines = content.split('\n')
            const lastImportIndex = lines.findLastIndex(line => line.startsWith('import'))
            if (lastImportIndex >= 0) {
              lines.splice(lastImportIndex + 1, 0, "import { logger } from '@shared/lib/logger'")
              content = lines.join('\n')
              hasChanges = true
            }
          }
        }
        
        // Replace console logs
        for (const replacement of CONSOLE_REPLACEMENTS) {
          if (replacement.from.test(content)) {
            content = content.replace(replacement.from, replacement.to)
            hasChanges = true
          }
        }
      }
      
      if (hasChanges) {
        writeFileSync(file, content)
        updatedCount++
        console.log(`  ✅ Updated console logs in ${file}`)
        this.logMessage(`Updated console logs in: ${file}`)
      }
    }
    
    console.log(`✅ Updated console logs in ${updatedCount} files`)
  }

  /**
   * Remove unused code
   */
  private async removeUnusedCode(): Promise<void> {
    console.log('🧹 Removing unused code...')
    
    try {
      // Find unused exports
      const result = execSync('npx ts-unused-exports tsconfig.json --excludePathsFromReport=node_modules', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      })
      
      if (result.trim()) {
        console.log('  📋 Found unused exports:')
        console.log(result)
        this.logMessage(`Found unused exports:\n${result}`)
      }
      
    } catch {
      console.log('  ⚠️ Could not check for unused exports (ts-unused-exports not available)')
      this.logMessage('Could not check for unused exports')
    }
  }

  /**
   * Validate changes
   */
  private async validateChanges(): Promise<void> {
    console.log('✅ Validating changes...')
    
    try {
      // Run TypeScript compiler
      execSync('npx tsc --noEmit', { stdio: 'inherit' })
      console.log('  ✅ TypeScript validation passed')
      
      // Run ESLint
      execSync('npx eslint src --ext .ts,.tsx', { stdio: 'inherit' })
      console.log('  ✅ ESLint validation passed')
      
    } catch (error) {
      console.error('  ❌ Validation failed:', error)
      this.logMessage(`Validation failed: ${error}`)
      throw error
    }
  }

  /**
   * Get all TypeScript files
   */
  private getAllTypeScriptFiles(): string[] {
    const files: string[] = []
    
    const scanDir = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath)
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath)
        }
      }
    }
    
    scanDir(CONFIG.srcPath)
    return files
  }

  /**
   * Log message
   */
  private logMessage(message: string): void {
    const timestamp = new Date().toISOString()
    this.log.push(`[${timestamp}] ${message}`)
  }

  /**
   * Save log to file
   */
  private saveLog(): void {
    writeFileSync(CONFIG.logFile, this.log.join('\n'))
  }
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const cleanup = new RedundancyCleanup()
  
  try {
    switch (command) {
      case 'cleanup': {
        await cleanup.cleanup()
        break
      }
      
      case 'validate': {
        await cleanup.validateChanges()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  cleanup  - Remove redundant and legacy code')
        console.log('  validate - Validate current codebase')
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

export { RedundancyCleanup }
