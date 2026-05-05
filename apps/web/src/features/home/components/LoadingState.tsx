/**
 * LoadingState — compact; reinforce area label during fetch.
 */
import React from 'react'
import { SkeletonGrid } from '@shared/ui/primitives'
import type { LocationData } from '@shared/types/types/location.types'

export interface LoadingStateProps {
  readonly isLoading: boolean
  readonly location: LocationData | undefined
  readonly areaLabel: string | undefined
}

export function LoadingState({ isLoading, location, areaLabel }: LoadingStateProps) {
  if (!isLoading || !location) return

  const label = areaLabel ?? location.displayName ?? 'your area'

  return (
    <>
      <div className="mb-3 text-center text-gray-900">
        <p className="text-base font-semibold">
          Finding stores near {label}
        </p>
        <p className="text-xs text-gray-500">Results update automatically.</p>
      </div>
      <SkeletonGrid count={3} />
    </>
  )
}
