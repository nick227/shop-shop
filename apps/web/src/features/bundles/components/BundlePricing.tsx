/**
 * Bundle Pricing Component
 * Displays bundle pricing information and savings
 */
import React from 'react'
import { Badge } from '@components/ui/Badge'
import { BundleSavingsBadge } from './BundleSavingsBadge'
import type { Bundle } from '../../../api/types'

interface BundlePricingProps {
  bundle: Bundle
  showDetails?: boolean
  className?: string
}

export function BundlePricing({ 
  bundle, 
  showDetails = true, 
  className = '' 
}: BundlePricingProps) {
  const {
    individualPrice = 0,
    bundlePrice = 0,
    savings = 0,
    savingsPercent = 0
  } = bundle

  const hasSavings = savings > 0

  return (
    <div className={`bundle-pricing ${className}`}>
      <div className="bundle-pricing__main">
        <div className="bundle-pricing__price">
          <span className="bundle-pricing__price-label">Bundle Price:</span>
          <span className="bundle-pricing__price-value">
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
        <div className="bundle-pricing__details">
          <div className="bundle-pricing__individual">
            <span className="bundle-pricing__individual-label">
              Individual Total:
            </span>
            <span className="bundle-pricing__individual-value">
              ${individualPrice.toFixed(2)}
            </span>
          </div>
          
          {hasSavings && (
            <div className="bundle-pricing__savings">
              <span className="bundle-pricing__savings-label">
                You Save:
              </span>
              <span className="bundle-pricing__savings-value">
                ${savings.toFixed(2)} ({savingsPercent.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {bundle.pricing?.pricingType && (
        <div className="bundle-pricing__type">
          <Badge variant="outline" size="sm">
            {getPricingTypeLabel(bundle.pricing.pricingType)}
          </Badge>
        </div>
      )}
    </div>
  )
}

function getPricingTypeLabel(pricingType: string): string {
  switch (pricingType) {
    case 'FIXED_PRICE':
      return 'Fixed Price'
    case 'DISCOUNT_PERCENT':
      return 'Percentage Discount'
    case 'DISCOUNT_AMOUNT':
      return 'Amount Discount'
    case 'BEST_DEAL':
      return 'Best Deal'
    default:
      return 'Custom Pricing'
  }
}

// Bundle Pricing Styles
export const bundlePricingStyles = `
.bundle-pricing {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bundle-pricing__main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.bundle-pricing__price {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bundle-pricing__price-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.bundle-pricing__price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.bundle-pricing__details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--muted-background);
  border-radius: 0.375rem;
}

.bundle-pricing__individual,
.bundle-pricing__savings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.bundle-pricing__individual-label,
.bundle-pricing__savings-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.bundle-pricing__individual-value {
  color: var(--text-primary);
  text-decoration: line-through;
}

.bundle-pricing__savings-value {
  color: var(--success-color);
  font-weight: 600;
}

.bundle-pricing__type {
  display: flex;
  justify-content: flex-start;
}
`
