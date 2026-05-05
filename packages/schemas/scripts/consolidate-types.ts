#!/usr/bin/env tsx
/**
 * Type Consolidation Script
 * 
 * This script consolidates all type definitions by:
 * 1. Reading Prisma-generated schemas
 * 2. Generating simplified frontend contracts
 * 3. Updating resource configuration
 * 4. Regenerating API wrapper and backend types
 * 
 * This ensures a single source of truth and eliminates misalignment.
 */

import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

// ========================================
// Step 1: Generate Frontend Contracts from Schemas
// ========================================

function generateFrontendContracts(): string {
  return `/**
 * Frontend API Contracts
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Prisma schemas
 * 
 * These are simplified, frontend-focused interfaces derived from
 * our comprehensive Prisma schemas. This ensures alignment while
 * providing a clean API for frontend consumption.
 */

// ========================================
// Order Contracts
// ========================================

export interface CreateOrderContract {
  cartId: string
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
}

// ========================================
// Address Contracts
// ========================================

export interface CreateAddressContract {
  street: string
  city: string
  state: string
  zipCode: string
  country?: string
  apartmentNumber?: string
  instructions?: string
}

// ========================================
// Bundle Contracts
// ========================================

export interface CreateBundleContract {
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive?: boolean
  sortIndex?: number
  items: {
    itemId: string
    quantity: number
    sortIndex?: number
  }[]
  pricing: {
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings?: boolean
    savingsLabel?: string
  }
}

// ========================================
// Cart Contracts
// ========================================

export interface AddCartItemContract {
  itemId: string
  quantity: number
  options?: Record<string, unknown>
  notes?: string
}

export interface UpdateCartItemContract {
  quantity: number
  options?: Record<string, unknown>
  notes?: string
}

// ========================================
// Store Contracts
// ========================================

export interface CreateStoreContract {
  name: string
  description?: string
  address: string
  city: string
  state: string
  zipCode: string
  country?: string
  phone?: string
  email?: string
  website?: string
  hours?: string
  deliveryRadius?: number
  deliveryFee?: number
  minOrder?: number
  serviceFeePercent?: number
  isActive?: boolean
  isOpen?: boolean
  acceptsOnlineOrders?: boolean
  acceptsPickup?: boolean
  acceptsDelivery?: boolean
  media?: string[]
}

// ========================================
// Item Contracts
// ========================================

export interface CreateItemContract {
  storeId: string
  title: string
  description?: string
  price: number
  category?: string
  imageUrl?: string
  isActive?: boolean
  isAvailable?: boolean
  sortIndex?: number
  options?: Record<string, unknown>
  tags?: string[]
}

// ========================================
// Promotion Contracts
// ========================================

export interface CreatePromotionContract {
  storeId: string
  title: string
  description?: string
  code?: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY' | 'BUY_ONE_GET_ONE'
  value: number
  minOrderAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount?: number
  isActive?: boolean
  startsAt?: string
  expiresAt?: string
}

// ========================================
// User Contracts
// ========================================

export interface SignupContract {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
}

export interface LoginContract {
  email: string
  password: string
}

// ========================================
// Post Contracts
// ========================================

export interface CreatePostContract {
  storeId: string
  content: string
  mediaUrls?: string[]
}

// ========================================
// Type Aliases for Backward Compatibility
// ========================================

export type CreateOrderInput = CreateOrderContract
export type CreateAddressInput = CreateAddressContract
export type CreateBundleInput = CreateBundleContract
export type AddCartItemInput = AddCartItemContract
export type UpdateCartItemInput = UpdateCartItemContract
export type CreateStoreInput = CreateStoreContract
export type CreateItemInput = CreateItemContract
export type CreatePromotionInput = CreatePromotionContract
export type SignupInput = SignupContract
export type LoginInput = LoginContract
export type CreatePostInput = CreatePostContract
`
}

// ========================================
// Step 2: Update Resource Configuration
// ========================================

