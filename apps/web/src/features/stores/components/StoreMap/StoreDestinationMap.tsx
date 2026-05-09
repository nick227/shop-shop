/**
 * StoreDestinationMap - display-only map showing a store and a destination pin.
 * No routing logic (no polylines, no directions API calls).
 */
import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { coerceValidLatLng } from '@shared/lib/utils/maps'

export interface StoreDestinationMapProps {
  readonly store: Readonly<{ latitude: number | string; longitude: number | string; label?: string }>
  readonly destination: Readonly<{ latitude: number | string; longitude: number | string; label?: string }>
  /** Optional driver / courier position (e.g. realtime courier ping). */
  readonly driver?: Readonly<{ latitude: number | string; longitude: number | string; label?: string }>
  readonly height?: string
}

export function StoreDestinationMap({ store, destination, driver, height = '260px' }: StoreDestinationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | undefined>(undefined)
  const layersRef = useRef<L.Layer[]>([])

  const storeLL = coerceValidLatLng(store)
  const destLL = coerceValidLatLng(destination)
  const driverLL = driver ? coerceValidLatLng(driver) : undefined

  useEffect(() => {
    if (!containerRef.current) return
    if (!storeLL || !destLL) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [storeLL.latitude, storeLL.longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false,
        renderer: L.svg()
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      mapRef.current = map
    }

    const map = mapRef.current

    // Clear previous layers (markers/bounds) but keep the tile layer.
    for (const layer of layersRef.current) {
      try {
        map.removeLayer(layer)
      } catch {}
    }
    layersRef.current = []

    const storeIcon = L.divIcon({
      className: 'custom-store-pin',
      html: '<div style="background:#2563eb;color:white;border-radius:999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);">🏪</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const destIcon = L.divIcon({
      className: 'custom-destination-pin',
      html: '<div style="background:#16a34a;color:white;border-radius:999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);">📍</div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    const storeMarker = L.marker([storeLL.latitude, storeLL.longitude], { icon: storeIcon })
      .addTo(map)
      .bindPopup('<strong>' + (store.label ?? 'Store') + '</strong>')

    const destMarker = L.marker([destLL.latitude, destLL.longitude], { icon: destIcon })
      .addTo(map)
      .bindPopup('<strong>' + (destination.label ?? 'Destination') + '</strong>')

    layersRef.current.push(storeMarker, destMarker)

    if (driverLL) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: '<div style="background:#ea580c;color:white;border-radius:999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);">🚚</div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      const driverMarker = L.marker([driverLL.latitude, driverLL.longitude], { icon: driverIcon })
        .addTo(map)
        .bindPopup('<strong>' + (driver?.label ?? 'Driver') + '</strong>')
      layersRef.current.push(driverMarker)
    }

    const boundsPoints: [number, number][] = [
      [storeLL.latitude, storeLL.longitude],
      [destLL.latitude, destLL.longitude],
    ]
    if (driverLL) {
      boundsPoints.push([driverLL.latitude, driverLL.longitude])
    }
    const bounds = L.latLngBounds(boundsPoints)
    map.fitBounds(bounds.pad(0.2))

    // Ensure tiles render correctly when shown in a modal/drawer.
    setTimeout(() => map.invalidateSize(), 0)
  }, [
    storeLL?.latitude,
    storeLL?.longitude,
    destLL?.latitude,
    destLL?.longitude,
    driverLL?.latitude,
    driverLL?.longitude,
    store.label,
    destination.label,
    driver?.label,
  ])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
    }
  }, [])

  if (!storeLL || !destLL) return null

  return <div ref={containerRef} style={{ height, width: '100%' }} />
}
