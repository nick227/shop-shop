/**
 * StoreMapLazy - Client-side only map component with proper SSR handling;
 */
import { lazy, Suspense } from 'react'
import type { StoreMapProps } from '../StoreMap/StoreMap'

// Lazy load the map component to avoid SSR issues;
const StoreMap = lazy(() => import('../StoreMap/StoreMap').then(module => ({ default: module.StoreMap })))

export function StoreMapLazy(props: StoreMapProps) {
  return (
    <Suspense fallback={
      <div className="h-[400px] bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">Loading map...</p>
      </div>
    }>
      <StoreMap {...props} />
    </Suspense>
  )
}

