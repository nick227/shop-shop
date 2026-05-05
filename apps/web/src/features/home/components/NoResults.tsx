/**
 * No stores in radius — explicit mile targets (less thinking).
 */
import React from 'react'
import type { LocationData } from '@shared/types/types/location.types'

const RADIUS_POLICY = {
  MIN_MILES: 5,
  MAX_MILES: 100,
} as const

const EXPAND_RUNGS = [10, 25, 50, 100] as const

function getExpandMileOptions(currentMiles: number): number[] {
  const c = Math.max(0, currentMiles)
  if (c >= RADIUS_POLICY.MAX_MILES) {
    return []
  }
  const above = EXPAND_RUNGS.filter((r) => r > c)
  if (above.length >= 2) {
    return [above[0], above[1]]
  }
  if (above.length === 1) {
    const second = Math.min(RADIUS_POLICY.MAX_MILES, Math.max(c + 15, above[0] + 15))
    return second > above[0] ? [above[0], second] : [above[0]]
  }
  const stepA = Math.min(RADIUS_POLICY.MAX_MILES, c + 10)
  const stepB = Math.min(RADIUS_POLICY.MAX_MILES, c + 25)
  const opts = [stepA, stepB].filter((x, i, a) => x > c && a.indexOf(x) === i).sort((x, y) => x - y)
  return opts.slice(0, 2)
}

export interface NoResultsProps {
  readonly location: LocationData | undefined
  readonly searchRadiusMiles: number
  readonly areaLabel: string | undefined
  readonly onExpandToMiles: (miles: number) => void
  readonly onPickNearbyCity: () => void
}

export function NoResults({
  location,
  searchRadiusMiles,
  areaLabel,
  onExpandToMiles,
  onPickNearbyCity,
}: NoResultsProps) {
  if (!location) return

  const label = areaLabel ?? location.displayName ?? 'this area'
  const displayRadius = Math.round(searchRadiusMiles)
  const actualRadius = location.radiusMiles ?? searchRadiusMiles
  const targets = getExpandMileOptions(actualRadius)

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center text-amber-950 shadow-sm">
      <h3 className="text-lg font-semibold">No stores found nearby</h3>
      <p className="mt-2 text-sm">
        No stores within <span className="font-medium">{displayRadius} mi</span> of{' '}
        <span className="font-medium">{label}</span>. Try a wider radius or another city.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {targets.map((miles) => (
          <button
            key={miles}
            type="button"
            className="rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
            onClick={() => {
              onExpandToMiles(miles)
            }}
          >
            Expand to {miles} mi
          </button>
        ))}
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
      {targets.length === 0 && (
        <p className="mt-3 text-xs text-amber-900/80">Already using the maximum search radius.</p>
      )}
    </div>
  )
}
