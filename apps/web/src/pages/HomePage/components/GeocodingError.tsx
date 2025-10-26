/**
 * GeocodingError - Component for displaying geocoding errors
 */
import React from 'react'

interface GeocodingErrorProps {
  geocodingError: string | null
  onClearGeocodingError?: () => void
}

export function GeocodingError({ geocodingError, onClearGeocodingError }: GeocodingErrorProps) {
  if (!geocodingError) return null

  // Extract city/state from error message for better UX
  const failedLocation = geocodingError.includes('Failed to geocode') 
    ? geocodingError.replace('Failed to geocode ', '').replace(/[,.].*/, '')
    : null

  return (
    <div className="text-center py-8 px-4 bg-yellow-100 text-yellow-800 rounded-xl my-4" role="alert" aria-live="assertive">
      <h2 className="text-xl font-bold mb-2">Location Error</h2>
      <p className="text-base">{geocodingError}</p>
      {failedLocation && (
        <p className="text-sm mt-2">Failed to find: <strong>{failedLocation}</strong></p>
      )}
      <p className="text-sm mt-2">Please try a different location or check your spelling.</p>
      <div className="flex gap-3 justify-center mt-4">
        {onClearGeocodingError && (
          <button
            type="button"
            onClick={onClearGeocodingError}
            className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded-lg hover:bg-yellow-300 transition-colors"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (onClearGeocodingError) {
              onClearGeocodingError()
            }
            // Focus on search form for retry
            const searchInput = document.querySelector('input[type="text"]') as HTMLElement
            if (searchInput) {
              searchInput.focus()
            }
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          aria-label="Retry search"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
