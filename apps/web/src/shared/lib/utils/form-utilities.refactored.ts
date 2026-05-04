/**
 * Form Utilities - Refactored
 * 
 * Provides utilities for form data transformation and validation
 * Uses generic types and reduces code duplication
 */

import type {
  StoreFormData,
  ItemFormData,
  AddressFormData,
  OrderFormData
} from '@shared/types/types/form-types'

import type {
  StoreResponse,
  ItemResponse,
  AddressResponse,
  OrderResponse
} from '@api/types'

// ========================================
// Type Definitions
// ========================================

type FieldMapping<TResponse, TFormData> = {
  [K in keyof TFormData]: {
    sourceKey?: keyof TResponse
    defaultValue?: TFormData[K]
    transform?: (value: any) => TFormData[K]
  }
}

type FieldConfig<T> = {
  stringFields?: (keyof T)[]
  numberFields?: (keyof T)[]
  booleanFields?: (keyof T)[]
}

type ValidationRule<T> = {
  required?: (keyof T)[]
  patterns?: Record<keyof T, RegExp>
  custom?: Record<keyof T, (value: T[keyof T]) => string | undefined>
}

// ========================================
// Generic Transformation Utilities
// ========================================

function createTransformFunction<TResponse, TFormData>(
  fieldMapping: FieldMapping<TResponse, TFormData>
) {
  return function transform(response: TResponse): TFormData {
    const result = {} as TFormData
    
    for (const [formField, config] of Object.entries(fieldMapping)) {
      const sourceKey = config.sourceKey || formField as keyof TResponse
      let value = response[sourceKey]
      
      // Apply transformation if provided
      if (config.transform) {
        value = config.transform(value)
      }
      
      // Use default value if source is undefined/null
      if (value === undefined || value === null) {
        value = config.defaultValue
      }
      
      result[formField as keyof TFormData] = value as TFormData[keyof TFormData]
    }
    
    return result
  }
}

// ========================================
// Field Mappings
// ========================================

const STORE_FIELD_MAPPING: FieldMapping<StoreResponse, StoreFormData> = {
  name: { defaultValue: '' },
  slug: { defaultValue: '' },
  description: { defaultValue: '' },
  companyName: { defaultValue: '' },
  taxId: { defaultValue: '' },
  phone: { defaultValue: '' },
  email: { defaultValue: '' },
  website: { defaultValue: '' },
  isPublished: { defaultValue: false },
  deliveryEnabled: { defaultValue: true },
  pickupEnabled: { defaultValue: true },
  prepTimeMin: { defaultValue: 0 },
  deliveryDistance: { defaultValue: '0' },
  deliveryCharge: { defaultValue: '0' },
  latitude: { defaultValue: '0' },
  longitude: { defaultValue: '0' },
  addressStreet: { defaultValue: '' },
  addressCity: { defaultValue: '' },
  addressState: { defaultValue: '' },
  addressZip: { defaultValue: '' },
  addressCountry: { defaultValue: 'US' },
  commissionRate: { defaultValue: '0' }
}

const ITEM_FIELD_MAPPING: FieldMapping<ItemResponse, ItemFormData> = {
  title: { defaultValue: '' },
  description: { defaultValue: '' },
  price: { defaultValue: '' },
  isActive: { defaultValue: true },
  storeId: { defaultValue: '' },
  sortIndex: { defaultValue: 0 },
  stockQty: { defaultValue: '0' },
  isSoldOut: { defaultValue: false }
}

const ADDRESS_FIELD_MAPPING: FieldMapping<AddressResponse, AddressFormData> = {
  line1: { defaultValue: '' },
  city: { defaultValue: '' },
  state: { defaultValue: '' },
  postalCode: { defaultValue: '' },
  country: { defaultValue: 'US' },
  line2: { defaultValue: '' },
  instructions: { defaultValue: '' }
}

const ORDER_FIELD_MAPPING: FieldMapping<OrderResponse, OrderFormData> = {
  cartId: { defaultValue: '' },
  deliveryType: { 
    defaultValue: 'DELIVERY' as const,
    transform: (value) => value ?? 'DELIVERY'
  },
  addressId: { defaultValue: '' },
  tip: { defaultValue: '' }
}

// ========================================
// Transformation Functions
// ========================================

export const transformStoreToFormData = createTransformFunction(STORE_FIELD_MAPPING)
export const transformItemToFormData = createTransformFunction(ITEM_FIELD_MAPPING)
export const transformAddressToFormData = createTransformFunction(ADDRESS_FIELD_MAPPING)
export const transformOrderToFormData = createTransformFunction(ORDER_FIELD_MAPPING)

// ========================================
// Generic Form Creation Utilities
// ========================================

function createInitialFormData<T>(fieldMapping: FieldMapping<any, T>): T {
  const result = {} as T
  
  for (const [field, config] of Object.entries(fieldMapping)) {
    result[field as keyof T] = config.defaultValue as T[keyof T]
  }
  
  return result
}

export function createInitialStoreFormData(): StoreFormData {
  return createInitialFormData(STORE_FIELD_MAPPING)
}

export function createInitialItemFormData(): ItemFormData {
  return createInitialFormData(ITEM_FIELD_MAPPING)
}

