#!/usr/bin/env tsx
/**
 * Snapshot Testing for Generators
 * 
 * Creates and compares snapshots of generated code to detect regressions
 * Uses single source of truth (resource-config.ts) for test expectations
 * 
 * Usage:
 *   tsx scripts/snapshot-test.ts        # Run tests
 *   tsx scripts/snapshot-test.ts update # Update snapshots
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { RESOURCE_CONFIGS } from './resource-config.js'
import { PATHS, resolveFromWebSrc } from './paths.js'
import { logger } from './logger.js'

interface Snapshot {
  file: string
  hash: string
  lineCount: number
  resources: string[]
  methods?: number
  hooks?: number
  types?: number
  timestamp: string
}

interface SnapshotReport {
  passed: number
  failed: number
  updated: number
  differences: Array<{
    file: string
    expected: Partial<Snapshot>
    actual: Partial<Snapshot>
  }>
}

const SNAPSHOT_DIR = path.join(PATHS.sdk.scripts, '__snapshots__')
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'generators.json')

/**
 * Calculate file hash
 */
function calculateHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex')
}

/**
 * Analyze generated file
 */
function analyzeGeneratedFile(filePath: string, type: 'wrapper' | 'types' | 'hooks' | 'barrel'): Snapshot {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Extract resources from config (single source of truth!)
  const resources = RESOURCE_CONFIGS.map(r => r.name)
  
  const snapshot: Snapshot = {
    file: path.relative(PATHS.web.root, filePath),
    hash: calculateHash(content),
    lineCount: lines.length,
    resources,
    timestamp: new Date().toISOString(),
  }
  
  // Type-specific analysis
  switch (type) {
    case 'wrapper':
      // Count methods based on resource config
      snapshot.methods = RESOURCE_CONFIGS.reduce((sum, r) => {
        let count = 2 // list + getById
        if (r.hasCreate) count++
        if (r.hasUpdate) count++
        if (r.hasDelete) count++
        return sum + count
      }, 0)
      break
      
    case 'types':
      snapshot.types = RESOURCE_CONFIGS.length
      break
      
    case 'hooks':
      snapshot.hooks = RESOURCE_CONFIGS.reduce((sum, r) => {
        return sum + Object.keys(r.hooks || {}).length
      }, 0)
      break
      
    case 'barrel':
      // Count exports
      const exportLines = lines.filter(l => l.trim().startsWith('export'))
      snapshot.methods = exportLines.length
      break
  }
  
  return snapshot
}

/**
 * Load existing snapshots
 */
function loadSnapshots(): Record<string, Snapshot> {
  if (!fs.existsSync(SNAPSHOT_FILE)) {
    return {}
  }
  
  try {
    return JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'))
  } catch {
    logger.warn('Failed to load snapshots, creating new')
    return {}
  }
}

/**
 * Save snapshots
 */
function saveSnapshots(snapshots: Record<string, Snapshot>): void {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
  }
  
  fs.writeFileSync(
    SNAPSHOT_FILE,
    JSON.stringify(snapshots, null, 2),
    'utf-8'
  )
}

/**
 * Compare snapshots
 */
function compareSnapshots(expected: Snapshot, actual: Snapshot): boolean {
  // Critical checks
  if (expected.resources.length !== actual.resources.length) return false
  if (expected.resources.some((r, i) => r !== actual.resources[i])) return false
  
  // Hash check (content changed)
  if (expected.hash !== actual.hash) {
    logger.warn(`  Content changed for ${actual.file}`)
    logger.warn(`    Lines: ${expected.lineCount} → ${actual.lineCount}`)
    return false
  }
  
  // Method/hook count checks (based on config)
  if (expected.methods && actual.methods && expected.methods !== actual.methods) {
    logger.warn(`  Method count changed: ${expected.methods} → ${actual.methods}`)
    return false
  }
  
  if (expected.hooks && actual.hooks && expected.hooks !== actual.hooks) {
    logger.warn(`  Hook count changed: ${expected.hooks} → ${actual.hooks}`)
    return false
  }
  
  return true
}

/**
 * Run snapshot tests
 */
