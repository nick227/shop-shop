/**
 * Bundle Types
 * Frontend-specific types for bundle management
 * 
 * Now uses schema-derived types for consistency
 */

import type { CreateBundleInput } from '@api/types'
import type { Bundle } from '@api/backend-types'

// Frontend form data for bundle creation/editing
// Derived from schema to ensure consistency
export type BundleFormData = Omit<CreateBundleInput, 'storeId'> & {
  storeId?: string // Optional for form editing
}

// Bundle management options
export interface BundleManagementOptions {
  storeId?: string
  isActive?: boolean
}

// Bundle display data with computed fields
// Extends schema-derived Bundle type with computed fields
export type BundleDisplayData = Bundle & {
  // Computed fields are already included in the schema-derived Bundle type
  // totalItems, individualPrice, bundlePrice, savings, savingsPercent
}

// Type transformers (using schema-derived types)
export function formDataToCreateInput(formData: BundleFormData, storeId: string): CreateBundleInput {
  return {
    storeId,
    name: formData.name,
    description: formData.description,
    imageUrl: formData.imageUrl,
    isActive: formData.isActive,
    sortIndex: formData.sortIndex,
    items: formData.items,
    pricing: formData.pricing
  }
}

export function formDataToUpdateInput(formData: Partial<BundleFormData>): Partial<CreateBundleInput> {
  return {
    name: formData.name,
    description: formData.description,
    imageUrl: formData.imageUrl,
    isActive: formData.isActive,
    sortIndex: formData.sortIndex,
    items: formData.items,
    pricing: formData.pricing
  }
}

export function bundleToFormData(bundle: Bundle): BundleFormData {
  return {
    name: bundle.name,
    description: bundle.description ?? '',
    imageUrl: bundle.imageUrl ?? '',
    isActive: bundle.isActive ?? true,
    sortIndex: bundle.sortIndex ?? 0,
    items: bundle.items?.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      sortIndex: item.sortIndex ?? 0
    })) ?? [],
    pricing: bundle.pricing ?? {
      pricingType: 'FIXED_PRICE' as const,
      showSavings: true
    }
  }
}
