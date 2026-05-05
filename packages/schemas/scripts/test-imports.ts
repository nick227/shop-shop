#!/usr/bin/env tsx
/**
 * Test imports for DTO generation
 */

console.log('🔄 Testing imports...')

try {
  console.log('📦 Importing parseSchemaFile...')
  const { parseSchemaFile } = await import('./prisma-schema-parser.js')
  console.log('✅ parseSchemaFile imported successfully')
  
  console.log('📦 Importing generateAllDTOs...')
  const { generateAllDTOs } = await import('../src/core/enhanced-dto.generator.js')
  console.log('✅ generateAllDTOs imported successfully')
  
  console.log('📦 Testing parseSchemaFile...')
  const result = parseSchemaFile()
  console.log(`✅ Parsed ${result.models.length} models and ${result.enums.length} enums`)
  
} catch (error) {
  console.error('❌ Import error:', error)
  process.exit(1)
}
