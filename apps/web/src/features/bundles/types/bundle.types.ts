/**
 * Bundle Types
 * Frontend-specific types for bundle management
 * 
 * Simplified to work with SDK-generated types
 */

// Frontend form data for bundle creation/editing
export interface BundleFormData {
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  items: {
    itemId: string
    quantity: number
    sortIndex: number
  }[]
  pricing: {
    pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
    fixedPrice?: number
    discountPercent?: number
    discountAmount?: number
    minSavings?: number
    showSavings: boolean
    savingsLabel?: string
  }
}

// Bundle management options
export interface BundleManagementOptions {
  storeId?: string
  isActive?: boolean
}

// Bundle display data with computed fields
export interface BundleDisplayData {
  id: string
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  totalItems: number
  individualPrice: number
  bundlePrice: number
  savings: number
  savingsPercent: number
}

// Type transformers (simplified to work with SDK types)
export function formDataToCreateInput(formData: BundleFormData, storeId: string): Record<string, unknown> {
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

export function formDataToUpdateInput(formData: Partial<BundleFormData>): Record<string, unknown> {
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

export function bundleToFormData(bundle: Record<string, unknown>): BundleFormData {
  return {
    name: bundle['name'] as string,
    description: (bundle['description'] as string) ?? '',
    imageUrl: (bundle['imageUrl'] as string) ?? '',
    isActive: bundle['isActive'] as boolean,
    sortIndex: bundle['sortIndex'] as number,
    items: (bundle['items'] as Record<string, unknown>[])?.map(item => ({
      itemId: item['itemId'] as string,
      quantity: item['quantity'] as number,
      sortIndex: item['sortIndex'] as number
    })) ?? [],
    pricing: {
      pricingType: (bundle['pricing'] as Record<string, unknown>)?.['pricingType'] as 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL' ?? 'FIXED_PRICE',
      fixedPrice: (bundle['pricing'] as Record<string, unknown>)?.['fixedPrice'] as number,
      discountPercent: (bundle['pricing'] as Record<string, unknown>)?.['discountPercent'] as number,
      discountAmount: (bundle['pricing'] as Record<string, unknown>)?.['discountAmount'] as number,
      minSavings: (bundle['pricing'] as Record<string, unknown>)?.['minSavings'] as number,
      showSavings: (bundle['pricing'] as Record<string, unknown>)?.['showSavings'] as boolean ?? true,
      savingsLabel: (bundle['pricing'] as Record<string, unknown>)?.['savingsLabel'] as string
    }
  }
}
