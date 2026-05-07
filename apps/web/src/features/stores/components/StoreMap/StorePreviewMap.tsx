/**
 * StorePreviewMap - lightweight display-only map for card previews.
 * Oriented to a single store location.
 */
import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface StorePreviewMapProps {
  latitude: number | string
  longitude: number | string
  height?: string
  zoom?: number
}

export function StorePreviewMap({ latitude, longitude, height = '120px', zoom = 14 }: StorePreviewMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | undefined>(undefined)
  const markerRef = useRef<L.Marker | undefined>(undefined)

  const lat = typeof latitude === 'number' ? latitude : Number.parseFloat(latitude)
  const lng = typeof longitude === 'number' ? longitude : Number.parseFloat(longitude)

  useEffect(() => {
    if (!containerRef.current) return
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapRef.current = map
    }

    const map = mapRef.current
    map.setView([lat, lng], zoom)

    if (markerRef.current) {
      map.removeLayer(markerRef.current)
    }

    const icon = L.divIcon({
      className: 'custom-preview-pin',
      html: '<div style="background:#3b82f6;color:white;border-radius:999px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);">🏪</div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    markerRef.current = L.marker([lat, lng], { icon }).addTo(map)

    // Force redraw for proper sizing
    setTimeout(() => map.invalidateSize(), 0)
  }, [lat, lng, zoom])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
    }
  }, [])

  if (isNaN(lat) || isNaN(lng)) {
    return (
      <div 
        className="flex justify-center items-center text-xs bg-muted text-muted-foreground" 
        style={{ height }}
      >
        No location data
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      style={{ height, width: '100%', flex: 1 }} 
      className="overflow-hidden bg-muted"
    />
  )
}
