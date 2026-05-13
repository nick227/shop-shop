import React from 'react'

interface AddressDisplayProps {
  locationDisplayName?: string
  currentRadius?: number
  citiesContextResult?: { short?: string }
  onClearLocation?: () => void
  className?: string
}

export function AddressDisplay({ 
  locationDisplayName, 
  currentRadius = 0, 
  citiesContextResult, 
  onClearLocation,
  className = ''
}: AddressDisplayProps) {
  if (!locationDisplayName) {
    return null
  }

  return (
    <button
      type="button" 
      className={`px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap bg-gray-100 rounded-lg border-0 transition-all cursor-pointer hover:bg-gray-200 hover:-translate-y-px ${className}`}
      onClick={onClearLocation}
      aria-label={`Change location. Current: ${locationDisplayName}, ${currentRadius} miles`}
    >
      📍 {citiesContextResult?.short || locationDisplayName} · {currentRadius} mi
    </button>
  )
}
