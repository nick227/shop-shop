#!/usr/bin/env tsx
/**
 * API Generation Pipeline
 * 
 * Complete pipeline for API generation with:
 * - Schema validation
 * - Parallel processing
 * - Comprehensive testing
 * - Error recovery
 * - Performance monitoring
 * 
 * Usage: tsx scripts/api-generation-pipeline.ts
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface PipelineStage {
  name: string
  script: string
  output: string
  validation?: string
  dependencies?: string[]
  timeout?: number
}

interface PipelineResult {
  stage: string
  success: boolean
  duration: number
  error?: string
  output?: string
  validation?: boolean
}

class APIGenerationPipeline {
  private results: PipelineResult[] = []
  private startTime: number = 0
  private transaction: GenerationTransaction

  private stages: PipelineStage[] = [
    {
      name: 'Schema Validation',
      script: 'validate-schemas.ts',
      output: 'validation/schema-validation.json',
      validation: 'schema-valid'
    },
    {
      name: 'Resource Config Generation',
      script: 'generate-resource-config.ts',
      output: 'resource-config.ts',
      validation: 'config-valid'
    },
    {
      name: 'API Wrapper Generation',
      script: 'generate-api-wrapper.ts',
      output: 'apps/web/src/api/apiWrapper.ts',
      validation: 'wrapper-valid',
      dependencies: ['Resource Config Generation']
    },
    {
      name: 'Type Mappers Generation',
      script: 'optimized-type-mappers.ts',
      output: 'apps/web/src/api/backend-types.ts',
      validation: 'types-valid',
      dependencies: ['Resource Config Generation']
    },
    {
      name: 'Frontend Types Generation',
      script: 'generate-frontend-types.ts',
      output: 'apps/web/src/api/safe-types.ts',
      validation: 'frontend-types-valid'
    },
    {
      name: 'React Hooks Generation',
      script: 'generate-hooks.ts',
      output: 'apps/web/src/hooks/generated.ts',
      validation: 'hooks-valid',
      dependencies: ['API Wrapper Generation', 'Type Mappers Generation']
    },
    {
      name: 'Barrel Exports Generation',
      script: 'generate-barrel-exports.ts',
      output: 'apps/web/src/api/index.ts',
      validation: 'barrel-valid'
    },
    {
      name: 'Comprehensive Validation',
      script: 'comprehensive-validation.ts',
      output: 'validation/comprehensive-validation.json',
      validation: 'comprehensive-valid'
    }
  ]

  constructor() {
    this.transaction = new GenerationTransaction()
  }

  async run(): Promise<void> {
    this.startTime = Date.now()
    logger.info('🚀 Starting API Generation Pipeline')
    logger.info(`📋 Stages: ${this.stages.length}`)

    // Create validation directory
    const validationDir = join(__dirname, 'validation')
    if (!existsSync(validationDir)) {
      mkdirSync(validationDir, { recursive: true })
    }

    // Execute stages in dependency order
    await this.executeStages()

    // Generate final report
    await this.generateReport()

    // Print summary
    this.printSummary()
  }

  private async executeStages(): Promise<void> {
    const completed = new Set<string>()
    const remaining = [...this.stages]

    while (remaining.length > 0) {
      const ready = remaining.filter(stage => 
        !stage.dependencies || stage.dependencies.every(dep => completed.has(dep))
      )

      if (ready.length === 0) {
        throw new Error('Circular dependency detected in pipeline stages')
      }

      // Execute ready stages in parallel
      const promises = ready.map(stage => this.executeStage(stage))
      await Promise.all(promises)

      // Mark as completed and remove from remaining
      for (const stage of ready) {
        completed.add(stage.name)
        remaining.splice(remaining.indexOf(stage), 1)
      }
    }
  }

  private async executeStage(stage: PipelineStage): Promise<void> {
    const startTime = Date.now()
    logger.info(`🔄 ${stage.name}...`)

    try {
      const scriptPath = join(__dirname, stage.script)
      if (!existsSync(scriptPath)) {
        throw new Error(`Script not found: ${scriptPath}`)
      }

      // Execute the script with timeout
      const timeout = stage.timeout || 30000
      const output = execSync(`tsx "${scriptPath}"`, {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout
      })

      const duration = Date.now() - startTime
      
      // Validate output if validation script exists
      let validation = true
      if (stage.validation) {
        validation = await this.validateStage(stage)
      }

      this.results.push({
        stage: stage.name,
        success: true,
        duration,
        output: output.trim(),
        validation
      })

      logger.success(`✅ ${stage.name} (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.results.push({
        stage: stage.name,
        success: false,
        duration,
        error: errorMessage
      })

      logger.error(`❌ ${stage.name} failed: ${errorMessage}`)
      
      // Don't throw - continue with other stages
    }
  }

  private async validateStage(stage: PipelineStage): Promise<boolean> {
    try {
      const outputPath = join(__dirname, '..', stage.output)
      
      if (!existsSync(outputPath)) {
        return false
      }

      // Basic validation - file exists and has content
      const content = readFileSync(outputPath, 'utf8')
      if (content.length === 0) {
        return false
      }

      // TypeScript validation for generated files
      if (stage.output.endsWith('.ts')) {
        try {
          execSync(`npx tsc --noEmit --skipLibCheck "${outputPath}"`, {
            cwd: join(__dirname, '..'),
            stdio: 'pipe'
          })
        } catch {
          return false
        }
      }

      return true
    } catch {
      return false
    }
  }

  private async generateReport(): Promise<void> {
    const reportPath = join(__dirname, 'validation', 'pipeline-report.json')
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      stages: this.results,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        validated: this.results.filter(r => r.validation).length
      }
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    logger.info(`📊 Report generated: ${reportPath}`)
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime
    const successful = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const validated = this.results.filter(r => r.validation).length

    logger.info('')
    logger.info('🎯 Pipeline Summary')
    logger.info('═'.repeat(60))
    logger.info(`⏱️  Total Duration: ${totalDuration}ms`)
    logger.info(`✅ Successful: ${successful}`)
    logger.info(`❌ Failed: ${failed}`)
    logger.info(`🔍 Validated: ${validated}`)
    logger.info('')

    // Detailed results
    logger.info('📋 Stage Results:')
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌'
      const validation = result.validation ? '🔍' : '⚠️'
      const duration = `${result.duration}ms`
      logger.info(`${status} ${validation} ${result.stage.padEnd(30)} ${duration.padStart(8)}`)
    }

    if (failed === 0) {
      logger.success('🎉 Pipeline completed successfully!')
    } else {
      logger.error(`⚠️  ${failed} stage(s) failed`)
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const pipeline = new APIGenerationPipeline()
  pipeline.run().catch(error => {
    logger.error('Pipeline failed:', error)
    process.exit(1)
  })
}

export { APIGenerationPipeline }
