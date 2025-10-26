#!/usr/bin/env node
/**
 * Simple Browser Compatibility Test for Client SDK
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Testing SDK Browser Compatibility...\n')

// Test 1: Check SDK source files for Node.js patterns
console.log('1. Checking SDK source files...')
const sdkSrcPath = path.join(__dirname, 'packages', 'sdk', 'src')
let sdkIssues = 0

if (fs.existsSync(sdkSrcPath)) {
  const files = fs.readdirSync(sdkSrcPath, { recursive: true })
  for (const file of files) {
    if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.js'))) {
      const filePath = path.join(sdkSrcPath, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      
      if (content.includes('require(') || content.includes('module.exports') || content.includes('process.')) {
        console.log(`❌ Found Node.js patterns in: ${file}`)
        sdkIssues++
      }
    }
  }
} else {
  console.log('❌ SDK source directory not found')
  sdkIssues++
}

// Test 2: Check API Factory for require() statements
console.log('\n2. Checking API Factory...')
const apiFactoryPath = path.join(__dirname, 'apps', 'web', 'src', 'api', 'factory', 'ApiInstanceFactory.ts')
let apiIssues = 0

if (fs.existsSync(apiFactoryPath)) {
  const content = fs.readFileSync(apiFactoryPath, 'utf-8')
  
  if (content.includes('require(')) {
    console.log('❌ Found require() statements in ApiInstanceFactory.ts')
    apiIssues++
  } else {
    console.log('✅ No require() statements found in ApiInstanceFactory.ts')
  }
  
  if (content.includes('import {') && content.includes('from \'@packages/sdk\'')) {
    console.log('✅ Proper ES6 imports found in ApiInstanceFactory.ts')
  } else {
    console.log('❌ Missing proper ES6 imports in ApiInstanceFactory.ts')
    apiIssues++
  }
} else {
  console.log('❌ API Factory file not found')
  apiIssues++
}

// Test 3: Check for ESM patterns in SDK
console.log('\n3. Checking for ESM patterns...')
const runtimePath = path.join(__dirname, 'packages', 'sdk', 'src', 'runtime.ts')
let esmIssues = 0

if (fs.existsSync(runtimePath)) {
  const content = fs.readFileSync(runtimePath, 'utf-8')
  
  if (content.includes('export const') && content.includes('export function')) {
    console.log('✅ ESM exports found in runtime.ts')
  } else {
    console.log('❌ Missing ESM exports in runtime.ts')
    esmIssues++
  }
} else {
  console.log('❌ Runtime file not found')
  esmIssues++
}

// Summary
console.log('\n📊 Test Results:')
console.log(`   SDK source issues: ${sdkIssues}`)
console.log(`   API Factory issues: ${apiIssues}`)
console.log(`   ESM pattern issues: ${esmIssues}`)

const totalIssues = sdkIssues + apiIssues + esmIssues

if (totalIssues === 0) {
  console.log('\n✅ SUCCESS: SDK is browser-compatible!')
  console.log('   No Node.js patterns found.')
  console.log('   Proper ES6 imports are being used.')
  console.log('   ESM patterns are present.')
  process.exit(0)
} else {
  console.log('\n❌ FAILURE: SDK has browser compatibility issues!')
  console.log(`   Found ${totalIssues} issue(s) that need to be fixed.`)
  process.exit(1)
}
