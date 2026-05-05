/**
 * Typegen Pipeline
 * 
 * Orchestrates the complete type generation pipeline from config to code.
 */

import { ResourceIR, TypegenIR, GenerationContext } from './ir.js'
import { normalizeResourceConfigs } from './normalize.js'
import { validateTypegenIR, formatValidationErrors } from './validators.js'
import { generateCode } from '../codegen/emit.js'
import { writeFile } from '../io/writer.js'
import { logger } from '../io/logger.js'

export interface PipelineOptions {
  configs: any[]
  outputPath: string
  tempDir?: string
  prettierConfig?: string
  tsconfigPath?: string
}

export interface PipelineResult {
  success: boolean
  outputPath: string
  errors: string[]
  warnings: string[]
  generatedAt: string
}

/**
 * Run the complete typegen pipeline
 */
export async function runPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    logger.info('Starting typegen pipeline...')
    
    // Step 1: Normalize configurations to IR
    logger.info('Normalizing resource configurations...')
    const resources = normalizeResourceConfigs(options.configs)
    logger.stats('Resources normalized', resources.length)
    
    // Step 2: Build complete IR
    const ir: TypegenIR = {
      resources,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'resource-config'
      }
    }
    
    // Step 3: Validate IR
    logger.info('Validating IR...')
    const validation = validateTypegenIR(ir)
    
    if (!validation.valid) {
      const errorMessage = formatValidationErrors(validation)
      errors.push(errorMessage)
      logger.error('Validation failed:', errorMessage)
      return {
        success: false,
        outputPath: options.outputPath,
        errors,
        warnings,
        generatedAt: new Date().toISOString()
      }
    }
    
    // Add warnings to result
    warnings.push(...validation.warnings.map(w => `${w.resource}: ${w.message}`))
    
    logger.success('Validation passed')
    
    // Step 4: Generate code
    logger.info('Generating code...')
    const context: GenerationContext = {
      outputPath: options.outputPath,
      tempDir: options.tempDir || '/tmp',
      prettierConfig: options.prettierConfig,
      tsconfigPath: options.tsconfigPath
    }
    
    const generatedCode = await generateCode(ir, context)
    logger.success('Code generated')
    
    // Step 5: Write output
    logger.info('Writing output...')
    await writeFile(options.outputPath, generatedCode, context)
    logger.success(`Output written to ${options.outputPath}`)
    
    const duration = Date.now() - startTime
    logger.stats('Pipeline completed', `${duration}ms`)
    
    return {
      success: true,
      outputPath: options.outputPath,
      errors,
      warnings,
      generatedAt: new Date().toISOString()
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    errors.push(errorMessage)
    logger.error('Pipeline failed:', errorMessage)
    
    return {
      success: false,
      outputPath: options.outputPath,
      errors,
      warnings,
      generatedAt: new Date().toISOString()
    }
  }
}

/**
 * Run pipeline with error handling and logging
 */
export async function runPipelineWithErrorHandling(options: PipelineOptions): Promise<void> {
  const result = await runPipeline(options)
  
  if (!result.success) {
    logger.error('Pipeline failed with errors:')
    for (const error of result.errors) {
      logger.error(`  ${error}`)
    }
    process.exit(1)
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Pipeline completed with warnings:')
    for (const warning of result.warnings) {
      logger.warn(`  ${warning}`)
    }
  }
  
  logger.success('Pipeline completed successfully')
}
