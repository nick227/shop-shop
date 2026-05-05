/**
 * Post-Generation Validation
 * 
 * Validates generated code to catch errors immediately
 */
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { logger } from './logger.js'

const execAsync = promisify(exec)

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
  duration: number
}

/**
 * Validate generated TypeScript code
 */
export async function validateGeneratedCode(): Promise<ValidationResult> {
  const start = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    logger.info('Validating generated code...')
    
    // Run TypeScript compiler in check mode
    const { stdout, stderr } = await execAsync(
      'pnpm --filter "@apps/web" exec tsc --noEmit',
      { cwd: process.cwd() }
    )
    
    if (stderr && stderr.trim()) {
      // Parse TypeScript errors
      const lines = stderr.split('\n')
      for (const line of lines) {
        if (line.includes('error TS')) {
          errors.push(line.trim())
        } else if (line.trim()) {
          warnings.push(line.trim())
        }
      }
    }
    
    const duration = Date.now() - start
    
    if (errors.length === 0) {
      logger.success(`Validation passed (${duration}ms)`)
      return { success: true, errors, warnings, duration }
    } else {
      logger.error(`Validation failed with ${errors.length} error(s)`)
      errors.slice(0, 5).forEach(err => logger.error(`  ${err}`))
      if (errors.length > 5) {
        logger.error(`  ... and ${errors.length - 5} more`)
      }
      return { success: false, errors, warnings, duration }
    }
    
  } catch (error: unknown) {
    const duration = Date.now() - start
    const err = error as { message?: string; stdout?: string; stderr?: string }
    
    // TypeScript errors cause non-zero exit code
    if (err.stderr || err.stdout) {
      const output = (err.stderr || err.stdout || '').toString()
      const lines = output.split('\n')
      
      for (const line of lines) {
        if (line.includes('error TS')) {
          errors.push(line.trim())
        }
      }
      
      if (errors.length === 0) {
        errors.push(err.message || 'Unknown validation error')
      }
    } else {
      errors.push(err.message || 'Unknown validation error')
    }
    
    logger.error(`Validation failed: ${errors[0]}`)
    return { success: false, errors, warnings, duration }
  }
}

/**
 * Quick syntax check (faster than full typecheck)
 */
export async function quickSyntaxCheck(filePath: string): Promise<boolean> {
  try {
    await execAsync(`npx tsc --noEmit --skipLibCheck ${filePath}`)
    return true
  } catch {
    return false
  }
}

