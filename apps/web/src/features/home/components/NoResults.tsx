/**
 * No stores in radius — always offers next actions.
 */
import React from 'react'
import type { LocationData } from '@shared/types/types/location.types'

const RADIUS_POLICY = {
  MIN_MILES: 5,
  MAX_MILES: 100,
  EXPAND_STEP_MILES: 10,
} as const

export interface NoResultsProps {
  readonly location: LocationData | undefined
  readonly areaLabel: string | undefined
  readonly onExpandSearch: () => void
  readonly onPickNearbyCity: () => void
}

export function NoResults({
  location,
  areaLabel,
  onExpandSearch,
  onPickNearbyCity,
}: NoResultsProps) {
  if (!location) return

  const label = areaLabel ?? location.displayName ?? 'this area'
  const nextRadius = Math.min(
    Math.max((location.radiusMiles ?? 25) + RADIUS_POLICY.EXPAND_STEP_MILES, RADIUS_POLICY.MIN_MILES),
    RADIUS_POLICY.MAX_MILES
  )

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center text-amber-950 shadow-sm">
      <h3 className="text-lg font-semibold">No stores nearby</h3>
      <p className="mt-2 text-sm">
        Nothing in range for <span className="font-medium">{label}</span>. Expand your radius or try another city.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
          onClick={() => {
            onExpandSearch()
          }}
        >
          Expand radius ({nextRadius} mi)
        </button>
        <button
          type="button"
          className="rounded-lg border border-amber-700 bg-white px-4 py-2.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          onClick={() => {
            onPickNearbyCity()
          }}
        >
          Pick nearby city
        </button>
      </div>
    </div>
  )
}
