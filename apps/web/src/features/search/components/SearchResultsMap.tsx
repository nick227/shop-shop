/**
 * SearchResultsMap — Leaflet map showing store pins for search results.
 * Accepts pre-filtered stores (all have lat/lng). Follows the same direct-Leaflet
 * pattern as StorePreviewMap / StoreMap.
 */
import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreSearchResult } from '../hooks/useUnifiedSearchApi'
import { formatDistance } from '@shared/lib/utils/format'

export interface SearchResultsMapProps {
  /** Stores to pin — caller is responsible for pre-filtering to those with coordinates. */
  stores: StoreSearchResult[]
  userLat?: number
  userLng?: number
  onStoreClick: (store: StoreSearchResult) => void
  height?: string
}

export function SearchResultsMap({
  stores,
  userLat,
  userLng,
  onStoreClick,
  height = '400px',
}: SearchResultsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | undefined>(undefined)
  // Stable ref so marker clicks always call the latest navigate callback
  const onClickRef = useRef(onStoreClick)
  useEffect(() => { onClickRef.current = onStoreClick }, [onStoreClick])

  // Track markers by ref for direct O(1) clearing — no eachLayer traversal
  const storeMarkersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | undefined>(undefined)

  useEffect(() => {
    if (!containerRef.current) return
    if (stores.length === 0 && userLat == undefined) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapRef.current = map
    }

    const map = mapRef.current

    // Clear previous markers directly — no eachLayer traversal or instanceof checks
    for (const m of storeMarkersRef.current) m.remove()
    storeMarkersRef.current = []
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = undefined
    }

    const bounds: L.LatLngTuple[] = []

    // User location dot
    if (userLat != undefined && userLng != undefined) {
      bounds.push([userLat, userLng])
      const icon = L.divIcon({
        className: '',
        html: '<div style="background:#10b981;border-radius:50%;width:14px;height:14px;border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
      userMarkerRef.current = L.marker([userLat, userLng], { icon })
        .bindPopup('<strong style="font-size:13px">Your location</strong>')
        .addTo(map)
    }

    // Build O(1) id→store map for popup button handler (built once per render, not per click)
    const storeById = new Map(stores.map((s) => [s.id, s]))

    ;(window as any)._searchMapClick = (id: string) => {
      const store = storeById.get(id)
      if (store) onClickRef.current(store)
    }

    // Store pins — stores are pre-filtered to have coords, so no null checks needed
    for (const store of stores) {
      // Caller guarantees coords are present; cast avoids redundant Number() on already-number values
      const lat = store.latitude!
      const lng = store.longitude!
      bounds.push([lat, lng])

      const icon = L.divIcon({
        className: '',
        html: '<div style="background:#3b82f6;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.28);cursor:pointer;border:2px solid white">🏪</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const distHtml = store.distance != undefined
        ? `<div style="color:#6b7280;font-size:12px;margin-top:2px">${formatDistance(store.distance)} away</div>`
        : ''

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(
          `<div style="min-width:150px;font-family:inherit;line-height:1.4">
            <div style="font-weight:600;font-size:14px">${store.name}</div>
            ${distHtml}
            <div style="color:#6b7280;font-size:12px;margin-top:2px">~${store.prepTimeMin} min prep</div>
            <button
              style="margin-top:8px;padding:4px 12px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500"
              onclick="window._searchMapClick && window._searchMapClick('${store.id}')"
            >View menu →</button>
          </div>`,
          { closeButton: false },
        )
        .on('click', () => onClickRef.current(store))
        .addTo(map)

      storeMarkersRef.current.push(marker)
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 14)
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 14 })
    }

    setTimeout(() => map.invalidateSize(), 0)

    return () => {
      delete (window as any)._searchMapClick
    }
  }, [stores, userLat, userLng])

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
    },
    [],
  )

  if (stores.length === 0 && userLat == undefined) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-border bg-muted/40"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">No location data available for map view</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      className="overflow-hidden rounded-xl border border-border"
    />
  )
}
