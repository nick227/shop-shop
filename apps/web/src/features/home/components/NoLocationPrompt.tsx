import React from 'react'
import { QUICK_CITIES } from '../constants/quickCities'
import { cn } from '@shared/lib/cn'

export interface NoLocationPromptProps {
  readonly onQuickCity: (city: string, state: string) => void
  readonly className?: string
}

export function NoLocationPrompt({ onQuickCity, className }: NoLocationPromptProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-purple-100 bg-purple-50/90 px-4 py-4 text-center text-gray-900',
        className
      )}
    >
      <h3 className="text-lg font-semibold">Enter your location</h3>
      <p className="mt-1 text-sm text-gray-600">
        Use the fields above, or tap a city to search right away.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {QUICK_CITIES.map(({ city, state }) => (
          <button
            key={`${city}-${state}`}
            type="button"
            className="rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-800"
            onClick={() => {
              onQuickCity(city, state)
            }}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  )
}
