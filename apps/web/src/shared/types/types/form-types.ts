/**
 * Form Types - Centralized form-related type definitions
 * 
 * This file consolidates all form-related types that were previously
 * scattered across different files.
 */

import type { ReactNode } from 'react'

// ============================================
// Base Form Types
// ============================================

/** Base form data interface */
export type BaseFormData = Record<string, any>;

/** Form state management */
export interface FormState<T extends BaseFormData = BaseFormData> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isDirty: boolean
  isValid: boolean
  touched: Partial<Record<keyof T, boolean>>
}

/** Form actions */
export interface FormActions<T extends BaseFormData = BaseFormData> {
  setValue: (field: keyof T, value: unknown) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field: keyof T) => void
  reset: () => void
  submit: () => void
  validate: () => boolean
}

/** Form validation rule */
export interface FormValidationRule<T = any> {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: T) => string | undefined
  message?: string
}

/** Form validation */
export type FormValidation<T extends BaseFormData = BaseFormData> = {
  [K in keyof T]?: FormValidationRule<T[K]>
}

/** Form hook return type */
export interface UseFormReturn<T extends BaseFormData = BaseFormData> {
  state: FormState<T>
  actions: FormActions<T>
  validation: FormValidation<T>
}

/** Form hook options */
export interface UseFormOptions<T extends BaseFormData = BaseFormData> {
  initialData?: Partial<T>
  validation?: FormValidation<T>
  onSubmit?: (data: T) => void | Promise<void>
  onError?: (errors: Partial<Record<keyof T, string>>) => void
}

// ============================================
// Store Form Types
// ============================================

/** Store form data */
export interface StoreFormData {
  name: string
  slug: string
  description: string
  companyName: string
  taxId: string
  phone: string
  email: string
  website: string
  customDomain: string
  socialYoutube: string
  socialInstagram: string
  socialFacebook: string
  socialTiktok: string
  socialTwitter: string
  socialWhatsapp: string
  socialDiscord: string
  socialSnapchat: string
  isPublished: boolean
  status?: 'ACTIVE' | 'PAUSED' | 'DISABLED'
  disabledAt?: string | null
  disabledByUserId?: string | null
  disabledReason?: string | null
  deliveryEnabled: boolean
  pickupEnabled: boolean
  prepTimeMin: number
  deliveryDistance: string
  deliveryCharge: string
  latitude: string
  longitude: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  commissionRate?: string
}

/** Store form props */
export interface StoreFormProps {
  initialData?: Partial<StoreFormData>
  onSubmit: (data: StoreFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

/** Store form field props */
export interface StoreFormFieldProps {
  field: keyof StoreFormData
  value: unknown
  onChange: (field: keyof StoreFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

/** Store form section props */
export interface StoreFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================
// Item Form Types
// ============================================

/** Item form data */
export interface ItemFormData {
  title: string
  description: string
  price: number
  category: string
  type: string
  subtype: string
  tags: string[]
  isActive: boolean
  isSoldOut: boolean
  stockQty: number
  sortIndex: number
  storeId: string
}

/** Item form props */
export interface ItemFormProps {
  initialData?: Partial<ItemFormData>
  onSubmit: (data: ItemFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

/** Item form field props */
export interface ItemFormFieldProps {
  field: keyof ItemFormData
  value: unknown
  onChange: (field: keyof ItemFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

/** Item form section props */
export interface ItemFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================
// Address Form Types
// ============================================

/** Address form data */
export interface AddressFormData {
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault?: boolean
  label?: string
}

/** Address form props */
export interface AddressFormProps {
  initialData?: Partial<AddressFormData>
  onSubmit: (data: AddressFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

/** Address form field props */
export interface AddressFormFieldProps {
  field: keyof AddressFormData
  value: unknown
  onChange: (field: keyof AddressFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

/** Address form section props */
export interface AddressFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================
// Order Form Types
// ============================================

/** Order form data */
export interface OrderFormData {
  deliveryType: 'DELIVERY' | 'PICKUP'
  addressId?: string
  tip?: string
  specialInstructions?: string
}

/** Order form props */
export interface OrderFormProps {
  initialData?: Partial<OrderFormData>
  onSubmit: (data: OrderFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

/** Order form field props */
export interface OrderFormFieldProps {
  field: keyof OrderFormData
  value: unknown
  onChange: (field: keyof OrderFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

/** Order form section props */
export interface OrderFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================
// Post Form Types
// ============================================

/** Post form data */
export interface PostFormData {
  storeId: string
  content: string
  mediaUrls?: string[]
}

/** Post form props */
export interface PostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}

/** Post form field props */
export interface PostFormFieldProps {
  field: keyof PostFormData
  value: unknown
  onChange: (field: keyof PostFormData, value: unknown) => void
  error?: string
  disabled?: boolean
}

/** Post form section props */
export interface PostFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ============================================
// Generic Form Types
// ============================================

/** Generic form props */
export interface BaseFormProps<T extends BaseFormData = BaseFormData> {
  initialData?: Partial<T>
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
  validation?: FormValidation<T>
}

/** Generic form field props */
export interface BaseFormFieldProps<T extends BaseFormData = BaseFormData> {
  field: keyof T
  value: unknown
  onChange: (field: keyof T, value: unknown) => void
  error?: string
  disabled?: boolean
  validation?: FormValidationRule<T[keyof T]>
}

/** Generic form section props */
export interface BaseFormSectionProps {
  title: string
  children: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  className?: string
}

// ============================================
// Form Utility Types
// ============================================

/** Form transformer function */
export type FormTransformer<T, U> = (data: T) => U

/** Form initializer function */
export type FormInitializer<T> = (data?: Partial<T>) => T

/** Form validator function */
export type FormValidator<T> = (data: T) => Partial<Record<keyof T, string>>

/** Form section configuration */
export interface FormSection {
  id: string
  title: string
  fields: string[]
  collapsible?: boolean
  defaultExpanded?: boolean
}

/** Form page props */
export interface FormPageProps<T extends BaseFormData = BaseFormData> {
  title: string
  description?: string
  form: UseFormReturn<T>
  sections: FormSection[]
  onSubmit: (data: T) => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  error?: string
}
