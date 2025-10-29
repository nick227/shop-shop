/**
 * Form Utilities
 * 
 * Provides utilities for form data transformation and validation
 * Uses generic types from @api/types to eliminate duplication
 */

import type {
  StoreFormData,
  ItemFormData,
  AddressFormData,
  OrderFormData
} from './form-types'
// Import SDK types for validation
// Note: SDK types are used via form-types, no direct imports needed here

// Import SDK response types directly
import type {
  StoreResponse,
  ItemResponse,
  AddressResponse,
  OrderResponse
} from '@packages/sdk'

// ========================================
// Form Initialization Utilities
// ========================================

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
    prepTimeMin: 0,
    deliveryDistance: '0',
    deliveryCharge: '0',
    latitude: '0',
    longitude: '0',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: 'US',
    commissionRate: '0'
  }
}

export function createInitialItemFormData(): ItemFormData {
  return {
    title: '', description: '', price: '', isActive: true,
    storeId: '', sortIndex: 0, stockQty: '0', isSoldOut: false
  }
}

export function createInitialAddressFormData(): AddressFormData {
  return {
    line1: '', 
    city: '', 
    state: '', 
    postalCode: '', 
    country: 'US',
    line2: '', 
    instructions: ''
  }
}

export function createInitialOrderFormData(): OrderFormData {
  return {
    cartId: '', deliveryType: 'DELIVERY', addressId: '', tip: ''
  }
}

// Note: Post functions commented out due to missing SDK types
// export function createInitialPostFormData(): PostFormData {
//   return {
//     content: '', mediaUrls: [], storeId: ''
//   }
// }

// ========================================
// Form Data Transformation Utilities
// ========================================

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
    prepTimeMin: store.prepTimeMin ?? 0,
    deliveryDistance: store.deliveryDistance ?? '0',
    deliveryCharge: store.deliveryCharge ?? '0',
    latitude: store.latitude ?? '0',
    longitude: store.longitude ?? '0',
    addressStreet: store.addressStreet ?? '',
    addressCity: store.addressCity ?? '',
    addressState: store.addressState ?? '',
    addressZip: store.addressZip ?? '',
    addressCountry: store.addressCountry ?? 'US',
    commissionRate: store.commissionRate ?? '0'
  }
}

export function transformItemToFormData(item: ItemResponse): ItemFormData {
  return {
    title: item.title ?? '', description: item.description ?? '', price: item.price ?? '',
    isActive: item.isActive ?? true, storeId: item.storeId ?? '',
    sortIndex: item.sortIndex ?? 0, stockQty: item.stockQty ?? '0', isSoldOut: item.isSoldOut ?? false
  }
}

export function transformAddressToFormData(address: AddressResponse): AddressFormData {
  return {
    line1: address.line1 ?? '',
    city: address.city ?? '', 
    state: address.state ?? '', 
    postalCode: address.postalCode ?? '',
    country: address.country ?? 'US',
    line2: address.line2 ?? '',
    instructions: address.instructions ?? ''
  }
}

export function transformOrderToFormData(order: OrderResponse): OrderFormData {
  return {
    cartId: order.cartId ?? '', 
    deliveryType: order.deliveryType ?? 'DELIVERY' as const, // SDK enum type
    addressId: order.addressId ?? '', 
    tip: order.tip ?? ''
  }
}

// Note: Post functions commented out due to missing SDK types
// export function transformPostToFormData(post: PostResponse): PostFormData {
//   return {
//     content: post.content || '', 
//     mediaUrls: (post.mediaUrls || []) as any, // SDK type compatibility
//     storeId: post.storeId || ''
//   }
// }

// ========================================
// Form Data Cleaning Utilities
// ========================================

