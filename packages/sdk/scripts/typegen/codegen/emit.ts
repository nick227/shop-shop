/**
 * Code generation and emission
 * 
 * Converts IR to TypeScript code using AST or templates.
 */

import { TypegenIR, GenerationContext } from '../core/ir.js'
import { toResponseTypeName, toMapperFunctionName } from '../core/inflection.js'
import { logger } from '../io/logger.js'

/**
 * Generate TypeScript code from IR
 */
export async function generateCode(ir: TypegenIR, context: GenerationContext): Promise<string> {
  logger.info('Generating TypeScript code...')
  
  const parts: string[] = []
  
  // Header
  parts.push(generateHeader())
  
  // Imports
  parts.push(generateImports(ir))
  
  // Generate all components in parallel
  const [typeDefs, supportingTypes, utilityFunctions, mapperFunctions] = await Promise.all([
    Promise.resolve(generateTypeDefinitions(ir)),
    Promise.resolve(generateSupportingTypes()),
    Promise.resolve(generateUtilityFunctions()),
    Promise.resolve(generateMapperFunctions(ir))
  ])
  
  parts.push(typeDefs)
  parts.push(supportingTypes)
  parts.push(utilityFunctions)
  parts.push(mapperFunctions)
  
  return parts.join('\n\n')
}

/**
 * Generate file header
 */
function generateHeader(): string {
  return `/**
 * Type Mappers - SDK to Application Types
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Resource configurations (100% schema-driven)
 * 
 * To regenerate: pnpm gen:types
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/no-null */`
}

/**
 * Generate import statements
 */
function generateImports(ir: TypegenIR): string {
  const sdkTypes = ir.resources.map(r => r.sdkType)
  const uniqueTypes = [...new Set(sdkTypes)].sort()
  
  return `import type {
  ${uniqueTypes.join(',\n  ')}
} from './types/centralized'

// ========================================
// Base Type Exports (From SDK)
// ========================================`
}

/**
 * Generate type definitions
 */
function generateTypeDefinitions(ir: TypegenIR): string {
  const typeDefs = ir.resources.map(resource => {
    const responseTypeName = toResponseTypeName(resource.type)
    
    let typeDef = `export type ${responseTypeName} = ${resource.sdkType} & {\n`
    typeDef += `  id: string\n`
    typeDef += `  createdAt: string\n`
    typeDef += `  updatedAt: string\n`
    
    // Add extensions
    for (const field of resource.extensions) {
      const optional = field.optional ? '?' : ''
      typeDef += `  ${field.name}${optional}: ${field.tsType}\n`
    }
    
    typeDef += `}`
    
    // Add computed fields if any
    if (resource.computed.length > 0) {
      typeDef += ` & {\n`
      for (const field of resource.computed) {
        const optional = field.optional ? '?' : ''
        typeDef += `  ${field.name}${optional}: ${field.tsType}\n`
      }
      typeDef += `}`
    }
    
    return typeDef
  })
  
  return typeDefs.join('\n\n')
}

/**
 * Generate supporting types
 */
function generateSupportingTypes(): string {
  return `// ========================================
// Supporting Types
// ========================================

export interface OrderItem {
  id: string
  orderId: string
  itemId: string
  quantity: number
  unitPrice: number
  titleSnapshot: string
  optionsSnapshot?: Record<string, unknown>
}

export interface AddressSnapshot {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface MediaItem {
  type: 'youtube' | 'image' | 'video' | 'link'
  url: string
  thumbnail?: string
  title?: string
  provider?: string
  width?: number
  height?: number
}

export interface BundleItem {
  id: string
  bundleId: string
  itemId: string
  quantity: number
  sortIndex: number
  price?: number
  title?: string
  item?: {
    id: string
    title: string
    price: number
    imageUrl?: string
  }
}

export interface BundlePricing {
  id: string
  bundleId: string
  pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
  fixedPrice?: number
  discountPercent?: number
  discountAmount?: number
  minSavings?: number
  showSavings: boolean
  savingsLabel?: string
}

export interface Bundle {
  id: string
  createdAt: string
  updatedAt: string
  storeId: string
  store?: StoreResponse
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  // Bundle-specific properties
  items?: BundleItem[]
  pricing?: BundlePricing
  // Computed fields
  totalItems: number
  individualPrice: number
  bundlePrice: number
  savings: number
  savingsPercent: number
}

export interface CartItemData {
  id: string
  cartId: string
  itemId: string
  item: ItemResponse
  currentItem?: ItemResponse
  quantity: number
  unitPrice: number
  titleSnapshot: string
  options?: Record<string, unknown>
  notes?: string | null
}

export type CartWithTotals = CartResponse & {
  items: CartItemData[]
  itemCount: number
  subtotal: number
  tax: number
  deliveryFee: number
  fees: number
  total: number
}

// ========================================
// Input Types (Re-exported for convenience)
// ========================================

export interface CreateOrderInput {
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
}

export interface CreateAddressInput {
  label?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  lat?: number
  lng?: number
  isDefault?: boolean
}

export interface CreatePostInput {
  storeId: string
  content?: string
  mediaUrls: MediaItem[]
}

export interface SignupInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface LoginInput {
  email: string
  password: string
}

// ========================================
// Utility Types for UI Components
// ========================================

export type StoreClickHandler = (store: StoreWithDistance) => void
export type ProductClickHandler = (item: ItemResponse) => void

export interface StoreWithDistance extends StoreResponse {
  distance?: number
}

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELED'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED'
export type DeliveryType = 'PICKUP' | 'DELIVERY'

// ========================================
// User Types
// ========================================

export interface MediaResponse {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number
  createdAt: string
  updatedAt: string
}

export type BundlePricingType = 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'`
}

