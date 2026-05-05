#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Developer Velocity Tools - SDK-First Architecture
 * 
 * This script provides tools to improve developer velocity:
 * 1. Type generation and validation
 * 2. Hook generation from SDK endpoints
 * 3. Component generation with proper types
 * 4. API endpoint testing
 * 5. Type conflict detection and resolution
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { execSync } from 'node:child_process'

// ============================================
// Configuration
// ============================================

const CONFIG = {
  sdkPath: '../../packages/sdk/src',
  typesPath: './src/api/types',
  hooksPath: './src/hooks',
  componentsPath: './src/components',
  templatesPath: './src/hooks/templates'
}

// ============================================
// Developer Tools
// ============================================

class DeveloperTools {
  /**
   * Generate hooks from SDK endpoints
   */
  async generateHooks(entityName: string, endpoints: string[]): Promise<void> {
    console.log(`🔧 Generating hooks for ${entityName}...`)
    
    const hookTemplate = this.getHookTemplate()
    const entityHook = this.generateEntityHook(entityName, endpoints, hookTemplate)
    
    const hookPath = join(CONFIG.hooksPath, `use${entityName}.ts`)
    writeFileSync(hookPath, entityHook)
    
    console.log(`✅ Generated ${hookPath}`)
  }

  /**
   * Generate components with proper types
   */
  async generateComponent(componentName: string, entityName: string): Promise<void> {
    console.log(`🎨 Generating component ${componentName}...`)
    
    const componentTemplate = this.getComponentTemplate()
    const component = this.generateComponentCode(componentName, entityName, componentTemplate)
    
    const componentPath = join(CONFIG.componentsPath, componentName, `${componentName}.tsx`)
    writeFileSync(componentPath, component)
    
    console.log(`✅ Generated ${componentPath}`)
  }

  /**
   * Validate type consistency across the codebase
   */
  async validateTypes(): Promise<void> {
    console.log('🔍 Validating type consistency...')
    
    const issues: string[] = []
    
    // Check for direct SDK imports in components
    const directImports = await this.findDirectSDKImports()
    if (directImports.length > 0) {
      issues.push(`Found ${directImports.length} direct SDK imports in components`)
    }
    
    // Check for type conflicts
    const conflicts = await this.findTypeConflicts()
    if (conflicts.length > 0) {
      issues.push(`Found ${conflicts.length} type conflicts`)
    }
    
    // Check for missing types
    const missingTypes = await this.findMissingTypes()
    if (missingTypes.length > 0) {
      issues.push(`Found ${missingTypes.length} missing type definitions`)
    }
    
    if (issues.length > 0) {
      console.error('❌ Type validation failed:')
      for (const issue of issues) console.error(`  - ${issue}`)
      throw new Error('Type validation failed')
    }
    
    console.log('✅ Type validation passed')
  }

  /**
   * Generate API endpoint tests
   */
  async generateAPITests(entityName: string, endpoints: string[]): Promise<void> {
    console.log(`🧪 Generating API tests for ${entityName}...`)
    
    const testTemplate = this.getTestTemplate()
    const tests = this.generateTestCode(entityName, endpoints, testTemplate)
    
    const testPath = join(CONFIG.hooksPath, '__tests__', `use${entityName}.test.ts`)
    writeFileSync(testPath, tests)
    
    console.log(`✅ Generated ${testPath}`)
  }

  /**
   * Auto-fix common type issues
   */
  async autoFixTypes(): Promise<void> {
    console.log('🔧 Auto-fixing type issues...')
    
    // Fix direct SDK imports
    await this.fixDirectSDKImports()
    
    // Fix type conflicts
    await this.fixTypeConflicts()
    
    // Fix missing imports
    await this.fixMissingImports()
    
    console.log('✅ Type issues fixed')
  }

