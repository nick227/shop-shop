/**
 * DebugInfo - Component for displaying debug information (dev only)
 */
import React from 'react'
import type { LocationData } from '@/types/location.types'
import type { StoreWithDistance } from '@api/backend-types'

interface DebugInfoProps {
  location: LocationData | undefined
  stores: StoreWithDistance[] | undefined
  error: Error | undefined
}

export function DebugInfo({ location, stores, error }: DebugInfoProps) {
  // Environment-safe check - handles non-Vite/SSR contexts
  const isProd = import.meta !== undefined 
    ? import.meta.env.MODE === 'production' 
    : process.env.NODE_ENV === 'production'
  
  // Ensure no-op in production
  if (isProd) return
  if (!location) return

  return (
    <div className="text-xs text-white/70 mb-2">
      Debug: location={location ? 'set' : 'undefined'}, stores={stores?.length || 0}, error={error ? 'yes' : 'no'}
      {stores && stores.length > 0 && stores[0] && (
        <div>First store: {stores[0].name}</div>
      )}
    </div>
  )
}
