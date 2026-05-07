/**
 * MapController - Component for controlling map view programmatically;
 * Single Responsibility: Map view control;
 */
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export interface MapControllerProps {
  center: [number, number]
  zoom: number;
}

export function MapController({ center, zoom }: MapControllerProps) {
  const map = useMap()
  
  useEffect(() => {
    const [targetLat, targetLon] = center;
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    
    // Only update if position or zoom actually changed (avoid unnecessary re-renders)
    const hasPositionChanged = 
      Math.abs(currentCenter.lat - targetLat) > 0.0001 ||
      Math.abs(currentCenter.lng - targetLon) > 0.0001;
    const hasZoomChanged = currentZoom !== zoom;
    if (hasPositionChanged || hasZoomChanged) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  
  return null
}