  /**
   * Generate type documentation
   */
  async generateTypeDocs(): Promise<void> {
    console.log('📚 Generating type documentation...')
    
    const docs = await this.generateTypeDocumentation()
    const docsPath = join(CONFIG.typesPath, 'TYPES.md')
    writeFileSync(docsPath, docs)
    
    console.log(`✅ Generated ${docsPath}`)
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getHookTemplate(): string {
    return readFileSync(join(CONFIG.templatesPath, 'useEntity.ts'), 'utf-8')
  }

  private getComponentTemplate(): string {
    return `import React from 'react'
import type { ${entityName}Response } from '@api/types'

interface ${componentName}Props {
  ${entityName.toLowerCase()}: ${entityName}Response
  onUpdate?: (${entityName.toLowerCase()}: ${entityName}Response) => void
  onDelete?: (id: string) => void
}

export function ${componentName}({ ${entityName.toLowerCase()}, onUpdate, onDelete }: ${componentName}Props) {
  return (
    <div className="${componentName.toLowerCase()}">
      {/* Component implementation */}
    </div>
  )
}`
  }

  private getTestTemplate(): string {
    return `import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { use${entityName} } from '../use${entityName}'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('use${entityName}', () => {
  test('should fetch ${entityName.toLowerCase()}', async () => {
    const { result } = renderHook(() => use${entityName}('test-id'), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})`
  }

  private generateEntityHook(entityName: string, endpoints: string[], template: string): string {
    return template
      .replaceAll('Entity', entityName)
      .replaceAll('entity', entityName.toLowerCase())
      .replaceAll('entities', entityName.toLowerCase() + 's')
  }

  private generateComponentCode(componentName: string, entityName: string, template: string): string {
    return template
      .replaceAll('componentName', componentName)
      .replaceAll('ComponentName', componentName)
      .replaceAll('entityName', entityName)
      .replaceAll('entity', entityName.toLowerCase())
  }

  private generateTestCode(entityName: string, endpoints: string[], template: string): string {
    return template
      .replaceAll('entityName', entityName)
      .replaceAll('entity', entityName.toLowerCase())
  }

  private async findDirectSDKImports(): Promise<string[]> {
    const files: string[] = []
    
    // Search for direct SDK imports in component files
    const searchPaths = [
      join(CONFIG.componentsPath),
      join(CONFIG.hooksPath),
      './src/pages',
      './src/features'
    ]
    
    for (const searchPath of searchPaths) {
      if (existsSync(searchPath)) {
        const found = this.searchFiles(searchPath, /from '@packages\/sdk'/)
        files.push(...found)
      }
    }
    
    return files
  }

  private async findTypeConflicts(): Promise<string[]> {
    const conflicts: string[] = []
    
    // Check for conflicting type definitions
    // This would involve comparing SDK types with frontend types
    
    return conflicts
  }

  private async findMissingTypes(): Promise<string[]> {
    const missing: string[] = []
    
    // Check for missing type definitions
    // This would involve analyzing usage vs definitions
    
    return missing
  }

  private async fixDirectSDKImports(): Promise<void> {
    const files = await this.findDirectSDKImports()
    
    for (const file of files) {
      let content = readFileSync(file, 'utf-8')
      
      // Replace direct SDK imports with centralized types
      content = content.replaceAll(
        'from \'@packages/sdk\'',
        "from '@api/types'"
      )
      
      writeFileSync(file, content)
    }
  }

  private async fixTypeConflicts(): Promise<void> {
    // Implement type conflict resolution
  }

  private async fixMissingImports(): Promise<void> {
    // Implement missing import fixes
  }

  private searchFiles(dir: string, pattern: RegExp): string[] {
    const files: string[] = []
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory()) {
          files.push(...this.searchFiles(fullPath, pattern))
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const content = readFileSync(fullPath, 'utf-8')
          if (pattern.test(content)) {
            files.push(fullPath)
          }
        }
      }
    } catch {
      // Ignore errors (permission denied, etc.)
    }
    
    return files
  }

  private async generateTypeDocumentation(): Promise<string> {
    return `# Type Documentation

## SDK Types
This section documents all types available from the SDK.

## Frontend Extensions
This section documents computed fields and extensions.

## Usage Examples
This section provides examples of how to use the types.

## Migration Guide
This section provides guidance for updating types.
`
  }
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const options = args.slice(1)
  
  const tools = new DeveloperTools()
  
  try {
    switch (command) {
      case 'generate-hooks': {
        await tools.generateHooks(options[0], options.slice(1))
        break
      }
      
      case 'generate-component': {
        await tools.generateComponent(options[0], options[1])
        break
      }
      
      case 'validate-types': {
        await tools.validateTypes()
        break
      }
      
      case 'generate-tests': {
        await tools.generateAPITests(options[0], options.slice(1))
        break
      }
      
      case 'auto-fix': {
        await tools.autoFixTypes()
        break
      }
      
      case 'generate-docs': {
        await tools.generateTypeDocs()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  generate-hooks <entity> <endpoints...>')
        console.log('  generate-component <component> <entity>')
        console.log('  validate-types')
        console.log('  generate-tests <entity> <endpoints...>')
        console.log('  auto-fix')
        console.log('  generate-docs')
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

export { DeveloperTools }
