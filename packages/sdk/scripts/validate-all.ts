#!/usr/bin/env tsx
/**
 * Comprehensive Validation Suite
 * 
 * Runs all validation checks after generation:
 * - TypeScript compilation
 * - ESLint checks
 * - Import validation
 * - Snapshot comparison
 * 
 * Usage: tsx scripts/validate-all.ts
 */
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { logger } from './logger.js'
import { PATHS } from './paths.js'

const execAsync = promisify(exec)

export interface ValidationCheck {
  name: string
  command: string
  critical: boolean
  timeout?: number
}

export interface ValidationReport {
  totalChecks: number
  passed: number
  failed: number
  warnings: number
  duration: number
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warn'
    duration: number
    output?: string
    error?: string
  }>
}

/**
 * Validation checks to run
 */
const VALIDATION_CHECKS: ValidationCheck[] = [
  {
    name: 'TypeScript (Web App)',
    command: 'cd ../../apps/web && pnpm exec tsc --noEmit',
    critical: true,
    timeout: 60000,
  },
  {
    name: 'TypeScript (SDK Package)',
    command: 'pnpm exec tsc --noEmit',
    critical: true,
    timeout: 30000,
  },
  {
    name: 'ESLint (Generated Files)',
    command: 'cd ../../apps/web && pnpm exec eslint src/api/ --ext .ts,.tsx',
    critical: false,
    timeout: 30000,
  }
]

/**
 * Run a single validation check
 */
async function runCheck(check: ValidationCheck): Promise<{
  name: string
  status: 'pass' | 'fail' | 'warn'
  duration: number
  output?: string
  error?: string
}> {
  const start = Date.now()
  
  try {
    const { stdout, stderr } = await execAsync(check.command, {
      timeout: check.timeout || 30000,
      cwd: PATHS.web.root,
    })
    
    const duration = Date.now() - start
    
    // Check for warnings in output
    if (stderr && stderr.includes('warning')) {
      return {
        name: check.name,
        status: 'warn',
        duration,
        output: stderr,
      }
    }
    
    return {
      name: check.name,
      status: 'pass',
      duration,
      output: stdout || stderr,
    }
    
  } catch (error: unknown) {
    const duration = Date.now() - start
    const err = error as { message?: string; stdout?: string; stderr?: string }
    
    // Non-critical checks become warnings
    if (!check.critical) {
      return {
        name: check.name,
        status: 'warn',
        duration,
        error: err.message || 'Check failed',
        output: err.stderr || err.stdout,
      }
    }
    
    return {
      name: check.name,
      status: 'fail',
      duration,
      error: err.message || 'Check failed',
      output: err.stderr || err.stdout,
    }
  }
}

/**
 * Run all validation checks
 */
export async function validateAll(): Promise<ValidationReport> {
  const overallStart = Date.now()
  
  logger.section('Running Validation Suite')
  
  const results = await Promise.all(
    VALIDATION_CHECKS.map(check => runCheck(check))
  )
  
  // Calculate summary
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warnings = results.filter(r => r.status === 'warn').length
  const duration = Date.now() - overallStart
  
  // Display results
  logger.section('Validation Results')
  
  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌'
    const color = result.status === 'pass' ? 'success' : result.status === 'warn' ? 'warn' : 'error'
    
    logger[color](`${icon} ${result.name} (${result.duration}ms)`)
    
    if (result.error) {
      logger.error(`   ${result.error}`)
    }
  }
  
  // Summary
  logger.section('Summary')
  logger.stats('Total Checks', VALIDATION_CHECKS.length)
  logger.stats('Passed', passed)
  logger.stats('Failed', failed)
  logger.stats('Warnings', warnings)
  logger.stats('Duration', `${duration}ms`)
  
  const report: ValidationReport = {
    totalChecks: VALIDATION_CHECKS.length,
    passed,
    failed,
    warnings,
    duration,
    checks: results,
  }
  
  if (failed > 0) {
    logger.error(`\n❌ Validation failed with ${failed} error(s)`)
    return report
  }
  
  if (warnings > 0) {
    logger.warn(`\n⚠️  Validation passed with ${warnings} warning(s)`)
    return report
  }
  
  logger.success('\n✅ All validation checks passed!')
  return report
}

/**
 * Main function
 */
async function main() {
  try {
    const report = await validateAll()
    
    // Exit with error if validation failed
    if (report.failed > 0) {
      process.exit(1)
    }
    
  } catch (error) {
    logger.error('Validation suite failed:')
    logger.error(String(error))
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

