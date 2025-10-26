/**
 * useMapZoom - Hook for calculating map zoom level;
 * Single Responsibility: Zoom calculation logic;
 */
import { useMemo } from 'react'

export interface MapZoomOptions {
  radiusMiles?: number;
  defaultZoom?: number;
}

export function useMapZoom({ 
  radiusMiles, 
  defaultZoom = 12
}: MapZoomOptions): number {
  return useMemo((): number => {
    if (!radiusMiles) return defaultZoom;
    // Adjust zoom based on radius;
    if (radiusMiles <= 5) return 13;
    if (radiusMiles <= 25) return 11;
    if (radiusMiles <= 50) return 10;
    if (radiusMiles <= 100) return 9;
    return 7;
  }, [radiusMiles, defaultZoom])
}
