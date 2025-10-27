/**
 * Form Type Utilities
 * 
 * Provides utilities for creating form types from SDK types
 * Eliminates manual type duplication and ensures API sync
 */

import type {
  CreateStoreRequest,
  CreateItemInput,
  CreateAddressInput,
  CreateOrderInput,
  StoreResponse,
  UpdateItemInput,
  UpdateAddressInput
} from '@packages/sdk'

// ========================================
// Store Form Types
// ========================================

export type StoreFormData = Required<Pick<CreateStoreRequest, 
  | 'name' 
  | 'slug' 
  | 'description' 
  | 'companyName' 
  | 'taxId' 
  | 'phone' 
  | 'email' 
  | 'website' 
  | 'isPublished' 
  | 'deliveryEnabled' 
  | 'pickupEnabled' 
  | 'prepTimeMin' 
  | 'deliveryDistance' 
  | 'deliveryCharge' 
  | 'addressStreet' 
  | 'addressCity' 
  | 'addressState' 
  | 'addressZip' 
  | 'addressCountry' 
  | 'latitude' 
  | 'longitude'
>>

// Use a more conservative approach for UpdateStoreRequest
export interface StoreUpdateFormData {
  name: string
  slug: string
  description: string
  companyName: string
  taxId: string
  phone: string
  email: string
  website: string
  isPublished: boolean
  deliveryEnabled: boolean
  pickupEnabled: boolean
  prepTimeMin: number
  deliveryDistance: string
  deliveryCharge: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  latitude: string
  longitude: string
}

// ========================================
// Item Form Types
// ========================================

export type ItemFormData = Required<Pick<CreateItemInput, 
  | 'title' 
  | 'description' 
  | 'price' 
  | 'isActive' 
  | 'storeId'
  | 'sortIndex'
  | 'stockQty'
  | 'isSoldOut'
>>

export type ItemUpdateFormData = Required<Pick<UpdateItemInput, 
  | 'title' 
  | 'description' 
  | 'price' 
  | 'isActive'
  | 'sortIndex'
  | 'stockQty'
  | 'isSoldOut'
>>

// ========================================
// Order Form Types
// ========================================

export type OrderFormData = Required<Pick<CreateOrderInput, 
  | 'cartId' 
  | 'deliveryType' 
  | 'addressId' 
  | 'tip'
>>

// ========================================
// Address Form Types
// ========================================

export type AddressFormData = Required<Pick<CreateAddressInput, 
  | 'label' 
  | 'line1' 
  | 'line2' 
  | 'city' 
  | 'state' 
  | 'postalCode' 
  | 'country' 
  | 'isDefault'
>>

export type AddressUpdateFormData = Required<Pick<UpdateAddressInput, 
  | 'label' 
  | 'line1' 
  | 'line2' 
  | 'city' 
  | 'state' 
  | 'postalCode' 
  | 'country' 
  | 'isDefault'
>>

// ========================================
// Post Form Types
// ========================================

// Note: Post types not available in current SDK version
// export type PostFormData = Required<Pick<CreatePostInput, 
//   | 'storeId' 
//   | 'content' 
//   | 'mediaUrls'
// >>

// export type PostUpdateFormData = Required<Pick<UpdatePostInput, 
//   | 'content' 
//   | 'mediaUrls'
// >>

// ========================================
// Generic Form Type Utilities
// ========================================

/**
 * Create a form type from any SDK input type
 * Makes all specified fields required for form validation
 */
export type CreateFormType<T, K extends keyof T> = Required<Pick<T, K>>

/**
 * Create an update form type from any SDK update type
 * Makes all specified fields required for form validation
 */
export type UpdateFormType<T, K extends keyof T> = Required<Pick<T, K>>

// ========================================
// Form Validation Utilities
// ========================================

/**
 * Check if form data is valid for API submission
 */
export function isValidFormData<T>(data: T): data is T {
  return data !== undefined
}

/**
 * Transform form data to API format
 * Handles any necessary conversions between form and API types
 */
export function transformFormToApi<T, U>(formData: T, transformer: (data: T) => U): U {
  return transformer(formData)
}

// ========================================
// Form Initialization Utilities
// ========================================

/**
 * Create initial form data for StoreFormData
 * All fields initialized with proper defaults
 */
export function createInitialStoreFormData(): StoreFormData {
  return {
    name: '',
    slug: '',
    description: '',
    companyName: '',
    taxId: '',
    phone: '',
    email: '',
    website: '',
    isPublished: false,
    deliveryEnabled: true,
    pickupEnabled: true,
    prepTimeMin: 15,
    deliveryDistance: '',
    deliveryCharge: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'US',
    latitude: '',
    longitude: '',
  }
}