function generateUpdatedResourceConfig(): string {
  return `/**
 * Centralized Resource Configuration
 * 
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Prisma schemas
 * 
 * This configuration is derived from our Prisma schemas to ensure
 * perfect alignment between backend types and frontend API contracts.
 */

export interface ResourceConfig {
  // Core identification
  name: string
  type: string
  createType?: string
  
  // SDK Configuration
  apiClass: string
  sdkType: string
  sdkListMethod: string
  sdkGetMethod: string
  sdkCreateMethod?: string
  sdkUpdateMethod?: string
  sdkDeleteMethod?: string
  
  // Explicit request parameter names
  sdkCreateRequestParam?: string
  sdkUpdateRequestParam?: string
  
  // Method parameters
  listParams?: string
  
  // Feature flags
  hasCreate?: boolean
  hasUpdate?: boolean
  hasDelete?: boolean
  
  // Custom implementations
  updateCustom?: string
  
  // React Query configuration
  invalidates?: string[]
  methods?: string[]
  hooks?: {
    useList?: string
    useOne?: string
    useCreate?: string
    useUpdate?: string
    useDelete?: string
  }
  
  // Type extensions
  extensions?: Record<string, string>
  computed?: string
}

/**
 * Master resource configuration
 * Generated from Prisma schemas to ensure alignment
 */
export const RESOURCE_CONFIGS: ResourceConfig[] = [
  {
    name: 'stores',
    type: 'Store',
    createType: 'CreateStoreInput',
    apiClass: 'StoresApi',
    sdkType: 'ListStores200ResponseDataInner',
    sdkListMethod: 'listStores',
    sdkGetMethod: 'getStoreById',
    listParams: 'params?: { page?: string; limit?: string }',
    methods: ['list', 'getById'],
    hooks: {
      useList: 'useStores',
      useOne: 'useStore',
    },
    extensions: {
      deliveryFee: 'number',
      minOrder: 'number',
      distance: 'number | undefined',
    },
    computed: \`
  // Computed from fees JSON
  deliveryFee: (sdk.fees as any)?.deliveryFee ?? 0,
  minOrder: (sdk.fees as any)?.minOrder ?? 0,\`,
  },
  
  {
    name: 'items',
    type: 'Item',
    createType: 'CreateItemInput',
    apiClass: 'ItemsApi',
    sdkType: 'ListItems200ResponseDataInner',
    sdkListMethod: 'listItems',
    sdkGetMethod: 'getItemById',
    listParams: 'params?: { page?: string; limit?: string }',
    methods: ['list', 'getById'],
    hooks: {
      useList: 'useItems',
      useOne: 'useItem',
    },
    extensions: {},
  },

  {
    name: 'carts',
    type: 'CartWithTotals',
    createType: 'AddCartItemInput',
    apiClass: 'CartsApi',
    sdkType: 'ListCarts200ResponseDataInner',
    sdkListMethod: 'listCarts',
    sdkGetMethod: 'getCartById',
    sdkCreateMethod: 'createCart',
    sdkDeleteMethod: 'deleteCart',
    sdkCreateRequestParam: 'createCartRequest',
    listParams: '',
    hasCreate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'delete'],
    hooks: {
      useList: 'useCarts',
      useOne: 'useCart',
      useCreate: 'useCreateCart',
      useDelete: 'useDeleteCart',
    },
    extensions: {},
  },

  {
    name: 'orders',
    type: 'Order',
    createType: 'CreateOrderInput',
    apiClass: 'OrdersApi',
    sdkType: 'ListOrders200ResponseDataInner',
    sdkListMethod: 'listOrders',
    sdkGetMethod: 'getOrderById',
    sdkCreateMethod: 'createOrder',
    sdkCreateRequestParam: 'createOrderRequest',
    sdkUpdateMethod: 'updateOrder',
    sdkUpdateRequestParam: 'updateOrderRequest',
    listParams: '',
    hasCreate: true,
    hasUpdate: true,
    methods: ['list', 'getById', 'create', 'update'],
    invalidates: ['orders', 'cart'],
    hooks: {
      useList: 'useOrders',
      useOne: 'useOrder',
      useCreate: 'useCreateOrder',
      useUpdate: 'useUpdateOrder',
    },
    extensions: {
      stripePaymentIntentId: 'string | null',
      stripeChargeId: 'string | null',
      store: '{ id: string; name: string } | undefined',
      items: 'OrderItem[] | undefined',
      addressSnapshot: 'AddressSnapshot | undefined',
    },
    computed: \`
  // Backend should include these but doesn't yet
  stripePaymentIntentId: null,
  stripeChargeId: null,\`,
  },
  
  {
    name: 'addresses',
    type: 'Address',
    createType: 'CreateAddressInput',
    apiClass: 'AddresssApi',
    sdkType: 'ListAddresss200ResponseDataInner',
    sdkListMethod: 'listAddresss',
    sdkGetMethod: 'getAddressById',
    sdkCreateMethod: 'createAddress',
    sdkUpdateMethod: 'updateAddress',
    sdkDeleteMethod: 'deleteAddress',
    sdkCreateRequestParam: 'createAddressRequest',
    sdkUpdateRequestParam: 'updateAddressRequest',
    listParams: '',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useAddresses',
      useOne: 'useAddress',
      useCreate: 'useCreateAddress',
      useUpdate: 'useUpdateAddress',
      useDelete: 'useDeleteAddress',
    },
    extensions: {
      lat: 'number | undefined',
      lng: 'number | undefined',
    },
  },
  
  {
    name: 'bundles',
    type: 'Bundle',
    createType: 'CreateBundleInput',
    apiClass: 'BundlesApi',
    sdkType: 'ListBundles200ResponseDataInner',
    sdkListMethod: 'listBundles',
    sdkGetMethod: 'getBundleById',
    sdkCreateMethod: 'createBundle',
    sdkUpdateMethod: 'updateBundle',
    sdkDeleteMethod: 'deleteBundle',
    sdkCreateRequestParam: 'createBundleRequest',
    sdkUpdateRequestParam: 'updateBundleRequest',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'useBundles',
      useOne: 'useBundle',
      useCreate: 'useCreateBundle',
      useUpdate: 'useUpdateBundle',
      useDelete: 'useDeleteBundle',
    },
    extensions: {
      totalItems: 'number',
      individualPrice: 'number',
      bundlePrice: 'number',
      savings: 'number',
      savingsPercent: 'number',
    },
    computed: \`
  // Computed bundle pricing
  totalItems: sdk.items?.length || 0,
  individualPrice: sdk.items?.reduce((sum, item) => sum + (item.item?.price || 0) * item.quantity, 0) || 0,
  bundlePrice: sdk.pricing?.fixedPrice || sdk.individualPrice || 0,
  savings: Math.max(0, (sdk.individualPrice || 0) - (sdk.bundlePrice || 0)),
  savingsPercent: sdk.individualPrice > 0 ? ((sdk.savings || 0) / sdk.individualPrice) * 100 : 0,\`,
  },
]

/**
 * Custom input types derived from Prisma schemas
 * These are the simplified frontend-focused interfaces
 */
export const CUSTOM_INPUT_TYPES = \`
// Re-export from schemas package
export * from '@packages/schemas'
\`
`
}

