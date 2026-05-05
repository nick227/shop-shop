#!/usr/bin/env tsx
/**
 * Migration Script: Move to New Generation Structure
 * 
 * This script migrates existing generated files to the new organized structure
 * and updates import paths accordingly.
 */

import { PATHS } from './paths.js'
import { logger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'
import fs from 'node:fs'
import path from 'node:path'

interface MigrationTask {
  name: string
  source: string
  destination: string
  updateImports?: boolean
}

const migrationTasks: MigrationTask[] = [
  // Move SDK generated files
  {
    name: 'Move SDK APIs',
    source: 'src/apis',
    destination: 'generated/sdk/apis',
  },
  {
    name: 'Move SDK Models',
    source: 'src/models',
    destination: 'generated/sdk/models',
  },
  {
    name: 'Move SDK Runtime',
    source: 'src/runtime.ts',
    destination: 'generated/sdk/runtime.ts',
  },
  {
    name: 'Move SDK Validators',
    source: 'src/validators.ts',
    destination: 'generated/sdk/validators.ts',
  },
  
  // Move frontend generated files
  {
    name: 'Move API Wrapper',
    source: '../../apps/web/src/api/apiWrapper.ts',
    destination: 'generated/frontend/api/apiWrapper.ts',
  },
  {
    name: 'Move Type Mappers',
    source: '../../apps/web/src/api/type-mappers.ts',
    destination: 'generated/frontend/api/type-mappers.ts',
  },
  {
    name: 'Move Backend Types',
    source: '../../apps/web/src/api/backend-types.ts',
    destination: 'generated/frontend/types/backend-types.ts',
  },
  {
    name: 'Move Centralized Types',
    source: '../../apps/web/src/api/types/centralized.ts',
    destination: 'generated/frontend/types/centralized.ts',
  },
  {
    name: 'Move Generated Hooks',
    source: '../../apps/web/src/api/hooks/generated.ts',
    destination: 'generated/frontend/hooks/generated.ts',
  },
  
  // Move generated scripts
  {
    name: 'Move Resource Config',
    source: 'scripts/resource-config.ts',
    destination: 'generated/scripts/resource-config.ts',
  },
]

async function migrateFile(task: MigrationTask): Promise<void> {
  const sourcePath = path.resolve(PATHS.sdk.root, task.source)
  const destPath = path.resolve(PATHS.sdk.root, task.destination)
  
  if (!fs.existsSync(sourcePath)) {
    logger.warn(`Source file not found: ${task.source}`)
    return
  }
  
  // Ensure destination directory exists
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  
  // Copy file
  fs.copyFileSync(sourcePath, destPath)
  logger.success(`Moved: ${task.source} → ${task.destination}`)
  
  // Update imports if needed
  if (task.updateImports) {
    // TODO: Implement import path updates
    logger.info(`Import updates needed for: ${task.destination}`)
  }
}

async function migrateDirectory(task: MigrationTask): Promise<void> {
  const sourcePath = path.resolve(PATHS.sdk.root, task.source)
  const destPath = path.resolve(PATHS.sdk.root, task.destination)
  
  if (!fs.existsSync(sourcePath)) {
    logger.warn(`Source directory not found: ${task.source}`)
    return
  }
  
  // Ensure destination directory exists
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true })
  }
  
  // Copy directory contents
  const files = fs.readdirSync(sourcePath)
  for (const file of files) {
    const sourceFile = path.join(sourcePath, file)
    const destFile = path.join(destPath, file)
    
    if (fs.statSync(sourceFile).isDirectory()) {
      fs.mkdirSync(destFile, { recursive: true })
      // Recursively copy subdirectories
      const subFiles = fs.readdirSync(sourceFile)
      for (const subFile of subFiles) {
        const subSourceFile = path.join(sourceFile, subFile)
        const subDestFile = path.join(destFile, subFile)
        fs.copyFileSync(subSourceFile, subDestFile)
      }
    } else {
      fs.copyFileSync(sourceFile, destFile)
    }
  }
  
  logger.success(`Moved directory: ${task.source} → ${task.destination}`)
}

async function main() {
  const transaction = new GenerationTransaction()
  
  try {
    logger.section('Migration to New Generation Structure')
    
    for (const task of migrationTasks) {
      logger.info(`Migrating: ${task.name}`)
      
      if (task.source.endsWith('/')) {
        await migrateDirectory(task)
      } else {
        await migrateFile(task)
      }
    }
    
    // Create new index files that re-export from generated locations
    await createNewIndexFiles()
    
    transaction.commit()
    logger.success('Migration completed successfully!')
    logger.info('Next steps:')
    logger.info('1. Update import paths in apps/web')
    logger.info('2. Update package.json exports')
    logger.info('3. Test the new structure')
    
  } catch (error) {
    logger.error('Migration failed:')
    logger.error(String(error))
    transaction.rollback()
    process.exit(1)
  }
}

async function createNewIndexFiles(): Promise<void> {
  // Create new SDK index that re-exports from generated locations
  const sdkIndexContent = `/**
 * SDK Package Entry Point
 * 
 * This file re-exports generated SDK files and source utilities
 */

// Re-export generated SDK files
export * from './generated/sdk/apis'
export * from './generated/sdk/models'
export * from './generated/sdk/runtime'
export * from './generated/sdk/validators'

// Re-export source files
export * from './src/realtime'
`

  const sdkIndexPath = path.join(PATHS.sdk.root, 'src/index.ts')
  fs.writeFileSync(sdkIndexPath, sdkIndexContent)
  logger.success('Created new SDK index file')
}

// Run migration
main().catch(console.error)