export function cleanFormData<T extends Record<string, any>>(
  formData: T,
  stringFields: (keyof T)[],
  numberFields: (keyof T)[] = [],
  booleanFields: (keyof T)[] = []
): T {
  const cleaned = { ...formData }
  
  // Clean string fields
  for (const field of stringFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      cleaned[field] = value?.trim() as T[keyof T]
    }
  }
  
  // Clean number fields
  for (const field of numberFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      const num = Number.parseFloat(value)
      cleaned[field] = (isNaN(num) ? 0 : num) as T[keyof T]
    }
  }
  
  // Clean boolean fields
  for (const field of booleanFields) {
    const value = cleaned[field]
    if (typeof value === 'string') {
      cleaned[field] = (value === 'true' || value === '1') as T[keyof T]
    }
  }
  
  return cleaned
}

export function cleanStoreFormData(formData: StoreFormData): StoreFormData {
  return cleanFormData(
    formData,
    // String fields that need trimming
    ['name', 'slug', 'description', 'companyName', 'taxId', 'phone', 'email', 'website', 'deliveryDistance', 'deliveryCharge', 'latitude', 'longitude', 'addressStreet', 'addressCity', 'addressState', 'addressZip', 'addressCountry', 'commissionRate'],
    // Number fields
    ['prepTimeMin'],
    // Boolean fields
    ['isPublished', 'deliveryEnabled', 'pickupEnabled']
  )
}

export function cleanItemFormData(formData: ItemFormData): ItemFormData {
  return cleanFormData(
    formData,
    ['title', 'description', 'price', 'storeId'],
    ['sortIndex', 'stockQty'],
    ['isActive', 'isSoldOut']
  )
}

export function cleanAddressFormData(formData: AddressFormData): AddressFormData {
  return cleanFormData(
    formData,
    ['line1', 'city', 'state', 'postalCode', 'country', 'line2', 'instructions'], 
    [], 
    []
  )
}

export function cleanOrderFormData(formData: OrderFormData): OrderFormData {
  return cleanFormData(
    formData,
    ['cartId', 'deliveryType', 'addressId', 'tip'],
    [],
    []
  )
}

// Note: Post functions commented out due to missing SDK types
// export function cleanPostFormData(formData: PostFormData): PostFormData {
//   return cleanFormData(
//     formData,
//     ['content', 'storeId'],
//     [],
//     []
//   )
// }

// ========================================
// Form Validation Utilities
// ========================================

export function validateFormData<T extends Record<string, any>>(
  formData: T,
  requiredFields: (keyof T)[],
  validationRules?: Record<keyof T, (value: T[keyof T]) => string | undefined>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // Check required fields
  for (const field of requiredFields) {
    const value = formData[field]
    if (!value || (typeof value === 'string' && value?.trim() === '')) {
      errors[field as string] = '' + String(field) + ' is required'
    }
  }
  
  // Apply custom validation rules
  if (validationRules) {
    for (const [field, validator] of Object?.entries(validationRules)) {
      const value = formData[field as keyof T]
      const error = validator(value)
      if (error) {
        errors[field] = error
      }
    }
  }
  
  return {
    isValid: Object?.keys(errors).length === 0,
    errors
  }
}

export function validateStoreFormData(formData: StoreFormData): { isValid: boolean; errors: Record<string, string> } {
  // Schema-first validation: Check if form data matches schema structure
  const errors: Record<string, string> = {}
  
  // Required fields validation using schema structure
  if (!formData.name || formData.name?.trim() === '') {
    errors.name = 'Store name is required'
  }
  if (!formData.slug || formData.slug?.trim() === '') {
    errors.slug = 'Store slug is required'
  }
  if (!formData.description || formData.description?.trim() === '') {
    errors.description = 'Store description is required'
  }
  if (!formData.phone || formData.phone?.trim() === '') {
    errors.phone = 'Phone number is required'
  }
  if (!formData.email || formData.email?.trim() === '') {
    errors.email = 'Email is required'
  }
  if (!formData.website || formData.website?.trim() === '') {
    errors.website = 'Website is required'
  }
  
  // Type validation for schema compatibility
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData.email)) {
    errors.email = 'Invalid email format'
  }
  if (formData.phone && !/^\+?[\d\s-()]+$/?.test(formData.phone)) {
    errors.phone = 'Invalid phone format'
  }
  if (formData.website && !/^https?:\/\/.+/?.test(formData.website)) {
    errors.website = 'Website must start with http:// or https://'
  }
  
  return {
    isValid: Object?.keys(errors).length === 0,
    errors
  }
}