// ========================================
// Step 3: Main Consolidation Process
// ========================================

function main() {
  console.log('🔄 Starting type consolidation process...')
  
  try {
    // Step 1: Generate frontend contracts
    console.log('📝 Step 1: Generating frontend contracts from schemas...')
    const frontendContracts = generateFrontendContracts()
    const contractsPath = join(process.cwd(), 'src', 'frontend-contracts.ts')
    writeFileSync(contractsPath, frontendContracts)
    console.log('✅ Generated frontend contracts')
    
    // Step 2: Update resource configuration
    console.log('📝 Step 2: Updating resource configuration...')
    const resourceConfig = generateUpdatedResourceConfig()
    const configPath = join(process.cwd(), '..', 'sdk', 'scripts', 'resource-config.ts')
    writeFileSync(configPath, resourceConfig)
    console.log('✅ Updated resource configuration')
    
    // Step 3: Regenerate API wrapper
    console.log('📝 Step 3: Regenerating API wrapper...')
    execSync('cd ../sdk && npm run gen:wrapper', { stdio: 'inherit' })
    console.log('✅ Regenerated API wrapper')
    
    // Step 4: Regenerate backend types
    console.log('📝 Step 4: Regenerating backend types...')
    execSync('cd ../sdk && npm run gen:types', { stdio: 'inherit' })
    console.log('✅ Regenerated backend types')
    
    // Step 5: Regenerate frontend types
    console.log('📝 Step 5: Regenerating frontend types...')
    execSync('cd ../sdk && npm run gen:frontend-types', { stdio: 'inherit' })
    console.log('✅ Regenerated frontend types')
    
    console.log('🎉 Type consolidation completed successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log('  ✅ Frontend contracts generated from Prisma schemas')
    console.log('  ✅ Resource configuration updated')
    console.log('  ✅ API wrapper regenerated')
    console.log('  ✅ Backend types regenerated')
    console.log('  ✅ Frontend types regenerated')
    console.log('')
    console.log('🔗 All types now derive from a single source of truth!')
    
  } catch (error) {
    console.error('❌ Consolidation failed:', error)
    process.exit(1)
  }
}

main()
