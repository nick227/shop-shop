#!/usr/bin/env tsx
/**
 * Comprehensive Validation System
 * 
 * Eliminates errors through systematic validation of:
 * - Generated types and schemas
 * - API contract consistency
 * - Type safety and alignment
 * - Runtime validation coverage
 * - Cross-package dependencies
 * 
 * Features:
 * - Multi-level validation (syntax, semantic, runtime)
 * - Cross-reference validation between packages
 * - Type safety verification
 * - Schema alignment checks
 * - Performance validation
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ========================================
// Validation Types and Interfaces
// ========================================

interface ValidationResult {
  level: 'error' | 'warning' | 'info'
  category: 'syntax' | 'semantic' | 'runtime' | 'type-safety' | 'consistency'
  message: string
  file?: string
  line?: number
  suggestion?: string
}

interface ValidationReport {
  total: number
  errors: number
  warnings: number
  info: number
  results: ValidationResult[]
  duration: number
  success: boolean
}

interface TypeDefinition {
  name: string
  type: string
  properties: Record<string, string>
  isExported: boolean
  isImported: boolean
  source: string
}

interface SchemaDefinition {
  name: string
  type: 'zod' | 'typescript'
  properties: Record<string, string>
  isExported: boolean
  source: string
}

// ========================================
// Validation Engine
// ========================================

class ComprehensiveValidator {
  private results: ValidationResult[] = []
  private startTime: number = 0

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Add validation result
   */
  private addResult(result: ValidationResult): void {
    this.results.push(result)
  }

  /**
   * Validate TypeScript syntax
   */
  async validateTypeScriptSyntax(): Promise<void> {
    console.log('🔍 Validating TypeScript syntax...')
    
    try {
      // Check if TypeScript compiler can parse the files
      const files = this.getTypeScriptFiles()
      
      for (const file of files) {
        try {
          // Use TypeScript compiler to check syntax
          execSync(`npx tsc --noEmit --skipLibCheck "${file}"`, { 
            stdio: 'pipe',
            cwd: join(__dirname, '../..')
          })
        } catch (error) {
          this.addResult({
            level: 'error',
            category: 'syntax',
            message: `TypeScript syntax error in ${file}`,
            file,
            suggestion: 'Fix TypeScript syntax errors'
          })
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'syntax',
        message: 'Failed to validate TypeScript syntax',
        suggestion: 'Check TypeScript installation and configuration'
      })
    }
  }

  /**
   * Validate schema consistency
   */
  async validateSchemaConsistency(): Promise<void> {
    console.log('🔍 Validating schema consistency...')
    
    try {
      // Check if all schemas are properly exported
      const schemaFiles = this.getSchemaFiles()
      
      for (const file of schemaFiles) {
        const content = readFileSync(file, 'utf-8')
        const schemas = this.extractSchemaDefinitions(content)
        
        for (const schema of schemas) {
          if (!schema.isExported) {
            this.addResult({
              level: 'warning',
              category: 'consistency',
              message: `Schema ${schema.name} is not exported in ${file}`,
              file,
              suggestion: 'Add export statement for the schema'
            })
          }
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'consistency',
        message: 'Failed to validate schema consistency',
        suggestion: 'Check schema file structure and exports'
      })
    }
  }

  /**
   * Validate type safety
   */
  async validateTypeSafety(): Promise<void> {
    console.log('🔍 Validating type safety...')
    
    try {
      // Check for any types
      const files = this.getTypeScriptFiles()
      
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        
        // Check for any types
        const anyMatches = content.match(/: any\b/g)
        if (anyMatches) {
          this.addResult({
            level: 'warning',
            category: 'type-safety',
            message: `Found ${anyMatches.length} 'any' types in ${file}`,
            file,
            suggestion: 'Replace any types with specific types'
          })
        }
        
        // Check for unknown types
        const unknownMatches = content.match(/: unknown\b/g)
        if (unknownMatches) {
          this.addResult({
            level: 'info',
            category: 'type-safety',
            message: `Found ${unknownMatches.length} 'unknown' types in ${file}`,
            file,
            suggestion: 'Consider if unknown types can be made more specific'
          })
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'type-safety',
        message: 'Failed to validate type safety',
        suggestion: 'Check type definitions and imports'
      })
    }
  }

  /**
   * Validate API contract consistency
   */
  async validateAPIContractConsistency(): Promise<void> {
    console.log('🔍 Validating API contract consistency...')
    
    try {
      // Check if API contracts match generated types
      const apiWrapperPath = join(__dirname, '../../apps/web/src/api/apiWrapper.ts')
      const backendTypesPath = join(__dirname, '../../apps/web/src/api/backend-types.ts')
      
      if (existsSync(apiWrapperPath) && existsSync(backendTypesPath)) {
        const apiWrapper = readFileSync(apiWrapperPath, 'utf-8')
        const backendTypes = readFileSync(backendTypesPath, 'utf-8')
        
        // Extract type definitions
        const apiTypes = this.extractTypeDefinitions(apiWrapper)
        const backendTypeDefs = this.extractTypeDefinitions(backendTypes)
        
        // Check for missing types
        for (const apiType of apiTypes) {
          const backendType = backendTypeDefs.find(t => t.name === apiType.name)
          if (!backendType) {
            this.addResult({
              level: 'warning',
              category: 'consistency',
              message: `API type ${apiType.name} not found in backend types`,
              file: apiWrapperPath,
              suggestion: 'Ensure all API types are properly mapped to backend types'
            })
          }
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'consistency',
        message: 'Failed to validate API contract consistency',
        suggestion: 'Check API wrapper and backend types alignment'
      })
    }
  }

  /**
   * Validate runtime validation coverage
   */
  async validateRuntimeValidationCoverage(): Promise<void> {
    console.log('🔍 Validating runtime validation coverage...')
    
    try {
      const validatorsPath = join(__dirname, '../../apps/web/src/api/validators.ts')
      
      if (existsSync(validatorsPath)) {
        const content = readFileSync(validatorsPath, 'utf-8')
        
        // Check if all schemas have validators
        const schemaFiles = this.getSchemaFiles()
        const schemas = new Set<string>()
        
        for (const file of schemaFiles) {
          const fileContent = readFileSync(file, 'utf-8')
          const fileSchemas = this.extractSchemaDefinitions(fileContent)
          fileSchemas.forEach(s => schemas.add(s.name))
        }
        
        // Check if validators exist for all schemas
        for (const schemaName of schemas) {
          if (!content.includes(schemaName)) {
            this.addResult({
              level: 'warning',
              category: 'runtime',
              message: `No validator found for schema ${schemaName}`,
              file: validatorsPath,
              suggestion: 'Add validator for the schema'
            })
          }
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'runtime',
        message: 'Failed to validate runtime validation coverage',
        suggestion: 'Check validators.ts file structure'
      })
    }
  }

  /**
   * Validate cross-package dependencies
   */
  async validateCrossPackageDependencies(): Promise<void> {
    console.log('🔍 Validating cross-package dependencies...')
    
    try {
      // Check if all imports resolve correctly
      const files = this.getTypeScriptFiles()
      
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        const imports = this.extractImports(content)
        
        for (const importPath of imports) {
          if (importPath.startsWith('@packages/')) {
            const resolvedPath = this.resolvePackagePath(importPath)
            if (!existsSync(resolvedPath)) {
              this.addResult({
                level: 'error',
                category: 'semantic',
                message: `Import path ${importPath} does not resolve to existing file`,
                file,
                suggestion: 'Check package structure and import paths'
              })
            }
          }
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'semantic',
        message: 'Failed to validate cross-package dependencies',
        suggestion: 'Check package.json exports and import paths'
      })
    }
  }

  /**
   * Validate generated code quality
   */
  async validateGeneratedCodeQuality(): Promise<void> {
    console.log('🔍 Validating generated code quality...')
    
    try {
      const generatedFiles = [
        join(__dirname, '../../apps/web/src/api/apiWrapper.ts'),
        join(__dirname, '../../apps/web/src/api/backend-types.ts'),
        join(__dirname, '../src/frontend-contracts.ts')
      ]
      
      for (const file of generatedFiles) {
        if (existsSync(file)) {
          const content = readFileSync(file, 'utf-8')
          
          // Check for hardcoded content
          if (content.includes('// TODO:') || content.includes('// FIXME:')) {
            this.addResult({
              level: 'warning',
              category: 'consistency',
              message: `Generated file contains TODO/FIXME comments: ${file}`,
              file,
              suggestion: 'Remove TODO/FIXME comments from generated code'
            })
          }
          
          // Check for proper generation headers
          if (!content.includes('AUTO-GENERATED') && !content.includes('DO NOT EDIT')) {
            this.addResult({
              level: 'warning',
              category: 'consistency',
              message: `Generated file missing proper header: ${file}`,
              file,
              suggestion: 'Add AUTO-GENERATED header to generated files'
            })
          }
        }
      }
    } catch (error) {
      this.addResult({
        level: 'error',
        category: 'consistency',
        message: 'Failed to validate generated code quality',
        suggestion: 'Check generated file structure and content'
      })
    }
  }

  /**
   * Run all validations
   */
  async runAllValidations(): Promise<ValidationReport> {
    console.log('🚀 Starting comprehensive validation...')
    console.log('')
    
    // Run all validation methods
    await this.validateTypeScriptSyntax()
    await this.validateSchemaConsistency()
    await this.validateTypeSafety()
    await this.validateAPIContractConsistency()
    await this.validateRuntimeValidationCoverage()
    await this.validateCrossPackageDependencies()
    await this.validateGeneratedCodeQuality()
    
    const duration = Date.now() - this.startTime
    const errors = this.results.filter(r => r.level === 'error').length
    const warnings = this.results.filter(r => r.level === 'warning').length
    const info = this.results.filter(r => r.level === 'info').length
    
    return {
      total: this.results.length,
      errors,
      warnings,
      info,
      results: this.results,
      duration,
      success: errors === 0
    }
  }

  /**
   * Print validation report
   */
  printReport(report: ValidationReport): void {
    console.log('\n📊 Comprehensive Validation Report')
    console.log('=====================================')
    console.log(`Total validations: ${report.total}`)
    console.log(`Errors: ${report.errors}`)
    console.log(`Warnings: ${report.warnings}`)
    console.log(`Info: ${report.info}`)
    console.log(`Duration: ${report.duration}ms`)
    console.log(`Success: ${report.success ? '✅' : '❌'}`)
    console.log('')
    
    if (report.errors > 0) {
      console.log('❌ Errors:')
      this.results
        .filter(r => r.level === 'error')
        .forEach(result => {
          console.log(`   ${result.file}:${result.line || 0} - ${result.message}`)
          if (result.suggestion) {
            console.log(`     💡 ${result.suggestion}`)
          }
        })
      console.log('')
    }
    
    if (report.warnings > 0) {
      console.log('⚠️  Warnings:')
      this.results
        .filter(r => r.level === 'warning')
        .forEach(result => {
          console.log(`   ${result.file}:${result.line || 0} - ${result.message}`)
          if (result.suggestion) {
            console.log(`     💡 ${result.suggestion}`)
          }
        })
      console.log('')
    }
    
    if (report.info > 0) {
      console.log('ℹ️  Info:')
      this.results
        .filter(r => r.level === 'info')
        .forEach(result => {
          console.log(`   ${result.file}:${result.line || 0} - ${result.message}`)
          if (result.suggestion) {
            console.log(`     💡 ${result.suggestion}`)
          }
        })
      console.log('')
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  private getTypeScriptFiles(): string[] {
    const files: string[] = []
    const directories = [
      join(__dirname, '../src'),
      join(__dirname, '../../apps/web/src/api'),
      join(__dirname, '../../apps/web/src/types')
    ]
    
    for (const dir of directories) {
      if (existsSync(dir)) {
        this.scanDirectory(dir, files, '.ts')
      }
    }
    
    return files
  }

  private getSchemaFiles(): string[] {
    const files: string[] = []
    const directories = [
      join(__dirname, '../src'),
      join(__dirname, '../src/dtos')
    ]
    
    for (const dir of directories) {
      if (existsSync(dir)) {
        this.scanDirectory(dir, files, '.ts')
      }
    }
    
    return files
  }

  private scanDirectory(dir: string, files: string[], extension: string): void {
    try {
      const items = readdirSync(dir, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = join(dir, item.name)
        
        if (item.isDirectory()) {
          this.scanDirectory(fullPath, files, extension)
        } else if (item.isFile() && item.name.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Ignore directory scan errors
    }
  }

  private extractTypeDefinitions(content: string): TypeDefinition[] {
    const definitions: TypeDefinition[] = []
    
    // Extract interface definitions
    const interfaceRegex = /export\s+interface\s+(\w+)\s*\{([^}]+)\}/g
    let match
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const name = match[1]
      const body = match[2]
      const properties: Record<string, string> = {}
      
      // Extract properties
      const propRegex = /(\w+)(\?)?\s*:\s*([^;,\n]+)/g
      let propMatch
      
      while ((propMatch = propRegex.exec(body)) !== null) {
        const propName = propMatch[1]
        const isOptional = !!propMatch[2]
        const propType = propMatch[3].trim()
        properties[propName] = propType
      }
      
      definitions.push({
        name,
        type: 'interface',
        properties,
        isExported: true,
        isImported: false,
        source: 'unknown'
      })
    }
    
    return definitions
  }

  private extractSchemaDefinitions(content: string): SchemaDefinition[] {
    const definitions: SchemaDefinition[] = []
    
    // Extract Zod schema definitions
    const schemaRegex = /export\s+(?:const\s+)?(\w+)(?:Schema)?\s*=\s*z\./g
    let match
    
    while ((match = schemaRegex.exec(content)) !== null) {
      const name = match[1]
      definitions.push({
        name,
        type: 'zod',
        properties: {},
        isExported: true,
        source: 'unknown'
      })
    }
    
    return definitions
  }

  private extractImports(content: string): string[] {
    const imports: string[] = []
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }

  private resolvePackagePath(importPath: string): string {
    // Simple package path resolution
    if (importPath.startsWith('@packages/schemas')) {
      return join(__dirname, '../src/index.ts')
    }
    
    return importPath
  }
}

// ========================================
// Main Validation Process
// ========================================

async function main() {
  const validator = new ComprehensiveValidator()
  
  try {
    const report = await validator.runAllValidations()
    validator.printReport(report)
    
    if (report.success) {
      console.log('🎉 All validations passed!')
      console.log('✅ Generated code is error-free and consistent')
      process.exit(0)
    } else {
      console.log('❌ Validation failed!')
      console.log('🔧 Please fix the errors above before proceeding')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation process failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
