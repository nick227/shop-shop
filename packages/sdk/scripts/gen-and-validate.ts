#!/usr/bin/env tsx
/**
 * Generation Pipeline with Validation
 * 
 * Orchestrates the entire generation + validation workflow:
 * 1. Generate all code
 * 2. Run validation suite
 * 3. Run snapshot tests
 * 4. Report results
 * 
 * Usage: tsx scripts/gen-and-validate.ts [--update-snapshots]
 */
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { logger, ProgressLogger } from './logger.js'
import { validateAll, type ValidationReport } from './validate-all.js'
import { runSnapshotTests, type SnapshotReport } from './snapshot-test.js'
import { validateConfigs } from './validate-config.js'

const execAsync = promisify(exec)

interface PipelineReport {
  generation: {
    success: boolean
    duration: number
    error?: string
  }
  validation: ValidationReport | null
  snapshots: SnapshotReport | null
  overallSuccess: boolean
  totalDuration: number
}

/**
 * Run generation scripts
 */
async function runGeneration(): Promise<{ success: boolean; duration: number; error?: string }> {
  const start = Date.now()
  
  try {
    logger.section('Code Generation')
    logger.info('Running all generators...')
    
    // Run generation
    const { stdout } = await execAsync('npm run gen:wrapper && npm run gen:types && npm run gen:hooks && npm run gen:barrels', {
      cwd: process.cwd(),
    })
    
    const duration = Date.now() - start
    
    logger.success(`Generation completed (${duration}ms)`)
    
    return { success: true, duration }
    
  } catch (error: unknown) {
    const duration = Date.now() - start
    const err = error as { message?: string; stderr?: string }
    
    logger.error('Generation failed:')
    logger.error(err.message || String(error))
    
    return {
      success: false,
      duration,
      error: err.message || String(error),
    }
  }
}

/**
 * Run complete pipeline
 */
async function runPipeline(updateSnapshots = false): Promise<PipelineReport> {
  const overallStart = Date.now()
  
  logger.section('🚀 Generation Pipeline with Validation')
  logger.info('Single source of truth: resource-config.ts')
  logger.info('')
  
  const report: PipelineReport = {
    generation: { success: false, duration: 0 },
    validation: null,
    snapshots: null,
    overallSuccess: false,
    totalDuration: 0,
  }
  
  // Step 0: Config Validation (Single Source of Truth!)
  const configResult = validateConfigs()
  if (!configResult.valid) {
    logger.error('\n❌ Pipeline failed at config validation step')
    report.totalDuration = Date.now() - overallStart
    return report
  }
  logger.info('')
  
  // Step 1: Generation
  report.generation = await runGeneration()
  
  if (!report.generation.success) {
    logger.error('\n❌ Pipeline failed at generation step')
    report.totalDuration = Date.now() - overallStart
    return report
  }
  
  // Step 2: Validation
  try {
    logger.info('')
    report.validation = await validateAll()
    
    if (report.validation.failed > 0) {
      logger.error('\n❌ Pipeline failed at validation step')
      report.totalDuration = Date.now() - overallStart
      return report
    }
  } catch (error) {
    logger.error('Validation step failed:', error)
    report.totalDuration = Date.now() - overallStart
    return report
  }
  
  // Step 3: Snapshot Tests
  try {
    logger.info('')
    report.snapshots = await runSnapshotTests(updateSnapshots)
    
    if (report.snapshots.failed > 0 && !updateSnapshots) {
      logger.error('\n❌ Pipeline failed at snapshot test step')
      report.totalDuration = Date.now() - overallStart
      return report
    }
  } catch (error) {
    logger.error('Snapshot test step failed:', error)
    report.totalDuration = Date.now() - overallStart
    return report
  }
  
  // Success!
  report.overallSuccess = true
  report.totalDuration = Date.now() - overallStart
  
  return report
}

/**
 * Display final report
 */
function displayFinalReport(report: PipelineReport): void {
  logger.section('🎯 Pipeline Summary')
  
  // Generation
  const genIcon = report.generation.success ? '✅' : '❌'
  logger.info(`${genIcon} Generation (${report.generation.duration}ms)`)
  
  // Validation
  if (report.validation) {
    const valIcon = report.validation.failed === 0 ? '✅' : '❌'
    logger.info(`${valIcon} Validation (${report.validation.passed}/${report.validation.totalChecks} passed)`)
  }
  
  // Snapshots
  if (report.snapshots) {
    const snapIcon = report.snapshots.failed === 0 ? '✅' : '❌'
    logger.info(`${snapIcon} Snapshots (${report.snapshots.passed + report.snapshots.updated} ok, ${report.snapshots.failed} failed)`)
  }
  
  // Overall
  logger.stats('Total Duration', `${report.totalDuration}ms`)
  
  if (report.overallSuccess) {
    logger.success('\n✅ Pipeline completed successfully!')
  } else {
    logger.error('\n❌ Pipeline failed')
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const updateSnapshots = process.argv.includes('--update-snapshots')
    
    if (updateSnapshots) {
      logger.warn('📸 Snapshot update mode enabled')
    }
    
    const report = await runPipeline(updateSnapshots)
    displayFinalReport(report)
    
    if (!report.overallSuccess) {
      process.exit(1)
    }
    
  } catch (error) {
    logger.error('Pipeline failed:')
    logger.error(String(error))
    process.exit(1)
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { runPipeline, PipelineReport }

