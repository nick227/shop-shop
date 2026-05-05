#!/usr/bin/env tsx
/**
 * Test script to verify Prisma schema parser
 */

import { parseSchemaFile } from './prisma-schema-parser.js'

console.log('🔄 Testing Prisma schema parser...')

try {
  const result = parseSchemaFile()
  console.log('✅ Schema parsed successfully')
  console.log('Models found:', result.models.length)
  console.log('Enums found:', result.enums.length)
  
  if (result.models.length > 0) {
    console.log('First model:', result.models[0].name)
    console.log('Fields:', result.models[0].fields.length)
  }
  
  if (result.enums.length > 0) {
    console.log('First enum:', result.enums[0].name)
    console.log('Values:', result.enums[0].values)
  }
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}
