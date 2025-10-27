import { z } from 'zod'
import type { PrismaModel, PrismaField } from '../../scripts/prisma-schema-parser.js'

// ========================================
// Enhanced DTO Generator from Parsed Prisma Schema
// Works with automatically parsed Prisma models
// ========================================

/**
 * Enhanced field type mapping from Prisma to Zod
 */
export const PrismaToZodMap: Record<string, () => z.ZodTypeAny> = {
  String: () => z.string(),
  Int: () => z.number().int(),
  Float: () => z.number(),
  Boolean: () => z.boolean(),
  DateTime: () => z.string().datetime(),
  Decimal: () => z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid decimal'),
  Json: () => z.record(z.unknown()),
  Bytes: () => z.string().base64(),
}

/**
 * Fields that should be excluded from create/update inputs
 */
export const AUTO_EXCLUDED_FIELDS = [
  'id',
  'createdAt', 
  'updatedAt',
  'passwordHash', // Security
  'tokenRef', // Security
]

/**
 * Generate CREATE input schema from parsed Prisma model
 */
export function generateCreateInputSchemaFromModel(
  model: PrismaModel,
  overrides: Record<string, z.ZodTypeAny> = {},
  exclude: string[] = []
) {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set([...AUTO_EXCLUDED_FIELDS, ...exclude])

  for (const field of model.fields) {
    // Skip excluded fields
    if (excludeSet.has(field.name)) continue
    
    // Skip relations (handled separately)
    if (field.isRelation) continue
    
    // Use override if provided
    if (overrides[field.name]) {
      shape[field.name] = overrides[field.name]
      continue
    }
    
    // Auto-generate from type
    let schema = PrismaToZodMap[field.type]?.()
    if (!schema) {
      console.warn(`Unknown Prisma type: ${field.type} for field ${field.name}`)
      schema = z.unknown()
    }
    
    // Handle optional/nullable
    if (field.isOptional || field.hasDefault) {
      schema = schema.optional()
    }
    
    shape[field.name] = schema
  }
  
  return z.object(shape)
}

/**
 * Generate UPDATE input schema from parsed Prisma model
 */
export function generateUpdateInputSchemaFromModel(
  model: PrismaModel,
  overrides: Record<string, z.ZodTypeAny> = {},
  exclude: string[] = []
) {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set([
    ...AUTO_EXCLUDED_FIELDS,
    ...exclude,
    'createdById', // Can't change creator
    'ownerUserId', // Can't transfer ownership via update
  ])

  for (const field of model.fields) {
    if (excludeSet.has(field.name)) continue
    if (field.isRelation) continue
    
    // Use override if provided
    if (overrides[field.name]) {
      shape[field.name] = overrides[field.name].optional()
      continue
    }
    
    // Auto-generate from type
    let schema = PrismaToZodMap[field.type]?.()
    if (!schema) {
      schema = z.unknown()
    }
    
    // All update fields are optional
    shape[field.name] = schema.optional()
  }
  
  return z.object(shape).refine(
    data => Object.keys(data).length > 0, 
    'At least one field must be provided'
  )
}

/**
 * Generate RESPONSE schema from parsed Prisma model
 */
export function generateResponseSchemaFromModel(
  model: PrismaModel,
  overrides: Record<string, z.ZodTypeAny> = {},
  exclude: string[] = []
) {
  const shape: Record<string, z.ZodTypeAny> = {}
  const excludeSet = new Set([
    'passwordHash', // Never expose passwords
    'tokenRef', // Never expose tokens
    ...exclude,
  ])

  for (const field of model.fields) {
    if (excludeSet.has(field.name)) continue
    if (field.isRelation) continue // Relations handled separately
    
    // Use override if provided
    if (overrides[field.name]) {
      shape[field.name] = overrides[field.name]
      continue
    }
    
    // Auto-generate from type
    let schema = PrismaToZodMap[field.type]?.()
    if (!schema) {
      schema = z.unknown()
    }
    
    // Handle nullable (not optional in responses)
    if (field.isOptional) {
      schema = schema.nullable()
    }
    
    shape[field.name] = schema
  }
  
  return z.object(shape)
}

/**
 * Generate list response schema
 */
