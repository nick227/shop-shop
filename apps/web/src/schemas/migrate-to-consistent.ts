#!/usr/bin/env tsx

/**
 * Schema Migration Script
 * Migrates all schema usage to consistent schemas
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

interface MigrationRule {
  from: string
  to: string
  description: string
}

const MIGRATION_RULES: MigrationRule[] = [
  // Import migrations
  {
    from: "import { z } from 'zod'",
    to: "import { z } from 'zod'",
    description: "Keep zod import"
  },
  {
    from: "import { emailSchema, passwordSchema } from '@shared/lib/validation'",
    to: "import { emailSchema, passwordSchema } from '@schemas/ConsistentSchemas'",
    description: "Update validation imports"
  },
  {
    from: "import { schemas } from './api/schemas'",
    to: "import { schemas } from './api/schemas/UnifiedSchemas'",
    description: "Update API schema imports"
  },
  {
    from: "import { schemas } from '../api/schemas'",
    to: "import { schemas } from '../api/schemas/UnifiedSchemas'",
    description: "Update relative API schema imports"
  },
  {
    from: "from '@packages/schemas'",
    to: "from './api/schemas/UnifiedSchemas'",
    description: "Update packages schema imports"
  },
  
  // Schema usage migrations
  {
    from: "const loginSchema = z.object({",
    to: "import { loginFormSchema } from '@schemas/ConsistentSchemas'\n// const loginSchema = loginFormSchema // Use loginFormSchema directly",
    description: "Replace manual login schema"
  },
  {
    from: "const signupSchema = z.object({",
    to: "import { signupFormSchema } from '@schemas/ConsistentSchemas'\n// const signupSchema = signupFormSchema // Use signupFormSchema directly",
    description: "Replace manual signup schema"
  },
  
  // Deprecated schema migrations
  {
    from: "emailSchema",
    to: "emailSchema", // Keep same name but import from consistent schemas
    description: "Update emailSchema import"
  },
  {
    from: "passwordSchema",
    to: "passwordSchema", // Keep same name but import from consistent schemas
    description: "Update passwordSchema import"
  },
  {
    from: "phoneSchema",
    to: "phoneSchema", // Keep same name but import from consistent schemas
    description: "Update phoneSchema import"
  }
]

/**
 * Migrate a single file
 */
function migrateFile(filePath: string): { migrated: boolean; changes: string[] } {
  const content = readFileSync(filePath, 'utf-8')
  let newContent = content
  const changes: string[] = []
  
  for (const rule of MIGRATION_RULES) {
    if (newContent.includes(rule.from)) {
      newContent = newContent.replaceAll(new RegExp(rule.from.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&'), 'g'), rule.to)
      changes.push(rule.description)
    }
  }
  
  if (newContent !== content) {
    writeFileSync(filePath, newContent)
    return { migrated: true, changes }
  }
  
  return { migrated: false, changes: [] }
}

/**
 * Find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = []
  
  try {
    const entries = readdirSync(dir)
    
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...findTsFiles(fullPath))
      } else if (stat.isFile() && (extname(entry) === '.ts' || extname(entry) === '.tsx')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}:`, error)
  }
  
  return files
}

/**
 * Main migration function
 */
async function migrateSchemas() {
  console.log('🚀 Starting schema migration...')
  
  const srcDir = join(process.cwd(), 'src')
  const files = findTsFiles(srcDir)
  
  console.log(`📁 Found ${files.length} TypeScript files`)
  
  let migratedCount = 0
  const allChanges: string[] = []
  
  for (const file of files) {
    const result = migrateFile(file)
    if (result.migrated) {
      migratedCount++
      console.log(`✅ Migrated: ${file}`)
      for (const change of result.changes) {
        console.log(`   - ${change}`)
        allChanges.push(change)
      }
    }
  }
  
  console.log(`\n📊 Migration Summary:`)
  console.log(`- Files processed: ${files.length}`)
  console.log(`- Files migrated: ${migratedCount}`)
  console.log(`- Total changes: ${allChanges.length}`)
  
  if (allChanges.length > 0) {
    console.log(`\n🔧 Changes made:`)
    const uniqueChanges = [...new Set(allChanges)]
    for (const change of uniqueChanges) {
      const count = allChanges.filter(c => c === change).length
      console.log(`- ${change} (${count} times)`)
    }
  }
  
  console.log('\n✅ Schema migration completed!')
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSchemas().catch(console.error)
}

export { migrateSchemas }
