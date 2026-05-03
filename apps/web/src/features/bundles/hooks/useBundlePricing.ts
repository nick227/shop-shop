/**
 * Bundle Pricing Hook
 * Handles bundle pricing calculations and validation
 */
import { useMemo, useCallback } from 'react'
import type { Bundle, ItemResponse } from '@api/types'

export interface BundlePricingResult {
  individualTotal: number
  bundlePrice: number
  savings: number
  savingsPercent: number
  isValid: boolean
  errors: string[]
}

export interface BundlePricingOptions {
  bundle: Bundle
  items: ItemResponse[]
}

function itemByIdMap(items: ItemResponse[]): Map<string, ItemResponse> {
  const map = new Map<string, ItemResponse>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return map
}

export function useBundlePricing({ bundle, items }: BundlePricingOptions) {
  const pricing = useMemo(() => {
    const errors: string[] = []
    const safeItems = items ?? []

    // Early return if no items provided - avoid expensive calculations
    if (safeItems.length === 0) {
      return {
        individualTotal: 0,
        bundlePrice: bundle.pricing?.fixedPrice || 0,
        savings: 0,
        savingsPercent: 0,
        isValid: true,
        errors: []
      }
    }

    const byId = itemByIdMap(safeItems)
    
    // Calculate individual item total (O(bundle lines) lookups via Map)
    const individualTotal = bundle.items?.reduce((sum, bundleItem) => {
      const item = byId.get(bundleItem.itemId)
      if (!item) {
        errors.push(`Item ${bundleItem.itemId} not found`)
        return sum
      }
      return sum + (Number(item.price) * bundleItem.quantity)
    }, 0) || 0

    // Calculate bundle price based on pricing type
    let bundlePrice = individualTotal
    
    if (bundle.pricing?.pricingType === 'FIXED_PRICE' && bundle.pricing.fixedPrice) {
      bundlePrice = bundle.pricing.fixedPrice
    } else if (bundle.pricing?.pricingType === 'DISCOUNT_PERCENT' && bundle.pricing.discountPercent) {
      const discount = (individualTotal * bundle.pricing.discountPercent) / 100
      bundlePrice = Math.max(0, individualTotal - discount)
    } else if (bundle.pricing?.pricingType === 'DISCOUNT_AMOUNT' && bundle.pricing.discountAmount) {
      bundlePrice = Math.max(0, individualTotal - bundle.pricing.discountAmount)
    }

    // Calculate savings
    const savings = Math.max(0, individualTotal - bundlePrice)
    const savingsPercent = individualTotal > 0 ? (savings / individualTotal) * 100 : 0

    // Validate pricing
    if (bundlePrice <= 0) {
      errors.push('Bundle price must be greater than 0')
    }
    
    if (bundlePrice > individualTotal) {
      errors.push('Bundle price cannot be higher than individual item total')
    }

    // Check minimum savings if specified
    if (bundle.pricing?.minSavings && savings < bundle.pricing.minSavings) {
      errors.push(`Savings must be at least $${bundle.pricing.minSavings}`)
    }

    return {
      individualTotal,
      bundlePrice,
      savings,
      savingsPercent,
      isValid: errors.length === 0,
      errors
    }
  }, [bundle, items])

  // Calculate pricing for a specific set of items
  const calculatePricingForItems = useCallback((items: ItemResponse[], quantities: Record<string, number>) => {
    const individualTotal = items.reduce((sum, item) => {
      const quantity = quantities[item.id] || 0
      return sum + (Number(item.price) * quantity)
    }, 0)

    return {
      individualTotal,
      itemCount: items.length,
      totalQuantity: Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
    }
  }, [])

  // Get pricing recommendations
  const getPricingRecommendations = useCallback(() => {
    const { individualTotal, bundlePrice, savings } = pricing
    
    const recommendations = []
    
    if (savings > 0) {
      recommendations.push({
        type: 'savings' as const,
        message: `Save $${savings.toFixed(2)} (${pricing.savingsPercent.toFixed(1)}%)`,
        value: savings
      })
    }
    
    if (bundlePrice < individualTotal * 0.8) {
      recommendations.push({
        type: 'discount' as const,
        message: 'Great discount! Consider increasing price slightly',
        value: bundlePrice
      })
    }
    
    return recommendations
  }, [pricing])

  return {
    pricing,
    calculatePricingForItems,
    getPricingRecommendations
  }
}

// Helper function for pricing calculations
export const calculateBundlePricing = (
  bundle: Bundle, 
  items: ItemResponse[]
): BundlePricingResult => {
  const byId = itemByIdMap(items ?? [])
  const individualTotal = bundle.items?.reduce((sum, bundleItem) => {
    const item = byId.get(bundleItem.itemId)
    return sum + (Number(item?.price || 0) * bundleItem.quantity)
  }, 0) || 0

  let bundlePrice = individualTotal
  
  if (bundle.pricing?.pricingType === 'FIXED_PRICE' && bundle.pricing.fixedPrice) {
    bundlePrice = bundle.pricing.fixedPrice
  } else if (bundle.pricing?.pricingType === 'DISCOUNT_PERCENT' && bundle.pricing.discountPercent) {
    const discount = (individualTotal * bundle.pricing.discountPercent) / 100
    bundlePrice = Math.max(0, individualTotal - discount)
  } else if (bundle.pricing?.pricingType === 'DISCOUNT_AMOUNT' && bundle.pricing.discountAmount) {
    bundlePrice = Math.max(0, individualTotal - bundle.pricing.discountAmount)
  }

  const savings = Math.max(0, individualTotal - bundlePrice)
  const savingsPercent = individualTotal > 0 ? (savings / individualTotal) * 100 : 0

  return {
    individualTotal,
    bundlePrice,
    savings,
    savingsPercent,
    isValid: bundlePrice > 0 && bundlePrice <= individualTotal,
    errors: []
  }
}
