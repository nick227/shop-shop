#!/usr/bin/env tsx
/**
 * Simple Validation Script
 * 
 * Basic validation of critical issues:
 * - File existence
 * - TypeScript compilation
 * - Basic type safety
 */

import { existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class SimpleValidator {
  private errors: string[] = []
  private warnings: string[] = []

  addError(message: string): void {
    this.errors.push(message)
  }

  addWarning(message: string): void {
    this.warnings.push(message)
  }

  /**
   * Check if critical files exist
   */
  checkFiles(): void {
    console.log('🔍 Checking critical files...')
    
    const baseDir = resolve(__dirname, '../..')
    const files = [
      'apps/web/src/api/apiWrapper.ts',
      'apps/web/src/api/backend-types.ts',
      'packages/schemas/src/frontend-contracts.ts',
      'packages/sdk/scripts/resource-config.ts'
    ]
    
    let allExist = true
    
    for (const file of files) {
      const fullPath = join(baseDir, file)
      if (existsSync(fullPath)) {
        console.log(`✅ ${file}`)
      } else {
        console.log(`❌ ${file}`)
        this.addError(`Missing file: ${file}`)
        allExist = false
      }
    }
    
    if (allExist) {
      console.log('✅ All critical files exist')
    }
  }

  /**
   * Check TypeScript compilation
   */
  checkTypeScript(): void {
    console.log('🔍 Checking TypeScript compilation...')
    
    try {
      const webAppDir = join(__dirname, '../../apps/web')
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        cwd: webAppDir
      })
      console.log('✅ TypeScript compilation successful')
    } catch (error) {
      console.log('❌ TypeScript compilation failed')
      this.addError('TypeScript compilation failed - check for type errors')
    }
  }

  /**
   * Check for any types in critical files
   */
  checkAnyTypes(): void {
    console.log('🔍 Checking for any types...')
    
    const baseDir = resolve(__dirname, '../..')
    const criticalFiles = [
      'apps/web/src/api/apiWrapper.ts',
      'apps/web/src/api/backend-types.ts',
      'apps/web/src/api/types.ts'
    ]
    
    let anyCount = 0
    
    for (const file of criticalFiles) {
      const fullPath = join(baseDir, file)
      if (existsSync(fullPath)) {
        try {
          const content = require('fs').readFileSync(fullPath, 'utf-8')
          const anyMatches = content.match(/: any\b/g)
          if (anyMatches) {
            anyCount += anyMatches.length
            console.log(`⚠️  Found ${anyMatches.length} 'any' types in ${file}`)
          }
        } catch (error) {
          // Ignore file read errors
        }
      }
    }
    
    if (anyCount === 0) {
      console.log('✅ No any types found in critical files')
    } else {
      this.addWarning(`Found ${anyCount} 'any' types in critical files`)
    }
  }

  /**
   * Run all validations
   */
  run(): void {
    console.log('🚀 Starting simple validation...')
    console.log('')
    
    this.checkFiles()
    console.log('')
    this.checkTypeScript()
    console.log('')
    this.checkAnyTypes()
    console.log('')
    
    // Print summary
    console.log('📊 Validation Summary')
    console.log('====================')
    console.log(`Errors: ${this.errors.length}`)
    console.log(`Warnings: ${this.warnings.length}`)
    
    if (this.errors.length > 0) {
      console.log('')
      console.log('❌ Errors:')
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    if (this.warnings.length > 0) {
      console.log('')
      console.log('⚠️  Warnings:')
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }
    
    if (this.errors.length === 0) {
      console.log('')
      console.log('🎉 Validation passed!')
      console.log('✅ No critical errors found')
    } else {
      console.log('')
      console.log('❌ Validation failed!')
      console.log('🔧 Please fix the errors above')
    }
  }
}

// Run validation
const validator = new SimpleValidator()
validator.run()

// Exit with error code if there are errors
if (validator['errors'].length > 0) {
  process.exit(1)
}