async function runSnapshotTests(updateMode = false): Promise<SnapshotReport> {
  logger.section('Snapshot Testing')
  
  const report: SnapshotReport = {
    passed: 0,
    failed: 0,
    updated: 0,
    differences: [],
  }
  
  // Files to test
  const testFiles = [
    { path: resolveFromWebSrc('api/apiWrapper.ts'), type: 'wrapper' as const },
    { path: resolveFromWebSrc('api/backend-types.ts'), type: 'types' as const },
    { path: resolveFromWebSrc('hooks/generated.ts'), type: 'hooks' as const },
  ]
  
  // Load existing snapshots
  const existingSnapshots = loadSnapshots()
  const newSnapshots: Record<string, Snapshot> = {}
  
  for (const { path: filePath, type } of testFiles) {
    if (!fs.existsSync(filePath)) {
      logger.warn(`File not found: ${filePath}`)
      report.failed++
      continue
    }
    
    // Analyze current state
    const actual = analyzeGeneratedFile(filePath, type)
    const key = actual.file
    const expected = existingSnapshots[key]
    
    newSnapshots[key] = actual
    
    if (!expected) {
      logger.info(`📸 Creating new snapshot: ${key}`)
      report.updated++
      continue
    }
    
    // Compare
    const matches = compareSnapshots(expected, actual)
    
    if (matches) {
      logger.success(`✅ ${key}`)
      report.passed++
    } else {
      if (updateMode) {
        logger.warn(`📸 Updating snapshot: ${key}`)
        report.updated++
      } else {
        logger.error(`❌ ${key} (snapshot mismatch)`)
        report.failed++
        report.differences.push({
          file: key,
          expected: {
            hash: expected.hash,
            lineCount: expected.lineCount,
            methods: expected.methods,
            hooks: expected.hooks,
          },
          actual: {
            hash: actual.hash,
            lineCount: actual.lineCount,
            methods: actual.methods,
            hooks: actual.hooks,
          },
        })
      }
    }
  }
  
  // Save snapshots in update mode or if new
  if (updateMode || Object.keys(existingSnapshots).length === 0) {
    saveSnapshots(newSnapshots)
    logger.success(`\n📸 Snapshots saved to ${SNAPSHOT_FILE}`)
  }
  
  return report
}

/**
 * Display snapshot report
 */
function displayReport(report: SnapshotReport): void {
  logger.section('Snapshot Test Results')
  
  logger.stats('Passed', report.passed)
  logger.stats('Failed', report.failed)
  logger.stats('Updated', report.updated)
  
  if (report.differences.length > 0) {
    logger.section('Differences Detected')
    
    for (const diff of report.differences) {
      logger.error(`\n❌ ${diff.file}`)
      
      if (diff.expected.lineCount !== diff.actual.lineCount) {
        logger.error(`  Lines: ${diff.expected.lineCount} → ${diff.actual.lineCount}`)
      }
      
      if (diff.expected.methods !== diff.actual.methods) {
        logger.error(`  Methods: ${diff.expected.methods} → ${diff.actual.methods}`)
      }
      
      if (diff.expected.hooks !== diff.actual.hooks) {
        logger.error(`  Hooks: ${diff.expected.hooks} → ${diff.actual.hooks}`)
      }
      
      logger.error(`  Hash: ${diff.expected.hash?.slice(0, 8)}... → ${diff.actual.hash?.slice(0, 8)}...`)
    }
    
    logger.error('\n💡 Run with "update" flag to accept changes:')
    logger.error('   tsx scripts/snapshot-test.ts update')
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const updateMode = process.argv.includes('update')
    
    if (updateMode) {
      logger.warn('📸 UPDATE MODE: Snapshots will be updated')
    }
    
    const report = await runSnapshotTests(updateMode)
    displayReport(report)
    
    if (report.failed > 0 && !updateMode) {
      process.exit(1)
    }
    
    if (report.passed > 0 || report.updated > 0) {
      logger.success('\n✅ Snapshot tests complete!')
    }
    
  } catch (error) {
    logger.error('Snapshot testing failed:')
    logger.error(String(error))
    process.exit(1)
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { runSnapshotTests, Snapshot, SnapshotReport }

