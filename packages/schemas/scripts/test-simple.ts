#!/usr/bin/env tsx
/**
 * Simple Test Script
 */

console.log('🧪 Testing smoke test script...')

// Test basic functionality
const fs = require('fs')
const path = require('path')

console.log('✅ Basic imports working')

// Test file system access
const currentDir = __dirname
console.log(`📁 Current directory: ${currentDir}`)

// Test if we can read files
const packageJsonPath = path.join(currentDir, '../package.json')
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ Package.json found')
} else {
  console.log('❌ Package.json not found')
}

console.log('🎉 Simple test completed!')
