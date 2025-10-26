#!/usr/bin/env node
/**
 * Simple Browser Compatibility Validation for Client SDK
 * 
 * Validates that the generated SDK is properly browser-compatible and doesn't contain
 * any Node.js-specific code that would cause "require is not defined" or similar errors.
 */

const fs = require('fs')
const path = require('path')

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
]

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const issues = []

  for (const { pattern, name, critical } of NODE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      const message = `Found ${name}: ${matches.length} occurrence(s)`
      if (critical) {
        issues.push(`❌ CRITICAL: ${message}`)
      } else {
        issues.push(`⚠️  WARNING: ${message}`)
      }
    }
  }

  return { file: filePath, issues }
}

function scanDirectory(dirPath) {
  const results = []
  const items = fs.readdirSync(dirPath)
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (!['node_modules', '.git', 'dist', 'coverage'].includes(item)) {
        results.push(...scanDirectory(fullPath))
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

function main() {
  console.log('🚀 Starting Browser Compatibility Validation...\n')
  
  const srcPath = path.join(__dirname, 'packages', 'sdk', 'src')
  const distPath = path.join(__dirname, 'packages', 'sdk', 'dist')
  
  console.log(`📁 Scanning source files: ${srcPath}`)
  const srcResults = scanDirectory(srcPath)
  
  console.log(`📁 Scanning dist files: ${distPath}`)
  const distResults = scanDirectory(distPath)
  
  const allResults = [...srcResults, ...distResults]
  const filesWithIssues = allResults.filter(r => r.issues.length > 0)
  const totalIssues = allResults.reduce((sum, r) => sum + r.issues.length, 0)
  const criticalIssues = allResults
    .flatMap(r => r.issues)
    .filter(issue => issue.includes('❌ CRITICAL'))
  
  // Print summary
  console.log('\n📊 Summary:')
  console.log(`   Total files scanned: ${allResults.length}`)
  console.log(`   Files with issues: ${filesWithIssues.length}`)
  console.log(`   Total issues: ${totalIssues}`)
  
  if (criticalIssues.length > 0) {
    console.log(`\n❌ CRITICAL ISSUES FOUND: ${criticalIssues.length}`)
    criticalIssues.forEach(issue => console.log(`   ${issue}`))
  }
  
  // Print detailed results
  if (filesWithIssues.length > 0) {
    console.log('\n📁 Files with issues:')
    filesWithIssues.forEach(result => {
      console.log(`\n   ${result.file}`)
      result.issues.forEach(issue => console.log(`     ${issue}`))
    })
  }
  
  // Print success message if no critical issues
  if (criticalIssues.length === 0) {
    console.log('\n✅ SUCCESS: No critical Node.js patterns found!')
    console.log('   The SDK is browser-compatible.')
    process.exit(0)
  } else {
    console.log('\n❌ FAILURE: Critical Node.js patterns found!')
    console.log('   The SDK is NOT browser-compatible.')
    process.exit(1)
  }
}

main()
