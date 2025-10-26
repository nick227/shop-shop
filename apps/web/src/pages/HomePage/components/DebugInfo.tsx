/**
 * DebugInfo - Component for displaying debug information (dev only)
 */
import React from 'react'
import type { LocationData } from '@/types/location.types'
import type { StoreResponse } from '@api/types'

interface DebugInfoProps {
  location: LocationData | null
  stores: StoreResponse[] | undefined
  error: Error | null
}

export function DebugInfo({ location, stores, error }: DebugInfoProps) {
  // Environment-safe check - handles non-Vite/SSR contexts
  const isProd = import.meta !== undefined 
    ? import.meta.env.MODE === 'production' 
    : process.env['NODE_ENV'] === 'production'
  
  // Ensure no-op in production
  if (isProd) return null
  if (!location) return null

  return (
    <div className="text-xs text-white/70 mb-2">
      Debug: location={location ? 'set' : 'null'}, stores={stores?.length || 0}, error={error ? 'yes' : 'no'}
      {stores && stores.length > 0 && stores[0] && (
        <div>First store: {stores[0].name}</div>
      )}
    </div>
  )
}
