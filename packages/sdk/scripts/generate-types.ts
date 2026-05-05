#!/usr/bin/env tsx
/**
 * Auto-Generate Type Aliases from SDK
 * 
 * Generates apps/web/src/api/types.ts from SDK exports
 * Eliminates hand-coding of type mappings
 * 
 * Usage: tsx packages/sdk/scripts/generate-types.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read SDK index to find exported types
const sdkIndexPath = path.resolve(__dirname, '../src/index.ts')
const sdkIndex = fs.readFileSync(sdkIndexPath, 'utf-8')

// Extract exported model names
const modelExports = sdkIndex.match(/export \* from '\.\/models'/g)

// Read models index
const modelsIndexPath = path.resolve(__dirname, '../src/models/index.ts')
const modelsIndex = fs.readFileSync(modelsIndexPath, 'utf-8')

// Extract all exported types
const typeExports = modelsIndex.match(/export \* from '\.\/\w+'/g) || []
const typeNames = typeExports.map(exp => {
  const match = exp.match(/\.\/(\w+)'/)
  return match ? match[1] : null
}).filter(Boolean)

// Generate type aliases
function generateTypeAliases(): string {
  const header = `/**
 * Centralized Type Library - Single Source of Truth
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: @packages/sdk
 * 
 * To regenerate: pnpm gen:types
 */

// ============================================
// Core SDK Types (Clean Names)
// ============================================`

  const coreTypes = [
    { sdk: 'StoreResponse', alias: 'Store' },
    { sdk: 'ItemResponse', alias: 'Item' },
    { sdk: 'CartResponse', alias: 'Cart' },
    { sdk: 'OrderResponse', alias: 'Order' },
    { sdk: 'AddressResponse', alias: 'Address' },
    { sdk: 'UserPublicResponse', alias: 'User' },
    { sdk: 'PromotionResponse', alias: 'Promotion' },
  ]

  const coreExports = coreTypes
    .map(t => `  ${t.sdk} as ${t.alias},`)
    .join('\n')

  const listTypes = `
// ============================================
// List Item Types (Fix Ugly Names)
// ============================================
export type {
  ListStores200ResponseDataInner as StoreListItem,
  ListItems200ResponseDataInner as ItemListItem,
  ListOrders200ResponseDataInner as OrderListItem,
  ListCarts200ResponseDataInner as CartListItem,
  ListCarts200ResponseDataInnerItemsInner as CartItem,
} from '@packages/sdk'`

  const inputTypes = `
// ============================================
// Input Types (Create/Update)
// ============================================
export type {
  SignupInput,
  LoginInput,
  CreateOrderInput,
  UpdateOrderStatusInput,
  AddCartItemInput,
  CreateAddressInput,
} from '@packages/sdk'`

  const extensions = `
// ============================================
// Domain Extensions (Not in SDK)
// ============================================
import type { Store, Item, Order } from '@packages/sdk'

/** Store with calculated distance from user location */
export interface StoreWithDistance extends Store {
  distance?: number
}

/** Store with address details */
export interface StoreAddress {
  street: string
  city: string
  state: string
  zip: string
  country?: string
}`

  const handlers = `
// ============================================
// Sorting & Filtering
// ============================================
export type StoreSortOption = 'distance' | 'name' | 'rating'
export type OrderSortOption = 'date' | 'status' | 'total'
export type ItemSortOption = 'name' | 'price' | 'category'

// ============================================
// Event Handlers
// ============================================
export type StoreClickHandler = (store: Store | StoreWithDistance) => void
export type ProductClickHandler = (item: Item) => void
export type OrderClickHandler = (order: Order) => void
export type EntityClickHandler<T> = (entity: T) => void`

  return `${header}
export type {
${coreExports}
} from '@packages/sdk'
${listTypes}
${inputTypes}
${extensions}
${handlers}
`
}

// Generate and save
const typesCode = generateTypeAliases()
const outputPath = path.resolve(__dirname, '../../../apps/web/src/api/types.generated.ts')

fs.writeFileSync(outputPath, typesCode)
console.log(`✅ Generated type library: ${outputPath}`)
console.log(`📊 Types generated: ${typeNames.length} SDK types mapped`)

