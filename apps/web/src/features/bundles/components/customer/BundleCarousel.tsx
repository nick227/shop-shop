/**
 * BundleCarousel - Carousel for featured bundles (reuses ItemCarouselCompact pattern)
 */
import React, { useState } from 'react'
import { Button } from '@ui'
import { BundleCard } from './BundleCard'
import type { Bundle } from '../../../../api/backend-types'

export interface BundleCarouselProps {
  readonly bundles: Bundle[]
  readonly title?: string
  readonly showSavings?: boolean
  readonly compact?: boolean
  readonly className?: string
}

export function BundleCarousel({
  bundles,
  title = 'Featured Bundles',
  showSavings = true,
  compact = false,
  className = ''
}: BundleCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerView = compact ? 2 : 3
  const maxIndex = Math.max(0, bundles.length - itemsPerView)

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }

  if (bundles?.length === 0) {
    return undefined
  }

  const visibleBundles = bundles.slice(currentIndex, currentIndex + itemsPerView)                                                                               

  return (
    <div className={`bundle-carousel ${className ?? ''}`}>
      <div className="bundle-carousel__header">
        <h2 className="bundle-carousel__title">{title}</h2>
        {bundles.length > itemsPerView && (
          <div className="bundle-carousel__controls">
            <Button
              variant="outline"
              size="small"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
            >
              →
            </Button>
          </div>
        )}
      </div>

      <div className="bundle-carousel__content">
        <div className="bundle-carousel__items">
          {visibleBundles.map((bundle) => (
            <div key={bundle.id} className="bundle-carousel__item">
              <BundleCard
                bundle={bundle}
                showSavings={showSavings}
                compact={compact}
              />
            </div>
          ))}
        </div>
      </div>

      {bundles.length > itemsPerView && (
        <div className="bundle-carousel__indicators">
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              className={`bundle-carousel__indicator ${
                index === currentIndex ? 'bundle-carousel__indicator--active' : ''
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Bundle Carousel Styles
export const bundleCarouselStyles = `
.bundle-carousel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bundle-carousel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bundle-carousel__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.bundle-carousel__controls {
  display: flex;
  gap: 0.5rem;
}

.bundle-carousel__content {
  overflow: hidden;
}

.bundle-carousel__items {
  display: flex;
  gap: 1.5rem;
  transition: transform 0.3s ease;
}

.bundle-carousel__item {
  flex: 0 0 auto;
  min-width: 0;
}

.bundle-carousel__indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.bundle-carousel__indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  border: none;
  background: var(--border-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bundle-carousel__indicator:hover {
  background: var(--text-secondary);
}

.bundle-carousel__indicator--active {
  background: var(--primary-color);
}
`
