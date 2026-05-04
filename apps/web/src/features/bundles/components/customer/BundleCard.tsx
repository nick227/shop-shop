/**
 * BundleCard - Lightweight bundle display for customers
 * Reuses ItemCard styling and add-to-cart pattern
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Badge, Button, Image } from '@shared/ui/primitives'
// import { useAddBundleToCart } from '../../../hooks/useAddBundleToCart'
import { getItemRouteSimple } from '@shared/lib/utils/navigation/routes'
import type { Bundle } from '@api/types'
import { formatCurrency } from '@shared/lib/utils/format'
import { parsePrice } from '@shared/lib/utils/format'
//  // File not found

export interface BundleCardProps {
  readonly bundle: Bundle
  /** Optional store context for better SEO URLs */
  readonly store?: { id: string; name: string }
  /** Show savings badge */
  readonly showSavings?: boolean
  /** Compact layout for smaller spaces */
  readonly compact?: boolean
}

export function BundleCard({
  bundle,
  showSavings = true
}: BundleCardProps) {
    // const addBundleToCart = useAddBundleToCart()

  // Calculate pricing directly from bundle data to avoid performance issues
  // Since we don't have individual item data, use bundle pricing directly
  const bundlePrice = bundle.pricing?.fixedPrice ?? 0
  const individualTotal = bundlePrice // Fallback to bundle price when items not available
  const savings = 0 // Can't calculate without item data
  const savingsPercent = 0
  
  // Generate SEO-friendly bundle route
  const bundleRoute = getItemRouteSimple({ 
    id: bundle.id, 
    title: bundle.name 
  })

    const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('Add bundle to cart:', bundle.id)
  }

  return (
    <Card className="item-card">
            <Image
        src={bundle.imageUrl ?? '/placeholder-bundle-' + bundle.id + '.jpg'}    
        alt={bundle.name}
        fallbackSeed={bundle.id}
        aspectRatio="4/3"
        containerClassName="item-card__image"
      />
      <div className="item-card__content">
        <div className="item-card__header">
          <Link to={bundleRoute} className="item-card__title-link">
            <h4 className="item-card__title">{bundle.name}</h4>
          </Link>
          <div className="bundle-pricing">
            <span className="item-card__price">
              {formatCurrency(parsePrice(bundlePrice.toString()))}
            </span>
            {individualTotal > bundlePrice && (
              <span className="bundle-individual-price">
                {formatCurrency(parsePrice(individualTotal.toString()))} separately
              </span>
            )}
          </div>
        </div>

        {bundle.description && (
          <p className="item-card__description">{bundle.description}</p>
        )}

        {/* Bundle-specific info */}
        <div className="bundle-info">
          <span className="bundle-item-count">
            {bundle.totalItems ?? bundle.items?.length ?? 0} items
          </span>
          {showSavings && savings > 0 && (
            <Badge variant="success">
              Save {formatCurrency(parsePrice(savings.toString()))} ({Math.round(savingsPercent)}%)
            </Badge>
          )}
        </div>

        <div className="item-card__footer">
          <div className="item-card__badges">
            {!bundle.isActive && <Badge variant="warning">Inactive</Badge>}
            {bundle.pricing?.showSavings && savings > 0 && (
              <Badge variant="success">Bundle Deal</Badge>
            )}
          </div>
          
          <Button
            variant="primary"
            size="small"
            onClick={handleAddToCart}
            disabled={!bundle.isActive}
            className="item-card__add-button"
          >
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Bundle-specific styles (extends itemCard styles)
export const bundleCardStyles = `
.bundle-pricing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.bundle-individual-price {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.bundle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.bundle-item-count {
  color: var(--text-secondary);
  font-weight: 500;
}
`