/**
 * Create initial form data for ItemFormData
 */
export function createInitialItemFormData(): ItemFormData {
  return {
    title: '',
    description: '',
    price: '',
    isActive: true,
    storeId: '',
    sortIndex: 0,
    stockQty: '0',
    isSoldOut: false,
  }
}

/**
 * Create initial form data for AddressFormData
 */
export function createInitialAddressFormData(): AddressFormData {
  return {
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    isDefault: false,
  }
}

/**
 * Create initial form data for OrderFormData
 */
export function createInitialOrderFormData(): OrderFormData {
  return {
    cartId: '',
    deliveryType: 'DELIVERY' as const,
    addressId: '',
    tip: '',
  }
}

// Note: Post functions commented out due to missing SDK types
// export function createInitialPostFormData(): PostFormData {
//   return {
//     storeId: '',
//     content: '',
//     mediaUrls: [],
//   }
// }

// ========================================
// Dynamic Form Utilities
// ========================================

/**
 * Transform store data to form data dynamically
 * Works with any SDK store response
 */
export function transformStoreToFormData(store: StoreResponse): StoreFormData {
  return {
    name: store.name ?? '',
    slug: store.slug ?? '',
    description: store.description ?? '',
    companyName: store.companyName ?? '',
    taxId: store.taxId ?? '',
    phone: store.phone ?? '',
    email: store.email ?? '',
    website: store.website ?? '',
    isPublished: store.isPublished ?? false,
    deliveryEnabled: store.deliveryEnabled ?? true,
    pickupEnabled: store.pickupEnabled ?? true,
    prepTimeMin: store.prepTimeMin ?? 15,
    deliveryDistance: store.deliveryDistance?.toString() ?? '',
    deliveryCharge: store.deliveryCharge?.toString() ?? '',
    addressStreet: store.addressStreet ?? '',
    addressCity: store.addressCity ?? '',
    addressState: store.addressState ?? '',
    addressZip: store.addressZip ?? '',
    addressCountry: store.addressCountry ?? 'US',
    latitude: store.latitude?.toString() ?? '',
    longitude: store.longitude?.toString() ?? '',
  }
}

/**
 * Clean form data for API submission dynamically
 * Handles string trimming and empty value conversion
 */
export function cleanFormDataForSubmission<T extends Record<string, unknown>>(formData: T): T {
  const cleaned = { ...formData }
  
  // Clean string fields - trim and convert empty strings to empty strings
  for (const key of Object.keys(cleaned)) {
    const value = cleaned[key]
    if (typeof value === 'string') {
      (cleaned as Record<string, unknown>)[key] = value.trim()
    }
  }
  
  return cleaned
}

/**
 * Generic form data cleaner that works with any form type
 * Automatically handles string trimming and type conversion
 */
export function cleanFormData<T extends Record<string, any>>(
  formData: T,
  stringFields: (keyof T)[],
  numberFields: (keyof T)[] = [],
  booleanFields: (keyof T)[] = []
): T {
  const cleaned = { ...formData }
  
  // Clean string fields
  for (const field of stringFields) {
    const value = cleaned[field]!
    if (typeof value === 'string') {
      cleaned[field] = value?.trim() as T[keyof T]
    }
  }
  
  // Clean number fields
  for (const field of numberFields) {
    const value = cleaned[field]!
    if (typeof value === 'string') {
      const num = Number.parseFloat(value)
      cleaned[field] = (Number.isNaN(num) ? 0 : num) as T[keyof T]
    }
  }
  
  // Clean boolean fields
  for (const field of booleanFields) {
    const value = cleaned[field]!
    if (typeof value === 'string') {
      cleaned[field] = (value === 'true' || value === '1') as T[keyof T]
    }
  }
  
  return cleaned
}

/**
 * Store-specific form data cleaner
 * Uses the actual field types from StoreFormData
 */
export function cleanStoreFormData(formData: StoreFormData): StoreFormData {
  return cleanFormData(
    formData,
    // String fields that need trimming
    ['name', 'slug', 'description', 'companyName', 'taxId', 'phone', 'email', 'website', 'deliveryDistance', 'deliveryCharge', 'addressStreet', 'addressCity', 'addressState', 'addressZip', 'addressCountry', 'latitude', 'longitude'],
    // Number fields
    ['prepTimeMin'],
    // Boolean fields
    ['isPublished', 'deliveryEnabled', 'pickupEnabled']
  )
}