export function generateListResponseSchema(responseSchema: z.ZodTypeAny) {
  return z.object({
    data: z.array(responseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  })
}

/**
 * Generate query schema for list operations
 */
export function generateQuerySchemaFromModel(
  model: PrismaModel,
  additionalFilters: Record<string, z.ZodTypeAny> = {}
) {
  const shape = {
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    ...additionalFilters,
  }
  
  return z.object(shape).transform(data => ({
    page: data.page,
    limit: data.limit,
    filters: Object.keys(data)
      .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
      .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
    orderBy: { createdAt: 'desc' },
  }))
}

/**
 * Generate field definitions for a schema type
 */
function generateFieldDefinitions(
  model: PrismaModel,
  customOverrides: Record<string, z.ZodTypeAny>,
  customExcludes: string[],
  schemaType: 'create' | 'update' | 'response'
): string {
  const excludeSet = new Set([
    ...AUTO_EXCLUDED_FIELDS,
    ...customExcludes,
    ...(schemaType === 'update' ? ['createdById', 'ownerUserId'] : []),
    ...(schemaType === 'response' ? ['passwordHash', 'tokenRef'] : [])
  ])

  const fields: string[] = []

  for (const field of model.fields) {
    // Skip excluded fields
    if (excludeSet.has(field.name)) continue
    
    // Skip relations for create/update, include for response
    if (field.isRelation && schemaType !== 'response') continue
    
    // Use custom override if provided
    if (customOverrides[field.name]) {
      const override = customOverrides[field.name]
      const fieldCode = generateZodFieldCode(field.name, override, schemaType)
      fields.push(`  ${fieldCode}`)
      continue
    }
    
    // Generate field based on type
    const fieldCode = generateFieldCode(field, schemaType)
    if (fieldCode) {
      fields.push(`  ${fieldCode}`)
    }
  }

  return fields.join(',\n')
}

/**
 * Generate Zod field code for a specific field
 */
function generateFieldCode(field: PrismaField, schemaType: 'create' | 'update' | 'response'): string {
  const { name, type, isOptional, hasDefault } = field
  
  // Map Prisma types to Zod types
  let zodType = 'z.string()'
  switch (type) {
    case 'String': zodType = 'z.string()'; break
    case 'Int': zodType = 'z.number().int()'; break
    case 'Float': zodType = 'z.number()'; break
    case 'Boolean': zodType = 'z.boolean()'; break
    case 'DateTime': zodType = 'z.string().datetime()'; break
    case 'Decimal': zodType = 'z.string().regex(/^\\d+(\\.\\d{1,2})?$/, \'Must be a valid decimal\')'; break
    case 'Json': zodType = 'z.record(z.unknown())'; break
    case 'Bytes': zodType = 'z.string().base64()'; break
    default: zodType = 'z.string()'; // Default fallback
  }
  
  // Handle optional/nullable
  if (schemaType === 'update') {
    zodType += '.optional()'
  } else if (isOptional || hasDefault) {
    if (schemaType === 'response') {
      zodType += '.nullable()'
    } else {
      zodType += '.optional()'
    }
  }
  
  return `${name}: ${zodType}`
}

/**
 * Generate Zod field code for custom overrides
 */
function generateZodFieldCode(name: string, override: z.ZodTypeAny, schemaType: 'create' | 'update' | 'response'): string {
  // For now, just return a placeholder - this would need more sophisticated handling
  return `${name}: z.string()`
}

/**
 * Generate complete DTO file content from Prisma model
 */
export function generateDTOFileContent(
  model: PrismaModel,
  customOverrides: Record<string, z.ZodTypeAny> = {},
  customExcludes: string[] = [],
  additionalSchemas: Record<string, z.ZodTypeAny> = {}
) {
  const modelName = model.name
  const modelNameLower = modelName.toLowerCase()
  
  // Generate field definitions for the schema
  const createFields = generateFieldDefinitions(model, customOverrides, customExcludes, 'create')
  const updateFields = generateFieldDefinitions(model, customOverrides, customExcludes, 'update')
  const responseFields = generateFieldDefinitions(model, customOverrides, customExcludes, 'response')
  
  // Generate file content
  const content = `import { z } from 'zod'

// ========================================
// ${modelName} DTOs (Auto-Generated from Prisma)
// ========================================

export const Create${modelName}InputSchema = z.object({
${createFields}
})

export const Update${modelName}InputSchema = z.object({
${updateFields}
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')

export const ${modelName}ResponseSchema = z.object({
${responseFields}
})

export const ${modelName}ListResponseSchema = z.object({
  data: z.array(${modelName}ResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export const ${modelName}QuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).transform(data => ({
  page: data.page,
  limit: data.limit,
  filters: Object.keys(data)
    .filter(k => k !== 'page' && k !== 'limit' && (data as any)[k] !== undefined)
    .reduce((acc, k) => ({ ...acc, [k]: (data as any)[k] }), {}),
  orderBy: { createdAt: 'desc' },
}))

${Object.keys(additionalSchemas).length > 0 ? `
// Additional schemas
${Object.entries(additionalSchemas).map(([name, schema]) => {
  // Convert Zod schema to string representation
  if (name === 'UpdateOrderStatusSchema') {
    return `export const ${name} = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'])
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')`
  }
  if (name === 'AddToCartInputSchema') {
    return `export const ${name} = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1),
  options: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
})`
  }
  if (name === 'UpdateMediaSortInputSchema') {
    return `export const ${name} = z.object({
  sortIndex: z.number().int().min(0),
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')`
  }
  // Handle aliases
  if (typeof schema === 'string') {
    return `export const ${name} = ${schema}`
  }
  return `export const ${name} = ${schema.toString()}`
}).join('\n')}
` : ''}

// Type exports
export type Create${modelName}Input = z.infer<typeof Create${modelName}InputSchema>
export type Update${modelName}Input = z.infer<typeof Update${modelName}InputSchema>
export type ${modelName}Response = z.infer<typeof ${modelName}ResponseSchema>
export type ${modelName}ListResponse = z.infer<typeof ${modelName}ListResponseSchema>
export type ${modelName}Query = z.infer<typeof ${modelName}QuerySchema>
${Object.keys(additionalSchemas).length > 0 ? 
  Object.keys(additionalSchemas).map(name => 
    `export type ${name.replace('Schema', '')} = z.infer<typeof ${name}>`
  ).join('\n') : ''}
`

  return content
}

/**
 * Generate DTOs for all models with custom configurations
 */
export function generateAllDTOs(
  models: PrismaModel[],
  customConfigs: Record<string, {
    overrides?: Record<string, z.ZodTypeAny>
    excludes?: string[]
    additionalSchemas?: Record<string, z.ZodTypeAny | string>
  }> = {}
) {
  const results: Array<{ modelName: string; content: string }> = []
  
  for (const model of models) {
    const config = customConfigs[model.name] || {}
    const content = generateDTOFileContent(
      model,
      config.overrides || {},
      config.excludes || [],
      config.additionalSchemas || {}
    )
    
    results.push({
      modelName: model.name,
      content
    })
  }
  
  return results
}
