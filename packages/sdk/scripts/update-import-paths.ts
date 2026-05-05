#!/usr/bin/env tsx
/**
 * Update Import Paths Script
 * 
 * This script updates import paths in apps/web to use the new generated file locations
 */

import { PATHS } from './paths.js'
import { logger } from './logger.js'
import fs from 'node:fs'
import path from 'node:path'

interface ImportUpdate {
  oldPath: string
  newPath: string
  description: string
}

const importUpdates: ImportUpdate[] = [
  // API Wrapper imports
  {
    oldPath: '@api/apiWrapper',
    newPath: '../../../../packages/sdk/generated/frontend/api/apiWrapper',
    description: 'API Wrapper imports'
  },
  {
    oldPath: '../api/apiWrapper',
    newPath: '../../../../packages/sdk/generated/frontend/api/apiWrapper',
    description: 'Relative API Wrapper imports'
  },
  
  // Backend Types imports
  {
    oldPath: '@api/backend-types',
    newPath: '../../../../packages/sdk/generated/frontend/types/backend-types',
    description: 'Backend Types imports'
  },
  {
    oldPath: '../api/backend-types',
    newPath: '../../../../packages/sdk/generated/frontend/types/backend-types',
    description: 'Relative Backend Types imports'
  },
  
  // Type Mappers imports
  {
    oldPath: '@api/type-mappers',
    newPath: '../../../../packages/sdk/generated/frontend/api/type-mappers',
    description: 'Type Mappers imports'
  },
  {
    oldPath: '../api/type-mappers',
    newPath: '../../../../packages/sdk/generated/frontend/api/type-mappers',
    description: 'Relative Type Mappers imports'
  },
  
  // Centralized Types imports
  {
    oldPath: '@api/types/centralized',
    newPath: '../../../../packages/sdk/generated/frontend/types/centralized',
    description: 'Centralized Types imports'
  },
  {
    oldPath: '../api/types/centralized',
    newPath: '../../../../packages/sdk/generated/frontend/types/centralized',
    description: 'Relative Centralized Types imports'
  },
  
  // Generated Hooks imports
  {
    oldPath: '@api/hooks/generated',
    newPath: '../../../../packages/sdk/generated/frontend/hooks/generated',
    description: 'Generated Hooks imports'
  },
  {
    oldPath: '../api/hooks/generated',
    newPath: '../../../../packages/sdk/generated/frontend/hooks/generated',
    description: 'Relative Generated Hooks imports'
  },
]

async function updateFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8')
  let changes = 0
  
  for (const update of importUpdates) {
    const oldImportRegex = new RegExp(`from ['"]${update.oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')
    const newImport = `from '${update.newPath}'`
    
    if (oldImportRegex.test(content)) {
      content = content.replace(oldImportRegex, newImport)
      changes++
      logger.info(`  Updated ${update.description} in ${path.relative(PATHS.web.root, filePath)}`)
    }
  }
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content)
  }
  
  return changes
}

async function updateDirectory(dirPath: string): Promise<{ files: number; changes: number }> {
  let files = 0
  let totalChanges = 0
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (['node_modules', 'dist', 'build', '.git'].includes(entry.name)) {
        continue
      }
      
      const result = await updateDirectory(fullPath)
      files += result.files
      totalChanges += result.changes
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files++
      const changes = await updateFile(fullPath)
      totalChanges += changes
    }
  }
  
  return { files, changes: totalChanges }
}

async function main() {
  try {
    logger.section('Updating Import Paths in apps/web')
    
    const result = await updateDirectory(PATHS.web.src)
    
    logger.success(`Updated ${result.changes} import statements across ${result.files} files`)
    
    logger.info('Next steps:')
    logger.info('1. Test the application to ensure all imports work')
    logger.info('2. Run type checking to verify no errors')
    logger.info('3. Update any remaining manual imports if needed')
    
  } catch (error) {
    logger.error('Failed to update import paths:')
    logger.error(String(error))
    process.exit(1)
  }
}

// Run the update
main().catch(console.error)
