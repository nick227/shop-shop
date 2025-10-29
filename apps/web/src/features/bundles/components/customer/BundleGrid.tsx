/**
 * BundleGrid - Grid layout for bundles (reuses StoreGrid pattern)
 */
import React from 'react'
import { BundleCard } from './BundleCard'
import type { Bundle } from '@api/backend-types'

export interface BundleGridProps {
  readonly bundles: Bundle[]
  readonly onBundleClick?: (bundle: Bundle) => void
  readonly highlightedBundleId?: string
  readonly columns?: 2 | 3 | 4
  readonly showSavings?: boolean
  readonly compact?: boolean
  readonly className?: string
}

export function BundleGrid({
  bundles,
  onBundleClick,
  highlightedBundleId,
  columns = 3,
  showSavings = true,
  compact = false,
  className = ''
}: BundleGridProps) {
  if (bundles?.length === 0) {
    return (
      <div className={`bundle-grid bundle-grid--empty ${className}`}>
        <div className="bundle-grid__empty">
          <h3>No bundles available</h3>
          <p>Check back later for bundle deals!</p>
        </div>
      </div>
    )
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={`bundle-grid ${gridCols[columns]} gap-6 ${className}`}>
            {bundles.map((bundle) => (
        <div
          key={bundle.id}
          className={`bundle-grid__item ${
            highlightedBundleId === bundle.id ? 'bundle-grid__item--highlighted' : ''                                                                           
          }`}
          onClick={() => onBundleClick?.(bundle)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onBundleClick?.(bundle)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <BundleCard
            bundle={bundle}
            showSavings={showSavings}
            compact={compact}
          />
        </div>
      ))}
    </div>
  )
}

// Bundle Grid Styles
export const bundleGridStyles = `
.bundle-grid {
  display: grid;
  gap: 1.5rem;
}

.bundle-grid--empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.bundle-grid__empty {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-grid__empty h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bundle-grid__empty p {
  margin: 0;
  color: var(--text-secondary);
}

.bundle-grid__item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bundle-grid__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bundle-grid__item--highlighted {
  border: 2px solid var(--primary-color);
  border-radius: 0.5rem;
}
`
