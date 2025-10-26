#!/usr/bin/env node
/**
 * Fix Tailwind CSS Grid Circular Dependencies
 * Replaces .grid class that conflicts with Tailwind's grid utility
 */

import fs from 'fs'
import path from 'path'

function findCSSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      findCSSFiles(filePath, fileList)
    } else if (file.endsWith('.module.css')) {
      fileList.push(filePath)
    }
  }
  return fileList
}

const files = findCSSFiles('src/components')

const searchPattern = '.grid { @apply grid gap-4; }'
const replacement = `.gridContainer { 
  display: grid;
  gap: 1rem;
}`

console.log('🔧 Fixing Tailwind grid circular dependencies...\n')

let fixed = 0
let skipped = 0

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf-8')
    
    if (!content.includes(searchPattern)) {
      skipped++
      continue
    }
    
    const newContent = content.replace(searchPattern, replacement)
    fs.writeFileSync(file, newContent, 'utf-8')
    
    console.log(`✅ ${file}`)
    fixed++
  } catch (error) {
    console.error(`❌ ${file} - ${error.message}`)
  }
}

console.log('\n' + '═'.repeat(60))
console.log(`Summary: ${fixed} fixed, ${skipped} skipped`)
console.log('═'.repeat(60))

if (fixed > 0) {
  console.log('\n✅ All grid circular dependencies fixed!')
  console.log('   Vite dev server should now run without CSS errors.\n')
}

