/**
 * File Utilities with Transaction Support
 * 
 * Provides backup/rollback capability for generated files
 */
import fs from 'node:fs'
import path from 'node:path'
import { logger } from './logger.js'

/**
 * File generation transaction with rollback support
 */
export class GenerationTransaction {
  private backups: Map<string, string | null> = new Map()
  private committed = false
  
  /**
   * Write file with automatic backup
   */
  async write(filePath: string, content: string): Promise<void> {
    try {
      // Backup existing file if it exists
      if (fs.existsSync(filePath) && !this.backups.has(filePath)) {
        const backup = fs.readFileSync(filePath, 'utf-8')
        this.backups.set(filePath, backup)
      } else if (!this.backups.has(filePath)) {
        // Track new files (no backup needed)
        this.backups.set(filePath, null)
      }
      
      // Ensure directory exists
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Write new content
      fs.writeFileSync(filePath, content, 'utf-8')
      
    } catch (error) {
      logger.error(`Failed to write ${filePath}:`)
      throw error
    }
  }
  
  /**
   * Commit all changes (clear backups)
   */
  commit(): void {
    this.backups.clear()
    this.committed = true
    logger.debug('Transaction committed')
  }
  
  /**
   * Rollback all changes
   */
  rollback(): void {
    if (this.committed) {
      logger.warn('Cannot rollback committed transaction')
      return
    }
    
    logger.warn('Rolling back changes...')
    let restored = 0
    let deleted = 0
    
    for (const [filePath, backup] of this.backups) {
      try {
        if (backup === null) {
          // New file - delete it
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            deleted++
          }
        } else {
          // Existing file - restore backup
          fs.writeFileSync(filePath, backup, 'utf-8')
          restored++
        }
      } catch (error) {
        logger.error(`Failed to rollback ${filePath}:`, error)
      }
    }
    
    this.backups.clear()
    logger.success(`Rollback complete (${restored} restored, ${deleted} deleted)`)
  }
  
  /**
   * Get list of modified files
   */
  getModifiedFiles(): string[] {
    return Array.from(this.backups.keys())
  }
}

/**
 * Safely read file with error handling
 */
export function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Safely write file with directory creation
 */
export function safeWriteFile(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content, 'utf-8')
    return true
  } catch (error) {
    logger.error(`Failed to write ${filePath}:`, error)
    return false
  }
}

