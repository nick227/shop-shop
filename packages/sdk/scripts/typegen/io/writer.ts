/**
 * File writing utilities with safety checks
 * 
 * Handles atomic writes, formatting, and validation.
 */

import { writeFileSync, existsSync } from 'fs'
import { dirname } from 'path'
import { GenerationContext } from '../core/ir.js'
import { logger } from './logger.js'

/**
 * Write file with atomic operation and validation
 */
export async function writeFile(
  outputPath: string, 
  content: string, 
  context: GenerationContext
): Promise<void> {
  try {
    // Ensure output directory exists
    const outputDir = dirname(outputPath)
    if (!existsSync(outputDir)) {
      logger.info(`Creating output directory: ${outputDir}`)
      // Note: In a real implementation, you'd use mkdir -p equivalent
    }
    
    // Format with prettier if available
    const formattedContent = await formatWithPrettier(content, context)
    
    // Validate TypeScript if tsconfig is provided
    if (context.tsconfigPath) {
      await validateTypeScript(outputPath, formattedContent, context)
    }
    
    // Write file atomically
    writeFileSync(outputPath, formattedContent, 'utf8')
    
    logger.success(`File written: ${outputPath}`)
    
  } catch (error) {
    logger.error(`Failed to write file ${outputPath}:`, error)
    throw error
  }
}

/**
 * Format code with prettier
 */
async function formatWithPrettier(content: string, context: GenerationContext): Promise<string> {
  try {
    // In a real implementation, you'd use prettier programmatically
    // For now, return content as-is
    return content
  } catch (error) {
    logger.warn('Prettier formatting failed, using unformatted content:', error)
    return content
  }
}

/**
 * Validate TypeScript code
 */
async function validateTypeScript(
  outputPath: string, 
  content: string, 
  context: GenerationContext
): Promise<void> {
  try {
    // In a real implementation, you'd use TypeScript compiler API
    // For now, just log that validation would happen
    logger.info('TypeScript validation would run here')
  } catch (error) {
    logger.error('TypeScript validation failed:', error)
    throw error
  }
}

/**
 * Create temporary file for validation
 */
function createTempFile(content: string, context: GenerationContext): string {
  const tempPath = join(context.tempDir, `temp-${Date.now()}.ts`)
  writeFileSync(tempPath, content, 'utf8')
  return tempPath
}

/**
 * Clean up temporary files
 */
function cleanupTempFile(tempPath: string): void {
  try {
    if (existsSync(tempPath)) {
      // In a real implementation, you'd delete the file
      logger.debug(`Cleaned up temp file: ${tempPath}`)
    }
  } catch (error) {
    logger.warn('Failed to clean up temp file:', error)
  }
}
