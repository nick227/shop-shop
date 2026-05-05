/**
 * ResultsSection - Component for the search results section wrapper;
 */
import React, { forwardRef } from 'react'
import { GeocodingError } from './GeocodingError'
import { DebugInfo } from './DebugInfo'
import type { SearchStatus } from '@shared/hooks/hooks/useSearchOrchestration'
import type { LocationData } from '@shared/types'
import type { StoreWithDistance } from '@api/types'

interface ResultsSectionProps {
  searchStatus: SearchStatus
  stores: StoreWithDistance[] | undefined;
  geocodingError: string | undefined;
  onClearGeocodingError: () => void;
  children: React.ReactNode;
  location: LocationData | undefined;
  error: Error | undefined;
  isProd: boolean;
}

const getStatusMessage = (status: SearchStatus, storeCount?: number) => {
  const storeText = storeCount === 1 ? 'store' : 'stores'

  switch (status) {
    case 'no-location': {
      return 'Enter a location to find stores.'
    }
    case 'loading': {
      return 'Searching for ' + storeText + '...'
    }
    case 'error': {
      return 'Store search failed. Retry or change your location.'
    }
    case 'no-results': {
      return 'No ' + storeText + ' found in this area.'
    }
    case 'results': {
      if (storeCount === 0) {
        return ' '
      }
      return `${storeCount ?? 0} ${storeText} found.`
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
      className="my-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded-lg" 
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
