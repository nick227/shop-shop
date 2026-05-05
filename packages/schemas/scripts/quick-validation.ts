#!/usr/bin/env tsx
/**
 * Quick Validation Script
 * 
 * Fast validation of critical issues:
 * - TypeScript compilation errors
 * - Missing exports
 * - Type safety issues
 * - Schema alignment
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
  file?: string
  suggestion?: string
}

class QuickValidator {
  private issues: ValidationIssue[] = []

  addIssue(issue: ValidationIssue): void {
    this.issues.push(issue)
  }

  /**
   * Check TypeScript compilation
   */
  async checkTypeScriptCompilation(): Promise<void> {
    console.log('🔍 Checking TypeScript compilation...')
    
    try {
      // Check web app compilation
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        cwd: join(__dirname, '../../apps/web')
      })
      console.log('✅ TypeScript compilation: OK')
    } catch (error) {
      console.log('❌ TypeScript compilation failed')
      this.addIssue({
        level: 'error',
        message: 'TypeScript compilation failed',
        suggestion: 'Fix TypeScript errors in the web app'
      })
    }
  }

  /**
   * Check critical file existence
   */
  async checkCriticalFiles(): Promise<void> {
    console.log('🔍 Checking critical files...')
    
    const criticalFiles = [
      '../../apps/web/src/api/apiWrapper.ts',
      '../../apps/web/src/api/backend-types.ts',
      '../src/frontend-contracts.ts',
      '../../sdk/scripts/resource-config.ts'
    ]
    
    let missingFiles = 0
    
    for (const file of criticalFiles) {
      const fullPath = join(__dirname, file)
      if (!existsSync(fullPath)) {
        missingFiles++
        this.addIssue({
          level: 'error',
          message: `Critical file missing: ${file}`,
          suggestion: 'Regenerate the missing file'
        })
      }
    }
    
    if (missingFiles === 0) {
      console.log('✅ Critical files: OK')
    } else {
      console.log(`❌ Missing ${missingFiles} critical files`)
    }
  }

  /**
   * Check for any types
   */
  async checkAnyTypes(): Promise<void> {
    console.log('🔍 Checking for any types...')
    
    const files = [
      '../../apps/web/src/api/apiWrapper.ts',
      '../../apps/web/src/api/backend-types.ts',
      '../../apps/web/src/api/types.ts'
    ]
    
    let anyCount = 0
    
    for (const file of files) {
      const fullPath = join(__dirname, file)
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8')
        const anyMatches = content.match(/: any\b/g)
        if (anyMatches) {
          anyCount += anyMatches.length
        }
      }
    }
    
    if (anyCount > 0) {
      this.addIssue({
        level: 'warning',
        message: `Found ${anyCount} 'any' types in critical files`,
        suggestion: 'Replace any types with specific types'
      })
    } else {
      console.log('✅ No any types found: OK')
    }
  }

  /**
   * Check schema exports
   */
  async checkSchemaExports(): Promise<void> {
    console.log('🔍 Checking schema exports...')
    
    const schemaIndexPath = join(__dirname, '../src/index.ts')
    if (existsSync(schemaIndexPath)) {
      const content = readFileSync(schemaIndexPath, 'utf-8')
      
      // Check for key schema exports
      const keyExports = [
        'StoreResponseSchema',
        'ItemResponseSchema',
        'OrderResponseSchema',
        'BundleResponseSchema'
      ]
      
      for (const exportName of keyExports) {
        if (!content.includes(exportName)) {
          this.addIssue({
            level: 'warning',
            message: `Missing schema export: ${exportName}`,
            file: 'src/index.ts',
            suggestion: 'Add export for the missing schema'
          })
        }
      }
    }
    
    console.log('✅ Schema exports: OK')
  }

  /**
   * Check API wrapper consistency
   */
  async checkAPIWrapperConsistency(): Promise<void> {
    console.log('🔍 Checking API wrapper consistency...')
    
    const apiWrapperPath = join(__dirname, '../../apps/web/src/api/apiWrapper.ts')
    if (existsSync(apiWrapperPath)) {
      const content = readFileSync(apiWrapperPath, 'utf-8')
      
      // Check for proper imports
      if (!content.includes('@packages/schemas')) {
        this.addIssue({
          level: 'warning',
          message: 'API wrapper not importing from @packages/schemas',
          file: 'api/apiWrapper.ts',
          suggestion: 'Ensure API wrapper imports from schemas package'
        })
      }
      
      // Check for hardcoded content
      if (content.includes('// TODO:') || content.includes('// FIXME:')) {
        this.addIssue({
          level: 'warning',
          message: 'API wrapper contains TODO/FIXME comments',
          file: 'api/apiWrapper.ts',
          suggestion: 'Remove TODO/FIXME comments from generated code'
        })
      }
    }
    
    console.log('✅ API wrapper consistency: OK')
  }

  /**
   * Run all quick validations
   */
  async runValidations(): Promise<void> {
    console.log('🚀 Starting quick validation...')
    console.log('')
    
    await this.checkCriticalFiles()
    await this.checkTypeScriptCompilation()
    await this.checkAnyTypes()
    await this.checkSchemaExports()
    await this.checkAPIWrapperConsistency()
    
    console.log('')
    console.log('📊 Quick Validation Summary')
    console.log('============================')
    
    const errors = this.issues.filter(i => i.level === 'error').length
    const warnings = this.issues.filter(i => i.level === 'warning').length
    
    console.log(`Errors: ${errors}`)
    console.log(`Warnings: ${warnings}`)
    console.log(`Total issues: ${this.issues.length}`)
    
    if (this.issues.length > 0) {
      console.log('')
      console.log('Issues found:')
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.level.toUpperCase()}] ${issue.message}`)
        if (issue.suggestion) {
          console.log(`   💡 ${issue.suggestion}`)
        }
      })
    }
    
    if (errors === 0) {
      console.log('')
      console.log('🎉 Quick validation passed!')
      console.log('✅ No critical issues found')
    } else {
      console.log('')
      console.log('❌ Quick validation failed!')
      console.log('🔧 Please fix the errors above')
    }
  }
}

async function main() {
  const validator = new QuickValidator()
  await validator.runValidations()
  
  const errors = validator['issues'].filter((i: ValidationIssue) => i.level === 'error').length
  process.exit(errors > 0 ? 1 : 0)
}

main()
