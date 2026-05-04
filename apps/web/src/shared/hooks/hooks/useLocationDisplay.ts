/**
 * useLocationDisplay - Handles location display logic and derived values
 * Extracts location display logic from HomePage for better separation of concerns
 */
import { useMemo } from 'react'
import { getStoreCitiesContextDual } from '@shared/lib/utils/storeHelpers'
import type { LocationData } from '@shared/types/types/location.types'
import type { StoreWithDistance } from '@api/types'
import type { LocationCoordinates } from '@shared/types/types/component-props'

interface UseLocationDisplayResult {
  userLocation: LocationCoordinates | undefined
  locationDisplayName: string
  citiesContextResult: ReturnType<typeof getStoreCitiesContextDual>
}

export function useLocationDisplay(
  location: LocationData | undefined,
  stores: StoreWithDistance[] | undefined
): UseLocationDisplayResult {
  // Get cities context for location display
  const citiesContextResult = useMemo(() => 
    getStoreCitiesContextDual(stores || []), 
    [stores]
  )

  // Build location display name
  const locationDisplayName = useMemo(() => 
    location?.displayName || citiesContextResult.short || 'Your Location',
    [location?.displayName, citiesContextResult.short]
  )

  // Compute minimal userLocation for map components (lat/lng only)
  const userLocation = useMemo(() => 
    location ? {
      latitude: location.latitude,
      longitude: location.longitude,
    } as LocationCoordinates : undefined, 
    [location?.latitude, location?.longitude]
  )

  return {
    userLocation,
    locationDisplayName,
    citiesContextResult,
  }
}
