#!/usr/bin/env tsx
/**
 * Schema to TypeScript Converter
 * 
 * Converts Zod schemas to TypeScript interface definitions
 * This ensures our API wrapper types are derived from schemas
 */

import { z } from 'zod'

// ========================================
// Schema to TypeScript Conversion
// ========================================

interface ConversionOptions {
  interfaceName: string
  makeOptional?: boolean
  excludeFields?: string[]
  fieldMappings?: Record<string, string>
}

export function zodToTypeScript(
  schema: z.ZodSchema, 
  options: ConversionOptions
): string {
  const { interfaceName, makeOptional = false, excludeFields = [], fieldMappings = {} } = options
  
  if (!(schema instanceof z.ZodObject)) {
    throw new Error('Schema must be a ZodObject')
  }
  
  const shape = schema.shape
  const fields: string[] = []
  
  for (const [key, value] of Object.entries(shape)) {
    if (excludeFields.includes(key)) {
      continue
    }
    
    const fieldName = fieldMappings[key] || key
    const fieldType = zodTypeToTypeScript(value, makeOptional)
    const isOptional = makeOptional || (value instanceof z.ZodOptional)
    
    fields.push(`  ${fieldName}${isOptional ? '?' : ''}: ${fieldType}`)
  }
  
  return `export interface ${interfaceName} {
${fields.join('\n')}
}`
}

function zodTypeToTypeScript(zodType: z.ZodTypeAny, makeOptional: boolean = false): string {
  // Handle optional types
  if (zodType instanceof z.ZodOptional) {
    return zodTypeToTypeScript(zodType._def.innerType, makeOptional)
  }
  
  // Handle nullable types
  if (zodType instanceof z.ZodNullable) {
    const innerType = zodTypeToTypeScript(zodType._def.innerType, makeOptional)
    return `${innerType} | null`
  }
  
  // Handle union types
  if (zodType instanceof z.ZodUnion) {
    const types = zodType._def.options.map((option: z.ZodTypeAny) => 
      zodTypeToTypeScript(option, makeOptional)
    )
    return types.join(' | ')
  }
  
  // Handle enum types
  if (zodType instanceof z.ZodEnum) {
    const values = zodType._def.values.map((v: string) => `'${v}'`)
    return values.join(' | ')
  }
  
  // Handle literal types
  if (zodType instanceof z.ZodLiteral) {
    const value = zodType._def.value
    return typeof value === 'string' ? `'${value}'` : String(value)
  }
  
  // Handle array types
  if (zodType instanceof z.ZodArray) {
    const elementType = zodTypeToTypeScript(zodType._def.type, makeOptional)
    return `${elementType}[]`
  }
  
  // Handle object types
  if (zodType instanceof z.ZodObject) {
    const shape = zodType.shape
    const fields: string[] = []
    
    for (const [key, value] of Object.entries(shape)) {
      const fieldType = zodTypeToTypeScript(value, makeOptional)
      const isOptional = value instanceof z.ZodOptional
      fields.push(`${key}${isOptional ? '?' : ''}: ${fieldType}`)
    }
    
    return `{
    ${fields.join('\n    ')}
  }`
  }
  
  // Handle record types
  if (zodType instanceof z.ZodRecord) {
    const valueType = zodTypeToTypeScript(zodType._def.valueType, makeOptional)
    return `Record<string, ${valueType}>`
  }
  
  // Handle primitive types
  switch (zodType.constructor) {
    case z.ZodString:
      return 'string'
    case z.ZodNumber:
      return 'number'
    case z.ZodBoolean:
      return 'boolean'
    case z.ZodDate:
      return 'string' // ISO date string
    case z.ZodAny:
      return 'any'
    case z.ZodUnknown:
      return 'unknown'
    case z.ZodVoid:
      return 'void'
    case z.ZodNever:
      return 'never'
    default:
      return 'unknown'
  }
}

// ========================================
// API Contract Generator
// ========================================

export function generateApiContracts() {
  // Import schemas
  const {
    CreateOrderInputSchema,
    CreateAddressInputSchema,
    CreateBundleInputSchema,
    AddToCartInputSchema,
    UpdateCartInputSchema,
  } = require('../src/dtos/index.js')
  
  const contracts = [
    // Order contract - simplified for frontend
    zodToTypeScript(CreateOrderInputSchema, {
      interfaceName: 'CreateOrderContract',
      excludeFields: ['userId', 'storeId', 'status', 'paymentStatus', 'subtotal', 'fees', 'tax', 'total', 'serviceFeePercent', 'serviceFeeAmount', 'netToVendor', 'stripePaymentIntentId', 'stripeChargeId', 'stripeTransferId', 'stripeApplicationFeeId', 'stripeRefundId', 'addressSnapshot', 'cancelReason', 'canceledBy', 'canceledAt', 'refundReason', 'refundedAt'],
      fieldMappings: {
        deliveryType: 'deliveryType', // Keep as enum
      }
    }),
    
    // Address contract - field name mapping
    zodToTypeScript(CreateAddressInputSchema, {
      interfaceName: 'CreateAddressContract',
      excludeFields: ['userId', 'label', 'contactName', 'phone', 'geo', 'isDefault', 'isActive', 'externalRef', 'archivedAt'],
      fieldMappings: {
        line1: 'street',
        line2: 'apartmentNumber',
        postalCode: 'zipCode',
      }
    }),
    
    // Bundle contract - already aligned
    zodToTypeScript(CreateBundleInputSchema, {
      interfaceName: 'CreateBundleContract',
    }),
    
    // Cart contracts
    zodToTypeScript(AddToCartInputSchema, {
      interfaceName: 'AddCartItemContract',
    }),
    
    zodToTypeScript(UpdateCartInputSchema, {
      interfaceName: 'UpdateCartItemContract',
    }),
  ]
  
  return contracts.join('\n\n')
}

// ========================================
// Main Generation
// ========================================

function main() {
  console.log('🔄 Converting Zod schemas to TypeScript...')
  
  try {
    const contracts = generateApiContracts()
    console.log('✅ Generated API contracts from schemas')
    console.log(contracts)
  } catch (error) {
    console.error('❌ Error generating contracts:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
