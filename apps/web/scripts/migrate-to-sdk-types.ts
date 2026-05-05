#!/usr/bin/env tsx
/**
 * Systematic SDK Type Migration Script
 * 
 * This script systematically migrates all components to use SDK types
 * instead of custom type definitions.
 * 
 * Usage: tsx scripts/migrate-to-sdk-types.ts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface MigrationRule {
  pattern: RegExp
  replacement: string
  description: string
}

const MIGRATION_RULES: MigrationRule[] = [
  // Replace backend-types imports
  {
    pattern: /import.*from.*['"]@api\/backend-types['"]/g,
    replacement: "import type { $1 } from '@api/types'",
    description: 'Replace backend-types imports with SDK types'
  },
  
  // Replace specific type imports
  {
    pattern: /import.*StoreResponse.*from.*['"]@api\/backend-types['"]/g,
    replacement: "import type { StoreResponse } from '@api/types'",
    description: 'Replace StoreResponse imports'
  },
  
  {
    pattern: /import.*ItemResponse.*from.*['"]@api\/backend-types['"]/g,
    replacement: "import type { ItemResponse } from '@api/types'",
    description: 'Replace ItemResponse imports'
  },
  
  {
    pattern: /import.*OrderResponse.*from.*['"]@api\/backend-types['"]/g,
    replacement: "import type { OrderResponse } from '@api/types'",
    description: 'Replace OrderResponse imports'
  },
  
  {
    pattern: /import.*UserResponse.*from.*['"]@api\/backend-types['"]/g,
    replacement: "import type { UserResponse } from '@api/types'",
    description: 'Replace UserResponse imports'
  },
  
  // Replace inline type references
  {
    pattern: /import\('@api\/backend-types'\)\.StoreResponse/g,
    replacement: "import('@api/types').StoreResponse",
    description: 'Replace inline StoreResponse references'
  },
  
  {
    pattern: /import\('@api\/backend-types'\)\.ItemResponse/g,
    replacement: "import('@api/types').ItemResponse",
    description: 'Replace inline ItemResponse references'
  },
  
  {
    pattern: /import\('@api\/backend-types'\)\.OrderResponse/g,
    replacement: "import('@api/types').OrderResponse",
    description: 'Replace inline OrderResponse references'
  },
  
  {
    pattern: /import\('@api\/backend-types'\)\.UserResponse/g,
    replacement: "import('@api/types').UserResponse",
    description: 'Replace inline UserResponse references'
  },
  
  // Replace StoreWithDistance references
  {
    pattern: /import\('@api\/backend-types'\)\.StoreWithDistance/g,
    replacement: "import('@api/types').StoreWithDistance",
    description: 'Replace inline StoreWithDistance references'
  },
  
  // Replace handler type references
  {
    pattern: /StoreClickHandler.*from.*['"]@api\/backend-types['"]/g,
    replacement: "StoreClickHandler } from '@api/types'",
    description: 'Replace StoreClickHandler imports'
  },
  
  {
    pattern: /ProductClickHandler.*from.*['"]@api\/backend-types['"]/g,
    replacement: "ProductClickHandler } from '@api/types'",
    description: 'Replace ProductClickHandler imports'
  },
  
  {
    pattern: /OrderClickHandler.*from.*['"]@api\/backend-types['"]/g,
    replacement: "OrderClickHandler } from '@api/types'",
    description: 'Replace OrderClickHandler imports'
  }
]

function migrateFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    let modifiedContent = content
    let hasChanges = false
    
    for (const rule of MIGRATION_RULES) {
      const newContent = modifiedContent.replace(rule.pattern, rule.replacement)
      if (newContent !== modifiedContent) {
        console.log(`  ✅ ${rule.description}`)
        modifiedContent = newContent
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      writeFileSync(filePath, modifiedContent, 'utf-8')
      return true
    }
    
    return false
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error)
    return false
  }
}

function findTsFiles(dir: string): string[] {
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Skip node_modules and dist directories
        if (!['node_modules', 'dist', '.git'].includes(entry)) {
          files.push(...findTsFiles(fullPath))
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }
  
  return files
}

function main() {
  console.log('🚀 Starting Systematic SDK Type Migration...\n')
  
  const srcDir = join(process.cwd(), 'apps/web/src')
  const tsFiles = findTsFiles(srcDir)
  
  console.log(`📁 Found ${tsFiles.length} TypeScript files to process\n`)
  
  let migratedFiles = 0
  let totalFiles = 0
  
  for (const filePath of tsFiles) {
    const relativePath = filePath.replace(process.cwd(), '')
    console.log(`📄 Processing: ${relativePath}`)
    
    totalFiles++
    
    if (migrateFile(filePath)) {
      migratedFiles++
      console.log(`  ✅ Migrated successfully\n`)
    } else {
      console.log(`  ⏭️  No changes needed\n`)
    }
  }
  
  console.log('🎉 Migration Complete!')
  console.log(`📊 Results:`)
  console.log(`  • Total files processed: ${totalFiles}`)
  console.log(`  • Files migrated: ${migratedFiles}`)
  console.log(`  • Files unchanged: ${totalFiles - migratedFiles}`)
  
  if (migratedFiles > 0) {
    console.log('\n🔍 Next steps:')
    console.log('  1. Run linting to check for any issues')
    console.log('  2. Test the application to ensure everything works')
    console.log('  3. Remove any remaining backend-types.ts files')
  }
}

// Run the migration
main()
