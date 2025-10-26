/**
 * ErrorState - Component for displaying search error state
 */
import React from 'react'
import type { LocationData } from '@/types/location.types'

interface ErrorStateProps {
  error: Error | null
  location: LocationData | null
}

export function ErrorState({ error, location }: ErrorStateProps) {
  if (!error || !location) return null

  return (
    <div className="text-center py-8 px-4 bg-red-100 text-red-800 rounded-xl my-4" role="alert">
      <h2 className="text-xl font-bold mb-2">Search Error</h2>
      <p className="text-base">{error.message}</p>
      <p className="text-sm mt-2">Please try searching again using the form above.</p>
    </div>
  )
}
