#!/usr/bin/env node
/**
 * Fix Circular Dependencies in UI Components
 * Replaces barrel imports with direct imports
 */

import fs from 'fs'
import path from 'path'

const fixes = [
  {
    file: 'src/components/ui/EmptyState/EmptyState.tsx',
    from: "import { Button } from '../../ui'",
    to: "import { Button } from '../Button'",
  },
  {
    file: 'src/components/ui/ErrorState/ErrorState.tsx',
    from: "import { Button } from '../../ui'",
    to: "import { Button } from '../Button'",
  },
  {
    file: 'src/components/ui/LoadingState/LoadingState.tsx',
    from: "import { Spinner } from '../../ui'",
    to: "import { Spinner } from '../Spinner'",
  },
  {
    file: 'src/components/ui/SectionHeader/SectionHeader.tsx',
    from: "import { Button } from '../../ui'",
    to: "import { Button } from '../Button'",
  },
  {
    file: 'src/components/ui/StatCard/StatCard.tsx',
    from: "import { Card } from '../../ui'",
    to: "import { Card } from '../Card'",
  },
]

console.log('🔧 Fixing circular dependencies...\n')

let fixed = 0
let failed = 0

for (const fix of fixes) {
  try {
    const filePath = path.join(process.cwd(), fix.file)
    const content = fs.readFileSync(filePath, 'utf-8')
    
    if (!content.includes(fix.from)) {
      console.log(`⏭️  ${fix.file} - Already fixed or pattern not found`)
      continue
    }
    
    const newContent = content.replace(fix.from, fix.to)
    fs.writeFileSync(filePath, newContent, 'utf-8')
    
    console.log(`✅ ${fix.file}`)
    console.log(`   ${fix.from}`)
    console.log(`   → ${fix.to}\n`)
    fixed++
  } catch (error) {
    console.error(`❌ ${fix.file} - ${error.message}\n`)
    failed++
  }
}

console.log('═'.repeat(60))
console.log(`Summary: ${fixed} fixed, ${failed} failed`)
console.log('═'.repeat(60))

if (fixed > 0) {
  console.log('\n✅ Run madge again to verify:')
  console.log('   npx madge --circular --extensions ts,tsx --ts-config ./tsconfig.json src/main.tsx\n')
}

