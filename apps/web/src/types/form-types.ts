/**
 * Generic Form Types
 * Consolidates all form interfaces into reusable generic types
 */

// Import SDK input types directly
import type { 
  CreateStoreInput, 
  CreateItemInput, 
  CreateAddressInput, 
  CreateOrderInput, 
  CreatePostInput,
  UpdateStoreInput,
  UpdateItemInput,
  UpdateAddressInput,
  UpdateOrderInput,
  UpdatePostInput
} from '@packages/sdk'

// ========================================
// Base Form Types
// ========================================

export interface BaseFormData {
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface FormState<T> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
}

export interface FormActions<T> {
  setData: (data: T) => void
  setField: <K extends keyof T>(field: K, value: T[K]) => void
  setError: (field: keyof T, error: string) => void
  clearErrors: () => void
  reset: () => void
  submit: () => void
}

// ========================================
// Generic Form Props
// ========================================

export interface FormProps<T> {
  data: T
  onSubmit: (data: T) => void
  onCancel?: () => void
  onReset?: () => void
  isLoading?: boolean
  errors?: Record<string, string>
  mode?: 'create' | 'edit' | 'view'
  validateOnChange?: boolean
  validateOnBlur?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
}

export interface FormFieldProps<T> {
  name: keyof T
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'checkbox' | 'select'
  required?: boolean
  placeholder?: string
  helperText?: string
  error?: string
  options?: { value: string; label: string }[]
}

export interface FormSectionProps<T> {
  title: string
  description?: string
  fields: FormFieldProps<T>[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ========================================
// Entity-Specific Form Data Types
// ========================================

// Store Form Data
export type StoreFormData = Required<Pick<CreateStoreInput,
  | 'name' | 'slug' | 'description' | 'companyName' | 'taxId' | 'phone' | 'email' | 'website'
  | 'isPublished' | 'deliveryEnabled' | 'pickupEnabled' | 'prepTimeMin'
  | 'deliveryDistance' | 'deliveryCharge'
  | 'addressStreet' | 'addressCity' | 'addressState' | 'addressZip' | 'addressCountry'
  | 'latitude' | 'longitude'
>>

// Item Form Data
export type ItemFormData = Required<Pick<CreateItemInput,
  | 'title' | 'description' | 'price' | 'isActive'
  | 'storeId' | 'sortIndex' | 'stockQty' | 'isSoldOut'
>>

// Address Form Data
export type AddressFormData = Required<Pick<CreateAddressInput,
  | 'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country'
  | 'isDefault' | 'label'
>>

// Order Form Data
export type OrderFormData = Required<Pick<CreateOrderInput,
  | 'cartId' | 'deliveryType' | 'addressId' | 'tip'
>>

// Post Form Data
export type PostFormData = Required<Pick<CreatePostInput,
  | 'content' | 'mediaUrls' | 'storeId'
>>

// ========================================
// Form Validation Types
// ========================================

export interface FormValidation<T> {
  isValid: boolean
  errors: Record<keyof T, string>
  warnings: Record<keyof T, string>
}

export interface FormValidationRule<T> {
  field: keyof T
  validator: (value: T[keyof T]) => string | null
  message: string
}

// ========================================
// Form Hook Types
// ========================================

export interface UseFormReturn<T> {
  data: T
  errors: Record<string, string>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
  setData: (data: T) => void
  setField: <K extends keyof T>(field: K, value: T[K]) => void
  setError: (field: keyof T, error: string) => void
  clearErrors: () => void
  reset: () => void
  submit: () => void
  validate: () => boolean
}

export interface UseFormOptions<T> {
  initialData: T
  onSubmit: (data: T) => void
  validation?: FormValidationRule<T>[]
  mode?: 'create' | 'edit' | 'view'
}

// ========================================
// Form Section Types
// ========================================

export interface FormSection {
  id: string
  title: string
  description?: string
  icon?: string
  content: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  fields?: string[]
  columns?: number
}

export interface FormPageProps<T> {
  title: string
  subtitle?: string
  data: T
  sections: FormSection[]
  onSubmit: (data: T) => void
  onCancel?: () => void
  isLoading?: boolean
  errors?: Record<string, string>
  mode?: 'create' | 'edit' | 'view'
  backLink?: string
  actions?: string[]
}

// ========================================
// Form Utility Types
// ========================================

export interface FormInitializer<T> {
  createInitial: () => T
  transformFromEntity: (entity: any) => T
  cleanForSubmission: (data: T) => T
}

export interface FormTransformer<T, U> {
  toForm: (entity: U) => T
  fromForm: (data: T) => U
}

// ========================================
// Specific Form Types (Type Aliases)
// ========================================

export type StoreFormProps = FormProps<StoreFormData>
export type StoreFormFieldProps = FormFieldProps<StoreFormData>
export type StoreFormSectionProps = FormSectionProps<StoreFormData>

export type ItemFormProps = FormProps<ItemFormData>
export type ItemFormFieldProps = FormFieldProps<ItemFormData>
export type ItemFormSectionProps = FormSectionProps<ItemFormData>

export type AddressFormProps = FormProps<AddressFormData>
export type AddressFormFieldProps = FormFieldProps<AddressFormData>
export type AddressFormSectionProps = FormSectionProps<AddressFormData>

export type OrderFormProps = FormProps<OrderFormData>
export type OrderFormFieldProps = FormFieldProps<OrderFormData>
export type OrderFormSectionProps = FormSectionProps<OrderFormData>

export type PostFormProps = FormProps<PostFormData>
export type PostFormFieldProps = FormFieldProps<PostFormData>
export type PostFormSectionProps = FormSectionProps<PostFormData>
