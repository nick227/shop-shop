#!/usr/bin/env tsx

/**
 * Generate All DTOs from Prisma Schema
 * This script automatically generates 100% of DTOs from Prisma models
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { parsePrismaSchema, getPrismaSchemaPath, type PrismaModel, type PrismaField } from './prisma-schema-parser'

// Prisma to Zod type mapping
const PRISMA_TO_ZOD_MAP = {
  String: () => z.string(),
  Int: () => z.number().int(),
  Float: () => z.number(),
  Boolean: () => z.boolean(),
  DateTime: () => z.string().datetime(),
  Decimal: () => z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  Json: () => z.record(z.unknown()),
  Bytes: () => z.string().base64(),
  BigInt: () => z.string().regex(/^\d+$/, 'Must be a valid bigint string'),
} as const

// Fields to exclude from create/update inputs
const EXCLUDED_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'passwordHash',
  'tokenRef',
  'createdById',
  'ownerUserId',
  'updatedById',
] as const

interface PrismaField {
  name: string
  type: string
  isOptional: boolean
  isArray: boolean
  isUnique: boolean
  isId: boolean
  hasDefault: boolean
  relationName?: string
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToMany'
  enumValues?: string[]
}

interface PrismaModel {
  name: string
  fields: PrismaField[]
  primaryKey: string
  uniqueFields: string[]
}

// Schema parsing is now handled by the imported parser

/**
 * Generate Zod schema for a field
 */
function generateFieldSchema(field: PrismaField): z.ZodTypeAny {
  let schema: z.ZodTypeAny
  
  // Handle enums
  if (field.type === 'Enum' && field.enumValues) {
    schema = z.enum(field.enumValues as [string, ...string[]])
  } else {
    schema = PRISMA_TO_ZOD_MAP[field.type as keyof typeof PRISMA_TO_ZOD_MAP]?.()
    
    if (!schema) {
      console.warn(`Unknown Prisma type: ${field.type} for field ${field.name}`)
      schema = z.unknown()
    }
  }
  
  // Handle arrays
  if (field.isArray) {
    schema = z.array(schema)
  }
  
  // Handle optional fields
  if (field.isOptional || field.hasDefault) {
    schema = schema.optional()
  }
  
  return schema
}

/**
 * Generate create input schema
 */
function generateCreateInputSchema(model: PrismaModel): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set(EXCLUDED_FIELDS)
  
  for (const field of model.fields) {
    if (excludeSet.has(field.name)) continue
    if (field.name.includes('Id') && field.name !== 'id') continue // Skip relation IDs
    
    shape[field.name] = generateFieldSchema(field)
  }
  
  return z.object(shape)
}

/**
 * Generate update input schema
 */
function generateUpdateInputSchema(model: PrismaModel): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set([...EXCLUDED_FIELDS, 'createdById', 'ownerUserId'])
  
  for (const field of model.fields) {
    if (excludeSet.has(field.name)) continue
    if (field.name.includes('Id') && field.name !== 'id') continue
    
    const fieldSchema = generateFieldSchema(field)
    shape[field.name] = fieldSchema.optional()
  }
  
  return z.object(shape).refine(
    data => Object.keys(data).length > 0,
    'At least one field must be provided'
  )
}

/**
 * Generate response schema
 */
function generateResponseSchema(model: PrismaModel): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set(['passwordHash', 'tokenRef'])
  
  for (const field of model.fields) {
    if (excludeSet.has(field.name)) continue
    
    let fieldSchema = generateFieldSchema(field)
    
    // Handle nullable fields in responses
    if (field.isOptional && !field.hasDefault) {
      fieldSchema = fieldSchema.nullable()
    }
    
    shape[field.name] = fieldSchema
  }
  
  return z.object(shape)
}

/**
 * Generate list response schema
 */
function generateListResponseSchema(responseSchema: z.ZodTypeAny): z.ZodObject<any> {
  return z.object({
    data: z.array(responseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  })
}

/**
 * Generate query schema
 */
function generateQuerySchema(model: PrismaModel): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
  }
  
  // Add model-specific filters
  for (const field of model.fields) {
    if (field.name.includes('Id') || field.isArray) continue
    
    if (field.type === 'String') {
      shape[`${field.name}_contains`] = z.string().optional()
    } else if (field.type === 'Int' || field.type === 'Float') {
      shape[`${field.name}_gte`] = z.number().optional()
      shape[`${field.name}_lte`] = z.number().optional()
    } else if (field.type === 'Boolean') {
      shape[field.name] = z.boolean().optional()
    }
  }
  
  return z.object(shape).transform(data => ({
    page: data.page,
    limit: data.limit,
    filters: Object.keys(data)
      .filter(k => k !== 'page' && k !== 'limit' && data[k] !== undefined)
      .reduce((acc, k) => ({ ...acc, [k]: data[k] }), {}),
    orderBy: { createdAt: 'desc' as const },
  }))
}

/**
 * Generate DTO file content
 */
function generateDTOFileContent(modelName: string, dtoName: string, schema: z.ZodTypeAny): string {
  const typeName = dtoName.replace('Schema', '')
  
  return `/**
 * ${dtoName} - Auto-Generated from Prisma Model: ${modelName}
 * Generated on: ${new Date().toISOString()}
 * 
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * To regenerate: pnpm gen:dtos
 */

import { z } from 'zod'

export const ${dtoName} = ${schema.toString()}

export type ${typeName} = z.infer<typeof ${dtoName}>
`
}

/**
 * Main generation function
 */
async function generateAllDTOs() {
  console.log('🚀 Generating all DTOs from Prisma schema...')
  
  const schemaPath = getPrismaSchemaPath()
  const { models } = parsePrismaSchema(schemaPath)
  
  console.log(`📋 Found ${models.length} models:`, models.map(m => m.name))
  
  const outputDir = join(process.cwd(), 'src/dtos/generated')
  mkdirSync(outputDir, { recursive: true })
  
  for (const model of models) {
    const modelName = model.name.toLowerCase()
    
    // Generate all DTOs for this model
    const createInput = generateCreateInputSchema(model)
    const updateInput = generateUpdateInputSchema(model)
    const response = generateResponseSchema(model)
    const listResponse = generateListResponseSchema(response)
    const query = generateQuerySchema(model)
    
    // Write individual DTO files
    const files = [
      { name: `${modelName}.create.input`, schema: createInput },
      { name: `${modelName}.update.input`, schema: updateInput },
      { name: `${modelName}.response`, schema: response },
      { name: `${modelName}.list.response`, schema: listResponse },
      { name: `${modelName}.query`, schema: query },
    ]
    
    for (const file of files) {
      const fileName = `${file.name}.dto.ts`
      const filePath = join(outputDir, fileName)
      const content = generateDTOFileContent(model.name, file.name.replace('.', ''), file.schema)
      
      writeFileSync(filePath, content)
      console.log(`✅ Generated: ${fileName}`)
    }
  }
  
  // Generate index file
  const indexContent = models.map(model => {
    const modelName = model.name.toLowerCase()
    return `export * from './generated/${modelName}.create.input.dto.js'
export * from './generated/${modelName}.update.input.dto.js'
export * from './generated/${modelName}.response.dto.js'
export * from './generated/${modelName}.list.response.dto.js'
export * from './generated/${modelName}.query.dto.js'`
  }).join('\n')
  
  writeFileSync(join(outputDir, '../generated.index.ts'), indexContent)
  console.log('✅ Generated: generated.index.ts')
  
  console.log('🎉 All DTOs generated successfully!')
}

// Run the generation
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllDTOs().catch(console.error)
}

export { generateAllDTOs }