/**
 * Generate utility functions
 */
function generateUtilityFunctions(): string {
  return `// ========================================
// Utility Functions
// ========================================



/**
 * Safely extract id field with fallback
 * Handles common id field variations: id, _id, uuid
 */
function extractId(data: unknown, fallback = ''): string {
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Try common id field names
    const idFields = ['id', '_id', 'uuid', 'ID', 'Id']
    for (const field of idFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        return obj[field] as string
      }
    }
  }
  return fallback
}

/**
 * Safely extract timestamp fields with fallback
 * Handles common timestamp field variations: createdAt/created_at, updatedAt/updated_at
 */
function extractTimestamps(data: unknown): { createdAt: string; updatedAt: string } {
  const now = new Date().toISOString()
  
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>
    
    // Try common timestamp field names
    const createdFields = ['createdAt', 'created_at', 'created', 'CreatedAt']
    const updatedFields = ['updatedAt', 'updated_at', 'updated', 'UpdatedAt']
    
    let createdAt = now
    let updatedAt = now
    
    for (const field of createdFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        createdAt = obj[field] as string
        break
      }
    }
    
    for (const field of updatedFields) {
      if (field in obj && typeof obj[field] === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        updatedAt = obj[field] as string
        break
      }
    }
    
    return { createdAt, updatedAt }
  }
  
  return {
    createdAt: now,
    updatedAt: now
  }
}`
}

/**
 * Generate mapper functions
 */
function generateMapperFunctions(ir: TypegenIR): string {
  const mappers = ir.resources.map(resource => {
    const responseTypeName = toResponseTypeName(resource.type)
    const functionName = toMapperFunctionName(resource.type)
    
    let mapper = `export function ${functionName}(sdk: ${resource.sdkType}): ${responseTypeName} {\n`
    mapper += `  const timestamps = extractTimestamps(sdk)\n`
    mapper += `  const id = extractId(sdk, '${resource.name.toLowerCase()}-' + Date.now())\n\n`
    
    mapper += `  return {\n`
    mapper += `    ...sdk,\n`
    mapper += `    id,\n`
    mapper += `    createdAt: timestamps.createdAt,\n`
    mapper += `    updatedAt: timestamps.updatedAt,\n`
    
    // Add extension mappings with sensible defaults
    for (const field of resource.extensions) {
      if (field.defaultExpr) {
        mapper += `    ${field.name}: sdk.${field.name} ?? ${field.defaultExpr},\n`
      } else if (field.tsType.includes('string')) {
        mapper += `    ${field.name}: sdk.${field.name} ?? '',\n`
      } else if (field.tsType.includes('number')) {
        mapper += `    ${field.name}: sdk.${field.name} ?? 0,\n`
      } else if (field.tsType.includes('boolean')) {
        mapper += `    ${field.name}: sdk.${field.name} ?? false,\n`
      } else if (field.tsType.includes('null')) {
        mapper += `    ${field.name}: sdk.${field.name} ?? null,\n`
      } else {
        mapper += `    ${field.name}: sdk.${field.name},\n`
      }
    }
    
    // Add computed fields
    for (const field of resource.computed) {
      mapper += `    ${field.name}: ${field.computeExpr},\n`
    }
    
    mapper += `  }\n`
    mapper += `}\n`
    
    return mapper
  })
  
  return `// ========================================
// Type Mappers (SDK → App Types)
// ========================================

${mappers.join('\n\n')}`
}
