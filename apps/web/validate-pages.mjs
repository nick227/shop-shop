#!/usr/bin/env node
/**
 * Quick Page Validation - Smoke Test
 * Validates that key pages load without errors
 */

const pages = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  { path: '/stores', name: 'Stores' },
]

const baseUrl = 'http://localhost:5177'

console.log('🔍 Validating pages...\n')

let passed = 0
let failed = 0

for (const page of pages) {
  try {
    const response = await fetch(`${baseUrl}${page.path}`)
    
    if (response.ok) {
      console.log(`✅ ${page.name.padEnd(15)} ${page.path}`)
      passed++
    } else {
      console.log(`❌ ${page.name.padEnd(15)} ${page.path} (${response.status})`)
      failed++
    }
  } catch (error) {
    console.log(`❌ ${page.name.padEnd(15)} ${page.path} (${error.message})`)
    failed++
  }
}

console.log(`\n${'='.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`${'='.repeat(50)}\n`)

if (failed > 0) {
  console.error('⚠️  Some pages failed to load')
  process.exit(1)
}

console.log('✅ All pages loaded successfully!')

