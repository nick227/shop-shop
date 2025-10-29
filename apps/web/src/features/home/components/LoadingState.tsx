/**
 * LoadingState - Component for displaying search loading state
 */
import React from 'react'
import { SkeletonGrid } from '@shared/ui/primitives/Skeleton'
import type { LocationData } from '@/types/location.types'

interface LoadingStateProps {
  isLoading: boolean
  location: LocationData | undefined
}

export function LoadingState({ isLoading, location }: LoadingStateProps) {
  if (!isLoading || !location) return

  return (
    <>
      <div className="text-center mb-8 text-white">
        <h2 className="text-3xl mb-2">Finding Stores...</h2>
        <p className="opacity-90">Searching nearby locations</p>
      </div>
      <SkeletonGrid count={6} />
    </>
  )
}