export function createInitialAddressFormData(): AddressFormData {
  return createInitialFormData(ADDRESS_FIELD_MAPPING)
}

export function createInitialOrderFormData(): OrderFormData {
  return createInitialFormData(ORDER_FIELD_MAPPING)
}

// ========================================
// Generic Form Cleaning Utilities
// ========================================

function cleanFormDataGeneric<T>(
  formData: T,
  config: FieldConfig<T>
): T {
  const cleaned = { ...formData }
  
  // Clean string fields
  if (config.stringFields) {
    for (const field of config.stringFields) {
      const value = cleaned[field]
      if (typeof value === 'string') {
        cleaned[field] = value.trim() as T[keyof T]
      }
    }
  }
  
  // Clean number fields
  if (config.numberFields) {
    for (const field of config.numberFields) {
      const value = cleaned[field]
      if (typeof value === 'string') {
        const num = Number.parseFloat(value)
        cleaned[field] = (isNaN(num) ? 0 : num) as T[keyof T]
      }
    }
  }
  
  // Clean boolean fields
  if (config.booleanFields) {
    for (const field of config.booleanFields) {
      const value = cleaned[field]
      if (typeof value === 'string') {
        cleaned[field] = (value === 'true' || value === '1') as T[keyof T]
      }
    }
  }
  
  return cleaned
}

export function cleanStoreFormData(formData: StoreFormData): StoreFormData {
  return cleanFormDataGeneric(formData, {
    stringFields: ['name', 'slug', 'description', 'companyName', 'taxId', 'phone', 'email', 'website', 'deliveryDistance', 'deliveryCharge', 'latitude', 'longitude', 'addressStreet', 'addressCity', 'addressState', 'addressZip', 'addressCountry', 'commissionRate'],
    numberFields: ['prepTimeMin'],
    booleanFields: ['isPublished', 'deliveryEnabled', 'pickupEnabled']
  })
}

export function cleanItemFormData(formData: ItemFormData): ItemFormData {
  return cleanFormDataGeneric(formData, {
    stringFields: ['title', 'description', 'price', 'storeId'],
    numberFields: ['sortIndex', 'stockQty'],
    booleanFields: ['isActive', 'isSoldOut']
  })
}

export function cleanAddressFormData(formData: AddressFormData): AddressFormData {
  return cleanFormDataGeneric(formData, {
    stringFields: ['line1', 'city', 'state', 'postalCode', 'country', 'line2', 'instructions']
  })
}

export function cleanOrderFormData(formData: OrderFormData): OrderFormData {
  return cleanFormDataGeneric(formData, {
    stringFields: ['cartId', 'deliveryType', 'addressId', 'tip']
  })
}

// ========================================
// Generic Validation Utilities
// ========================================

function validateFormDataGeneric<T>(
  formData: T,
  rules: ValidationRule<T>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // Check required fields
  if (rules.required) {
    for (const field of rules.required) {
      const value = formData[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field as string] = `${String(field)} is required`
      }
    }
  }
  
  // Apply pattern validation
  if (rules.patterns) {
    for (const [field, pattern] of Object.entries(rules.patterns)) {
      const value = formData[field as keyof T]
      if (value && typeof value === 'string' && !pattern.test(value)) {
        errors[field] = `Invalid ${String(field).toLowerCase()} format`
      }
    }
  }
  
  // Apply custom validation
  if (rules.custom) {
    for (const [field, validator] of Object.entries(rules.custom)) {
      const value = formData[field as keyof T]
      const error = validator(value)
      if (error) {
        errors[field] = error
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateStoreFormData(formData: StoreFormData): { isValid: boolean; errors: Record<string, string> } {
  return validateFormDataGeneric(formData, {
    required: ['name', 'slug', 'description', 'phone', 'email', 'website'],
    patterns: {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s-()]+$/,
      website: /^https?:\/\/.+/
    } as Partial<Record<keyof StoreFormData, RegExp>>
  })
}

export function validateItemFormData(formData: ItemFormData): { isValid: boolean; errors: Record<string, string> } {
  return validateFormDataGeneric(formData, {
    required: ['storeId', 'title', 'price'],
    custom: {
      stockQty: (value) => {
        if (typeof value !== 'number' || value < 0) {
          return 'Stock quantity must be a non-negative number'
        }
      },
      sortIndex: (value) => {
        if (typeof value !== 'number' || value < 0) {
          return 'Sort index must be a non-negative number'
        }
      }
    }
  })
}

export function validateAddressFormData(formData: AddressFormData): { isValid: boolean; errors: Record<string, string> } {
  return validateFormDataGeneric(formData, {
    required: ['line1', 'city', 'state', 'postalCode']
  })
}

export function validateOrderFormData(formData: OrderFormData): { isValid: boolean; errors: Record<string, string> } {
  return validateFormDataGeneric(formData, {
    required: ['cartId', 'deliveryType'],
    custom: {
      addressId: (value) => {
        if (value !== undefined && (typeof value !== 'string' || value.trim() === '')) {
          return 'Address ID must be a valid string'
        }
      },
      tip: (value) => {
        if (value !== undefined && (typeof value !== 'string' || value.trim() === '')) {
          return 'Tip must be a valid string'
        }
      }
    }
  })
}
