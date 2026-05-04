/**
 * Bundle Pricing Component
 * Displays bundle pricing information and savings
 */
import React from 'react'
import { Badge } from '@shared/ui/primitives'
import { BundleSavingsBadge } from './BundleSavingsBadge'

// Local type definitions to avoid circular dependencies
interface BundleItem {
  id: string
  bundleId: string
  itemId: string
  quantity: number
  sortIndex?: number
  item?: {
    id: string
    title: string
    price: number
    imageUrl?: string
  }
}

interface BundlePricing {
  id: string
  bundleId: string
  pricingType: 'FIXED_PRICE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_AMOUNT' | 'BEST_DEAL'
  fixedPrice?: number
  discountPercent?: number
  discountAmount?: number
  minSavings?: number
  showSavings: boolean
  savingsLabel?: string
}

interface Bundle {
  id: string
  storeId: string
  name: string
  description?: string
  imageUrl?: string
  isActive: boolean
  sortIndex: number
  createdAt: string
  updatedAt: string
  items?: BundleItem[]
  pricing?: BundlePricing
  totalItems?: number
}

interface BundlePricingProps {
  readonly bundle: Bundle
  readonly showDetails?: boolean
  readonly className?: string
}

// Type guard function to ensure bundle is valid
function isValidBundle(bundle: unknown): bundle is Bundle {
  return (
    bundle !== null &&
    bundle !== undefined &&
    typeof bundle === 'object' &&
    'id' in bundle &&
    'storeId' in bundle &&
    'name' in bundle
  )
}

export function BundlePricing ({ 
  bundle, 
  showDetails = true, 
  className = '' 
}: BundlePricingProps) {
  // Type guard to ensure bundle is valid
  if (!isValidBundle(bundle)) {
    return <></>
  }

  // Calculate pricing values from bundle data
  const calculatePricing = (): {
    individualPrice: number
    bundlePrice: number
    savings: number
    savingsPercent: number
  } => {
    if (!bundle.pricing) {
      return {
        individualPrice: 0,
        bundlePrice: 0,
        savings: 0,
        savingsPercent: 0
      }
    }

    // Calculate individual total from bundle items
    const individualPrice = bundle.items?.reduce((total, bundleItem) => {
      const itemPrice = bundleItem.item?.price ?? 0
      return total + (itemPrice * bundleItem.quantity)
    }, 0) ?? 0

    // Calculate bundle price based on pricing type
    let bundlePrice = 0
    switch (bundle.pricing.pricingType) {
      case 'FIXED_PRICE': {
        bundlePrice = bundle.pricing.fixedPrice ?? 0
        break
      }
      case 'DISCOUNT_PERCENT': {
        bundlePrice = individualPrice * (1 - (bundle.pricing.discountPercent ?? 0) / 100)
        break
      }
      case 'DISCOUNT_AMOUNT': {
        bundlePrice = Math.max(0, individualPrice - (bundle.pricing.discountAmount ?? 0))
        break
      }
      case 'BEST_DEAL': {
        bundlePrice = Math.min(individualPrice, bundle.pricing.fixedPrice ?? individualPrice)
        break
      }
      default: {
        bundlePrice = individualPrice
        break
      }
    }

    const savings = Math.max(0, individualPrice - bundlePrice)
    const savingsPercent = individualPrice > 0 ? (savings / individualPrice) * 100 : 0

    return {
      individualPrice,
      bundlePrice,
      savings,
      savingsPercent
    }
  }

  const { individualPrice, bundlePrice, savings, savingsPercent } = calculatePricing()
  const hasSavings = savings > 0

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bundle Price</span>
          <span className="text-2xl font-bold text-foreground">
            ${bundlePrice.toFixed(2)}
          </span>
        </div>
        
        {hasSavings && (
          <BundleSavingsBadge 
            savings={savings} 
            savingsPercent={savingsPercent}
            label={bundle.pricing?.savingsLabel}
          />
        )}
      </div>

      {showDetails && (
        <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">
              Individual Total
            </span>
            <span className="text-foreground line-through opacity-50">
              ${individualPrice.toFixed(2)}
            </span>
          </div>
          
          {hasSavings && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">
                You Save
              </span>
              <span className="text-success font-semibold">
                ${savings.toFixed(2)} ({savingsPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {bundle.pricing?.pricingType && (
        <div className="flex justify-start">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold h-5">
            {getPricingTypeLabel(bundle.pricing.pricingType)}
          </Badge>
        </div>
      )}
    </div>
  )
}

function getPricingTypeLabel(pricingType: string): string {
  switch (pricingType) {
    case 'FIXED_PRICE': {
      return 'Fixed Price'
    }
    case 'DISCOUNT_PERCENT': {
      return 'Percentage Discount'
    }
    case 'DISCOUNT_AMOUNT': {
      return 'Amount Discount'
    }
    case 'BEST_DEAL': {
      return 'Best Deal'
    }
    default: {
      return 'Custom Pricing'
    }
  }
}
