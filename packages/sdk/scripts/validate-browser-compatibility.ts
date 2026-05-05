#!/usr/bin/env tsx
/**
 * Browser Compatibility Validation for Client SDK
 * 
 * Validates that the generated SDK is properly browser-compatible and doesn't contain
 * any Node.js-specific code that would cause "require is not defined" or similar errors.
 * 
 * Usage: tsx packages/sdk/scripts/validate-browser-compatibility.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ValidationResult {
  file: string
  issues: string[]
  warnings: string[]
}

interface ValidationSummary {
  totalFiles: number
  filesWithIssues: number
  totalIssues: number
  totalWarnings: number
  criticalIssues: string[]
}

// Node.js patterns that should NOT exist in browser code
const NODE_PATTERNS = [
  { pattern: /require\s*\(/g, name: 'require() statements', critical: true },
  { pattern: /module\.exports/g, name: 'module.exports', critical: true },
  { pattern: /exports\./g, name: 'exports object', critical: true },
  { pattern: /__dirname/g, name: '__dirname', critical: true },
  { pattern: /__filename/g, name: '__filename', critical: true },
  { pattern: /process\.env/g, name: 'process.env', critical: true },
  { pattern: /process\./g, name: 'process object', critical: true },
  { pattern: /Buffer\./g, name: 'Buffer object', critical: true },
  { pattern: /global\./g, name: 'global object', critical: false },
  { pattern: /globalThis\./g, name: 'globalThis object', critical: false },
]

// Browser-specific patterns that SHOULD exist
const BROWSER_PATTERNS = [
  { pattern: /import\s+.*from\s+['"]/g, name: 'ES6 imports', required: true },
  { pattern: /export\s+/g, name: 'ES6 exports', required: true },
  { pattern: /window\./g, name: 'window object', required: false },
  { pattern: /document\./g, name: 'document object', required: false },
  { pattern: /fetch\s*\(/g, name: 'fetch API', required: true },
]

// ESM-specific patterns
const ESM_PATTERNS = [
  { pattern: /import\s+.*from\s+['"][^'"]*\.js['"]/g, name: 'ESM .js extensions', required: true },
  { pattern: /export\s+\*.*from/g, name: 'Re-exports', required: false },
]

function scanFile(filePath: string): ValidationResult {
  const content = readFileSync(filePath, 'utf-8')
  const issues: string[] = []
  const warnings: string[] = []

  // Check for Node.js patterns
  for (const { pattern, name, critical } of NODE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      const message = `Found ${name}: ${matches.length} occurrence(s)`
      if (critical) {
        issues.push(`❌ CRITICAL: ${message}`)
      } else {
        warnings.push(`⚠️  WARNING: ${message}`)
      }
    }
  }

  // Check for required browser patterns
  for (const { pattern, name, required } of BROWSER_PATTERNS) {
    const matches = content.match(pattern)
    if (required && !matches) {
      warnings.push(`⚠️  WARNING: Missing ${name}`)
    }
  }

  // Check for ESM patterns
  for (const { pattern, name, required } of ESM_PATTERNS) {
    const matches = content.match(pattern)
    if (required && !matches) {
      warnings.push(`⚠️  WARNING: Missing ${name}`)
    }
  }

  return {
    file: filePath,
    issues,
    warnings
  }
}

function scanDirectory(dirPath: string, results: ValidationResult[] = []): ValidationResult[] {
  const items = readdirSync(dirPath)
  
  for (const item of items) {
    const fullPath = join(dirPath, item)
    const stat = statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'dist', 'coverage'].includes(item)) {
        scanDirectory(fullPath, results)
      }
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
      // Skip test files and build scripts
      if (!item.includes('.test.') && !item.includes('.spec.') && !item.includes('validate-')) {
        results.push(scanFile(fullPath))
      }
    }
  }
  
  return results
}

function generateSummary(results: ValidationResult[]): ValidationSummary {
  const filesWithIssues = results.filter(r => r.issues.length > 0)
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)
  
  const criticalIssues = results
    .flatMap(r => r.issues)
    .filter(issue => issue.includes('❌ CRITICAL'))
  
  return {
    totalFiles: results.length,
    filesWithIssues: filesWithIssues.length,
    totalIssues,
    totalWarnings,
    criticalIssues
  }
}

function printResults(results: ValidationResult[], summary: ValidationSummary) {
  console.log('\n🔍 Browser Compatibility Validation Results\n')
  
  // Print summary
  console.log('📊 Summary:')
  console.log(`   Total files scanned: ${summary.totalFiles}`)
  console.log(`   Files with issues: ${summary.filesWithIssues}`)
  console.log(`   Total issues: ${summary.totalIssues}`)
  console.log(`   Total warnings: ${summary.totalWarnings}`)
  
  if (summary.criticalIssues.length > 0) {
    console.log(`\n❌ CRITICAL ISSUES FOUND: ${summary.criticalIssues.length}`)
    summary.criticalIssues.forEach(issue => console.log(`   ${issue}`))
  }
  
  // Print detailed results
  const filesWithProblems = results.filter(r => r.issues.length > 0 || r.warnings.length > 0)
  
  if (filesWithProblems.length > 0) {
    console.log('\n📁 Files with issues:')
    filesWithProblems.forEach(result => {
      console.log(`\n   ${result.file}`)
      result.issues.forEach(issue => console.log(`     ${issue}`))
      result.warnings.forEach(warning => console.log(`     ${warning}`))
    })
  }
  
  // Print success message if no critical issues
  if (summary.criticalIssues.length === 0) {
    console.log('\n✅ SUCCESS: No critical Node.js patterns found!')
    console.log('   The SDK is browser-compatible.')
  } else {
    console.log('\n❌ FAILURE: Critical Node.js patterns found!')
    console.log('   The SDK is NOT browser-compatible.')
  }
}

function main() {
  console.log('🚀 Starting Browser Compatibility Validation...')
  
  // Get the SDK directory (where this script is located)
  const sdkDir = join(__dirname, '..')
  const srcPath = join(sdkDir, 'src')
  const distPath = join(sdkDir, 'dist')
  
  console.log(`📁 Scanning source files: ${srcPath}`)
  const srcResults = scanDirectory(srcPath)
  
  console.log(`📁 Scanning dist files: ${distPath}`)
  const distResults = scanDirectory(distPath)
  
  const allResults = [...srcResults, ...distResults]
  const summary = generateSummary(allResults)
  
  printResults(allResults, summary)
  
  // Exit with error code if critical issues found
  if (summary.criticalIssues.length > 0) {
    process.exit(1)
  }
  
  console.log('\n🎉 Validation completed successfully!')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
