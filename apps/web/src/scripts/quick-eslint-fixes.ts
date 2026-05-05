#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Quick ESLint Fixes Script
 * 
 * This script addresses the most common ESLint issues found in the codebase:
 * 1. Unused imports
 * 2. Nullish coalescing
 * 3. Basic type safety improvements
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// ============================================
// Configuration
// ============================================

const SRC_PATH = './src'

// Common patterns to fix
const FIXES = [
  {
    name: 'Remove unused imports',
    pattern: /import\s+{\s*([^}]+)\s*}\s*from\s*["'][^"']+["'];?\s*$/gm,
    fix: (content: string) => {
      // This is complex - let ESLint handle it
      return content
    }
  },
  {
    name: 'Replace logical OR with nullish coalescing',
    pattern: /(\w+(?:\.\w+)*)\s*\|\|\s*(\w+(?:\.\w+)*)/g,
    replacement: '$1 ?? $2',
    description: 'Safer null/undefined handling'
  },
  {
    name: 'Fix component props to be readonly',
    pattern: /interface\s+(\w+Props)\s*{([^}]+)}/g,
    replacement: 'interface $1 {\n  readonly $2\n}',
    description: 'Make component props immutable'
  }
]

// Files to skip (generated or special)
const SKIP_FILES = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '__tests__',
  '.test.',
  '.spec.',
  'generated',
  'auto-generated'
]

// ============================================
// Main Functions
// ============================================

async function quickFixes(): Promise<void> {
  console.log('🔧 Running quick ESLint fixes...')
  
  try {
    // Step 1: Get all TypeScript files
    const files = getAllTypeScriptFiles()
    console.log(`Found ${files.length} TypeScript files`)
    
    // Step 2: Apply fixes
    let fixedCount = 0
    for (const file of files) {
      if (shouldSkipFile(file)) continue
      
      const fixed = await fixFile(file)
      if (fixed) {
        fixedCount++
        console.log(`  ✅ Fixed ${file}`)
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} files`)
    
    // Step 3: Run ESLint to check remaining issues
    console.log('\n🔍 Checking remaining issues...')
    await runESLintCheck()
    
  } catch (error) {
    console.error('❌ Quick fixes failed:', error)
    process.exit(1)
  }
}

async function fixFile(filePath: string): Promise<boolean> {
  try {
    let content = readFileSync(filePath, 'utf-8')
    let hasChanges = false
    
    // Apply each fix
    for (const fix of FIXES) {
      if (fix.pattern && fix.replacement) {
        const newContent = content.replace(fix.pattern, fix.replacement)
        if (newContent !== content) {
          content = newContent
          hasChanges = true
        }
      }
    }
    
    // Write back if changed
    if (hasChanges) {
      writeFileSync(filePath, content)
      return true
    }
    
    return false
    
  } catch (error) {
    console.warn(`⚠️ Could not fix ${filePath}:`, error)
    return false
  }
}

function getAllTypeScriptFiles(): string[] {
  const files: string[] = []
  
  const scanDir = (dir: string) => {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory() && !shouldSkipFile(fullPath)) {
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

function shouldSkipFile(filePath: string): boolean {
  return SKIP_FILES.some(skip => filePath.includes(skip))
}

async function runESLintCheck(): Promise<void> {
  try {
    const { execSync } = await import('node:child_process')
    
    // Run ESLint with error count
    const result = execSync('npx eslint src --ext .ts,.tsx --format compact', { 
      encoding: 'utf-8',
      stdio: 'pipe'
    })
    
    console.log('ESLint output:')
    console.log(result)
    
  } catch (error: any) {
    // ESLint returns non-zero exit code when issues are found
    if (error.stdout) {
      console.log('ESLint found issues:')
      console.log(error.stdout)
    }
  }
}

// ============================================
// Specific Fixes
// ============================================

/**
 * Fix common nullish coalescing patterns
 */
function fixNullishCoalescing(content: string): string {
  const patterns = [
    // Simple variable patterns
    { from: /(\w+)\s*\|\|\s*(\w+)/g, to: '$1 ?? $2' },
    
    // Object property patterns
    { from: /(\w+\.\w+)\s*\|\|\s*(\w+)/g, to: '$1 ?? $2' },
    
    // Function call patterns
    { from: /(\w+\(\))\s*\|\|\s*(\w+)/g, to: '$1 ?? $2' },
    
    // String patterns (be more careful)
    { from: /(\w+)\s*\|\|\s*["']([^"']+)["']/g, to: '$1 ?? "$2"' }
  ]
  
  let result = content
  for (const pattern of patterns) {
    result = result.replace(pattern.from, pattern.to)
  }
  
  return result
}

/**
 * Fix component props to be readonly
 */
function fixComponentProps(content: string): string {
  // Match interface definitions that look like component props
  const propInterfacePattern = /interface\s+(\w+Props)\s*{([^}]+)}/g
  
  return content.replaceAll(propInterfacePattern, (match, interfaceName, props) => {
    // Check if it's already readonly
    if (props.includes('readonly')) {
      return match
    }
    
    // Add readonly to each property
    const readonlyProps = props
      .split('\n')
      .map(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('readonly')) {
          return `  readonly ${trimmed}`
        }
        return line
      })
      .join('\n')
    
    return `interface ${interfaceName} {\n${readonlyProps}\n}`
  })
}

/**
 * Remove common unused imports
 */
function removeUnusedImports(content: string): string {
  // This is complex and error-prone, so we'll let ESLint handle it
  // But we can remove obviously unused imports
  
  const commonUnused = [
    'StoreResponse',
    'UpdateOrderRequest', 
    'Navigate',
    'ReactNode'
  ]
  
  let result = content
  
  for (const unused of commonUnused) {
    // Remove import if it's not used in the file
    const importPattern = new RegExp(`import\\s*{[^}]*\\b${unused}\\b[^}]*}\\s*from\\s*['"][^'"]+['"];?\\s*`, 'g')
    
    if (importPattern.test(result)) {
      // Check if the import is actually used
      const usagePattern = new RegExp(`\\b${unused}\\b`, 'g')
      const matches = result.match(usagePattern) || []
      
      // If only appears in import, remove it
      if (matches.length <= 1) {
        result = result.replace(importPattern, '')
      }
    }
  }
  
  return result
}

// ============================================
// CLI Interface
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  try {
    switch (command) {
      case 'fix': {
        await quickFixes()
        break
      }
      
      case 'check': {
        await runESLintCheck()
        break
      }
      
      default: {
        console.log('Available commands:')
        console.log('  fix   - Apply quick fixes to common ESLint issues')
        console.log('  check - Run ESLint to check remaining issues')
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

export { quickFixes, fixNullishCoalescing, fixComponentProps, removeUnusedImports }