export function validateItemFormData(formData: ItemFormData): { isValid: boolean; errors: Record<string, string> } {
  // SDK-first validation: Check if form data matches SDK CreateItemInput structure
  const errors: Record<string, string> = {}
  
  // Required fields validation using SDK structure
  if (!formData.storeId || formData.storeId?.trim() === '') {
    errors.storeId = 'Store ID is required'
  }
  if (!formData.title || formData.title?.trim() === '') {
    errors.title = 'Title is required'
  }
  if (!formData.price || formData.price?.trim() === '') {
    errors.price = 'Price is required'
  }
  
  // Type validation for SDK compatibility
  if (formData.stockQty !== undefined && (typeof formData.stockQty !== 'number' || formData.stockQty < 0)) {
    errors.stockQty = 'Stock quantity must be a non-negative number'
  }
  if (formData.sortIndex !== undefined && (typeof formData.sortIndex !== 'number' || formData.sortIndex < 0)) {
    errors.sortIndex = 'Sort index must be a non-negative number'
  }
  
  return {
    isValid: Object?.keys(errors).length === 0,
    errors
  }
}

export function validateAddressFormData(formData: AddressFormData): { isValid: boolean; errors: Record<string, string> } {
  // Schema-first validation: Check if form data matches schema structure
  const errors: Record<string, string> = {}
  
  // Required fields validation using schema structure
  if (!formData.line1 || formData.line1?.trim() === '') {
    errors.line1 = 'Street address is required'
  }
  if (!formData.city || formData.city?.trim() === '') {
    errors.city = 'City is required'
  }
  if (!formData.state || formData.state?.trim() === '') {
    errors.state = 'State is required'
  }
  if (!formData.postalCode || formData.postalCode?.trim() === '') {
    errors.postalCode = 'Postal code is required'
  }
  
  return {
    isValid: Object?.keys(errors).length === 0,
    errors
  }
}

export function validateOrderFormData(formData: OrderFormData): { isValid: boolean; errors: Record<string, string> } {
  // SDK-first validation: Check if form data matches SDK CreateOrderInput structure
  const errors: Record<string, string> = {}
  
  // Required fields validation using SDK structure
  if (!formData.cartId || formData.cartId?.trim() === '') {
    errors.cartId = 'Cart ID is required'
  }
  if (!formData.deliveryType || formData.deliveryType?.trim() === '') {
    errors.deliveryType = 'Delivery type is required'
  }
  
  // Type validation for SDK compatibility
  if (formData.addressId !== undefined && (typeof formData.addressId !== 'string' || formData.addressId?.trim() === '')) {
    errors.addressId = 'Address ID must be a valid string'
  }
  if (formData.tip !== undefined && (typeof formData.tip !== 'string' || formData.tip?.trim() === '')) {
    errors.tip = 'Tip must be a valid string'
  }
  
  return {
    isValid: Object?.keys(errors).length === 0,
    errors
  }
}

// Note: Post functions commented out due to missing SDK types
// export function validatePostFormData(formData: PostFormData): { isValid: boolean; errors: Record<string, string> } {
//   // SDK-first validation: Check if form data matches SDK CreatePostInput structure
//   const errors: Record<string, string> = {}
//   
//   // Required fields validation using SDK structure
//   if (!formData.storeId || formData.storeId?.trim() === '') {
//     errors['storeId'] = 'Store ID is required'
//   }
//   if (!formData.content || formData.content?.trim() === '') {
//     errors['content'] = 'Content is required'
//   }
//   
//   // Type validation for SDK compatibility
//   if (formData.mediaUrls !== undefined && (!Array?.isArray(formData.mediaUrls) || !formData.mediaUrls?.every(url => typeof url === 'string'))) {
//     errors['mediaUrls'] = 'Media URLs must be an array of strings'
//   }
//   
//   return {
//     isValid: Object?.keys(errors).length === 0,
//     errors
//   }
// }
