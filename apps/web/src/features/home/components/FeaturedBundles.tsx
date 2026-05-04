/**
 * FeaturedBundles - Featured bundles section for home page
 */
import React from 'react'
import { BundleCarousel } from '@features/bundles/components/customer'
import { useBundles } from '@shared/hooks/generated'

interface FeaturedBundlesProps {
  className?: string
}

export function FeaturedBundles({ className = '' }: FeaturedBundlesProps) {
  // Get featured bundles (for now, just get all active bundles)
  // In the future, this could be filtered by featured status or popularity
  const { data: bundles = [], isLoading, error } = useBundles({ 
    isActive: true 
  })

  if (isLoading) {
    return (
      <section className={`featured-bundles ${className}`}>
        <div className="featured-bundles__loading">
          <div className="featured-bundles__spinner"></div>
          <p>Loading featured bundles...</p>
        </div>
      </section>
    )
  }

  if (error || bundles?.length === 0) {
    return null // Don't show section if no bundles
  }

  return (
    <section className={`featured-bundles ${className}`}>
      <BundleCarousel
        bundles={bundles.slice(0, 6)} // Show up to 6 featured bundles
        title="Featured Bundle Deals"
        showSavings={true}
        compact={false}
      />
    </section>
  )
}

// FeaturedBundles Styles
export const featuredBundlesStyles = `
.featured-bundles {
  margin: 2rem 0;
  padding: 1.5rem 0;
}

.featured-bundles__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.featured-bundles__spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`
