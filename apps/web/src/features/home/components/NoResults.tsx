/**
 * NoResults - Component for displaying no results state
 */
import React from 'react'
import { NoResults as NoResultsUI } from '@shared/ui/primitives/NoResults'
import type { LocationData } from '@/types/location.types'
import type { StoreWithDistance } from '@api/backend-types'

// Radius policy constants - single source of truth
const RADIUS_POLICY = {
  MIN_MILES: 5,
  MAX_MILES: 100,
  EXPAND_STEP_MILES: 10,
} as const

interface NoResultsProps {
  error: Error | undefined
  location: LocationData | undefined
  stores: StoreWithDistance[] | undefined
  onExpandSearch: () => void
}

export function NoResults({ error, location, stores, onExpandSearch }: NoResultsProps) {
  if (error || !location || (stores && stores.length > 0)) return

  // Check if this is a database empty state (no stores at all)
  const isDatabaseEmpty = stores?.length === 0 && location

  if (isDatabaseEmpty) {
    return (
      <NoResultsUI
        title="No Stores Available"
        message="We're currently setting up our store network. Check back soon for amazing local restaurants and stores in your area!"
        onSearchAgain={() => window.location.reload()}
        expandSearchText="Refresh Page"
      />
    )
  }

  // Calculate new radius for expand search
  const newRadius = Math.min(
    Math.max((location.radiusMiles ?? 25) + RADIUS_POLICY.EXPAND_STEP_MILES, RADIUS_POLICY?.MIN_MILES), 
    RADIUS_POLICY?.MAX_MILES)

  return (
    <NoResultsUI
      title="No Stores Found"
      message={'No stores found in ' + location.displayName + '. Try expanding your search radius or searching a different location.'}
      onExpandSearch={onExpandSearch}
      expandSearchText={'+ Expand (' + newRadius + ' mi)'}
    />
  )
}
