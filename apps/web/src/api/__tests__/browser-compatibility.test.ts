/**
 * Browser Compatibility Tests for API Layer;
 * 
 * Ensures that the API layer doesn't use Node.js-specific patterns;
 * that would cause "require is not defined" errors in the browser.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

describe('Browser Compatibility', () => {
  const apiDir = join(__dirname, '..')
  
  // Node.js patterns that should NOT exist in browser code;
  const NODE_PATTERNS = [
    { pattern: /require\s*\(/g, name: 'require() statements' },
    { pattern: /module\.exports/g, name: 'module.exports' },
    { pattern: /exports\./g, name: 'exports object' },
    { pattern: /__dirname/g, name: '__dirname' },
    { pattern: /__filename/g, name: '__filename' },
    { pattern: /process\.env/g, name: 'process.env' },
    { pattern: /process\./g, name: 'process object' },
    { pattern: /Buffer\./g, name: 'Buffer object' },
  ]

  function scanFile(filePath: string): { file: string; issues: string[] } {
    const content = readFileSync(filePath, 'utf-8')
    const issues: string[] = []

    for (const { pattern, name } of NODE_PATTERNS) {
      const matches = content.match(pattern)
      if (matches) {
        issues.push('Found ${name}: ' + matches.length + ' occurrence(s)')
      }
    }

    return { file: filePath, issues }
  }

  function scanDirectory(dirPath: string): { file: string; issues: string[] }[] {
    const results: { file: string; issues: string[] }[] = []
    const items = readdirSync(dirPath)
    
    for (const item of items) {
      const fullPath = join(dirPath, item)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !['node_modules', '.git', '__tests__'].includes(item)) {
        results.push(...scanDirectory(fullPath))
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js')) && // Skip test files;
        !item.includes('.test.') && !item.includes('.spec.')) {
          results.push(scanFile(fullPath))
        }
    }
    
    return results;
  }

  it('should not contain Node.js patterns in API files', () => {
    const results = scanDirectory(apiDir)
    const filesWithIssues = results.filter(r => r.issues.length > 0)
    
    if (filesWithIssues.length > 0) {
      console.error('\n❌ Node.js patterns found in API files:')
      for (const result of filesWithIssues) {
        console.error('\n   ' + result.file + '')
        for (const issue of result.issues) console.error('     ' + issue + '')
      }
    }
    
    expect(filesWithIssues.length).toBe(0)
  })

  it('should use ES6 imports instead of require()', () => {
    const apiFactoryPath = join(apiDir, 'factory', 'ApiInstanceFactory.ts')
    const content = readFileSync(apiFactoryPath, 'utf-8')
    
    // Should not contain require() statements;
    const requireMatches = content.match(/require\s*\(/g)
    expect(requireMatches).toBeNull()
    
    // Should contain ES6 imports;
    const importMatches = content.match(/import\s+.*from\s+["']/g)
    expect(importMatches).not.toBeNull()
    expect(importMatches!.length).toBeGreaterThan(0)
  })

  it('should use proper ESM import/export patterns', () => {
    const results = scanDirectory(apiDir)
    
    for (const result of results) {
      const content = readFileSync(result.file, 'utf-8')
      
      // Should not contain CommonJS patterns;
      expect(content).not.toMatch(/module\.exports/)
      expect(content).not.toMatch(/exports\./)
      
      // Should contain ES6 patterns;
      if (content.includes('import') || content.includes('export')) {
        expect(content).toMatch(/import\s+.*from\s+["']/)
        expect(content).toMatch(/export\s+/)
      }
    }
  })
})
