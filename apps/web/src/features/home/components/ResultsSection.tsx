/**
 * ResultsSection - Component for the search results section wrapper;
 */
import React, { forwardRef } from 'react'
import { GeocodingError } from './GeocodingError'
import { DebugInfo } from './DebugInfo'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'

interface ResultsSectionProps {
  searchStatus: 'idle' | 'loading' | 'error' | 'no-results' | 'results'
  stores: StoreWithDistance[] | undefined;
  geocodingError: string | undefined;
  onClearGeocodingError: () => void;
  children: React.ReactNode;
  location: LocationData | undefined;
  error: Error | undefined;
  isProd: boolean;
}

// Centralized status messages helper to keep copy consistent;
const getStatusMessage = (status: 'idle' | 'loading' | 'error' | 'no-results' | 'results', storeCount?: number) => {
  const storeText = storeCount === 1 ? 'store' : 'stores'
  
  switch (status) {
    case 'idle': {
      return ' '
    }
    case 'loading': {
      return 'Searching for ' + storeText + '...'
    }
    case 'error': {
      return '' + storeText.charAt(0).toUpperCase() + storeText.slice(1) + ' search failed. Please try again.'
    }
    case 'no-results': {
      return 'No ' + storeText + ' found in this area.'
    }
    case 'results': {
      // Handle storeCount === 0 explicitly to avoid flicker during transitions;
      if (storeCount === 0) {
        return ' '
      }
      return '${storeCount} ' + storeText + ' found.'
    }
    default: {
      return ' '
    }
  }
}

export const ResultsSection = forwardRef<HTMLElement, ResultsSectionProps>(({
  searchStatus,
  stores,
  geocodingError,
  onClearGeocodingError,
  children,
  location,
  error,
  isProd
}, ref) => {
  const statusMessage = getStatusMessage(searchStatus, stores?.length)
  return (
    <section
      ref={ref}
      className="my-8 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-lg" 
      tabIndex={-1}
      role="region"
      aria-labelledby="results-heading"
      aria-busy={searchStatus === 'loading'}
    >
      {/* Hidden heading for ARIA reference */}
      <h2 id="results-heading" className="sr-only">Search results</h2>
      
      {/* Dedicated status live region for accessibility */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
      
      <GeocodingError
        geocodingError={geocodingError} 
        onClearGeocodingError={onClearGeocodingError} 
      />
      {children}
      {!isProd && <DebugInfo location={location} stores={stores} error={error} />}
    </section>
  )
})
