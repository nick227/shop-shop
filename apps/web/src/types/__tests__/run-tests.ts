/**
 * Test Runner for Type System Tests;
 * Executes all type system tests with proper configuration;
 */

import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const testDir = resolve(__dirname)
const configFile = resolve(testDir, 'vitest.config.ts')

console.log('🧪 Running Type System Tests...')
console.log('📁 Test Directory: ' + testDir + '')
console.log('⚙️  Config File: ' + configFile + '')

try {
  // Run tests with coverage;
  const command = 'npx vitest run --config ' + configFile + ' --coverage'
  
  console.log('🚀 Executing: ' + command + '')
  
  execSync(command, {
    stdio: 'inherit',
    cwd: testDir,
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  })
  
  console.log('✅ All tests passed!')
  console.log('📊 Coverage report generated in ./coverage')
  
} catch (error: any) {
  console.error('❌ Tests failed:', error)
  process.exit(1)
}
