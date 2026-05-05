#!/usr/bin/env tsx
/**
 * Typegen CLI
 * 
 * Replaces the old generate-type-mappers.ts with a modern, typed pipeline.
 * 
 * Usage: tsx packages/sdk/scripts/typegen/cli.ts
 */

import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { runPipelineWithErrorHandling } from './core/pipeline.js'
import { RESOURCE_CONFIGS } from '../resource-config.js'
import { logger } from './io/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Main CLI function
 */
async function main() {
  try {
    logger.section('Typegen Pipeline v2')
    
    // Load resource configurations
    logger.info('Loading resource configurations...')
    const configs = RESOURCE_CONFIGS
    logger.stats('Configs loaded', configs.length)
    
    // Determine output path
    const outputPath = resolve(__dirname, '../../../../apps/web/src/api/backend-types.ts')
    logger.info(`Output path: ${outputPath}`)
    
    // Run pipeline
    await runPipelineWithErrorHandling({
      configs,
      outputPath,
      tempDir: '/tmp',
      prettierConfig: resolve(__dirname, '../../../../.prettierrc'),
      tsconfigPath: resolve(__dirname, '../../../../apps/web/tsconfig.json')
    })
    
  } catch (error) {
    logger.error('CLI failed:', error)
    process.exit(1)
  }
}

// Run CLI
main().catch(console.error)
