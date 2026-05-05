#!/usr/bin/env tsx

/**
 * Remove Deprecated Files Script
 * 
 * This script safely removes deprecated files and updates imports
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

// ============================================
// Deprecated Files to Remove
// ============================================

const DEPRECATED_FILES = [
  {
    path: 'api/schemas.ts',
    reason: 'DEPRECATED - Use UnifiedSchemas instead',
    replacement: 'schemas/UnifiedSchemas.ts'
  },
  {
    path: 'utils/validation.ts', 
    reason: 'DEPRECATED - Use ConsistentSchemas instead',
    replacement: 'schemas/ConsistentSchemas.ts'
  },
  {
    path: 'hooks/useFormValidation.ts',
    reason: 'DEPRECATED - Use unified validation service instead',
    replacement: 'hooks/templates/useEntity.ts (new pattern)'
  }
]

// ============================================
// Import Updates
// ============================================

const IMPORT_UPDATES = [
  {
    // Update imports from deprecated api/schemas.ts
    from: /from ["']\.\.\/api\/schemas["']/g,
    to: "from '@schemas/UnifiedSchemas'"
  },
  {
    from: /from ["']@\/api\/schemas["']/g,
    to: "from '@schemas/UnifiedSchemas'"
  },
  {
    // Update imports from deprecated utils/validation.ts
    from: /from ["']\.\.\/utils\/validation["']/g,
    to: "from '@schemas/ConsistentSchemas'"
  },
  {
    from: /from ["']@\/utils\/validation["']/g,
    to: "from '@schemas/ConsistentSchemas'"
  },
  {
    // Update imports from deprecated useFormValidation
    from: /from ["']\.\.\/hooks\/useFormValidation["']/g,
    to: "from '@shared/hooks/templates/useEntity'"
  },
  {
    from: /from ["']@\/hooks\/useFormValidation["']/g,
    to: "from '@shared/hooks/templates/useEntity'"
  }
]

// ============================================
// Main Script
// ============================================

async function removeDeprecatedFiles(): Promise<void> {
  console.log('🗑️ Removing deprecated files...')
  
  // Step 1: Check which files exist
  const existingFiles = DEPRECATED_FILES.filter(file => 
    existsSync(join('src', file.path))
  )
  
  if (existingFiles.length === 0) {
    console.log('✅ No deprecated files found to remove')
    return
  }
  
  console.log(`Found ${existingFiles.length} deprecated files to remove:`)
  for (const file of existingFiles) {
    console.log(`  - ${file.path} (${file.reason})`)
  }
  
  // Step 2: Update imports before removing files
  console.log('\n🔄 Updating imports...')
  await updateImports()
  
  // Step 3: Remove deprecated files
  console.log('\n🗑️ Removing files...')
  for (const file of existingFiles) {
    const filePath = join('src', file.path)
    unlinkSync(filePath)
    console.log(`  ✅ Removed ${file.path}`)
  }
  
  // Step 4: Validate changes
  console.log('\n✅ Validating changes...')
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    console.log('  ✅ TypeScript validation passed')
  } catch {
    console.error('  ❌ TypeScript validation failed')
    console.error('Please fix the errors and run again')
    process.exit(1)
  }
  
  console.log('\n🎉 Deprecated files removed successfully!')
}

async function updateImports(): Promise<void> {
  // Find all TypeScript files
  const files = getAllTypeScriptFiles()
  let updatedCount = 0
  
  for (const file of files) {
    let content = readFileSync(file, 'utf-8')
    let hasChanges = false
    
    // Apply import updates
    for (const update of IMPORT_UPDATES) {
      if (update.from.test(content)) {
        content = content.replace(update.from, update.to)
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      writeFileSync(file, content)
      updatedCount++
      console.log(`  ✅ Updated imports in ${file}`)
    }
  }
  
  console.log(`Updated imports in ${updatedCount} files`)
}

function getAllTypeScriptFiles(): string[] {
  const files: string[] = []
  
  const scanDir = (dir: string) => {
    try {
      const entries = require('node:fs').readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath)
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath)
        }
      }
    } catch {
      // Ignore errors (permission denied, etc.)
    }
  }
  
  scanDir('src')
  return files
}

// Run if called directly
if (require.main === module) {
  removeDeprecatedFiles().catch(console.error)
}

export { removeDeprecatedFiles }
