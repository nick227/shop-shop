/**
 * Header - Component for the main header with navigation;
 */
import React from 'react'

interface HeaderProps {
  locationDisplayName: string | null;
  currentRadius: number;
  citiesContextResult: { short?: string }
  onClearLocation: () => void;
  onNavigateToVendor: () => void;
}

export function Header({ 
  locationDisplayName, 
  currentRadius, 
  citiesContextResult, 
  onClearLocation, 
  onNavigateToVendor
}: HeaderProps) {
  return (
    <header className="bg-white/95 backdrop-blur-md shadow-md sticky top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-gray-800">Shop Shop</div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button" 
            onClick={onNavigateToVendor}
            className="px-4 py-2 rounded-lg border-0 cursor-pointer text-sm font-medium transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 hover:-translate-y-px"
            aria-label="Vendor Portal"
          >
            🏪 Sell
          </button>
          
          {locationDisplayName && (
            <button
              type="button" 
              className="px-4 py-2 rounded-lg border-0 cursor-pointer text-sm font-medium transition-all bg-gray-100 text-gray-800 hover:bg-gray-200 hover:-translate-y-px"
              onClick={onClearLocation}
              aria-label={'Change location. Current: ${locationDisplayName}, ' + currentRadius + ' miles'}
            >
              📍 {citiesContextResult.short || locationDisplayName} · {currentRadius} mi
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
