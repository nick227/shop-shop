import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mapFrame } from './mapFrame'

export interface MapPoint {
  readonly id: string
  readonly name: string
  readonly latitude: number
  readonly longitude: number
}

export function NeighborhoodMap({
  points,
  center,
  radiusMiles,
  showYou = false,
  onSelect,
}: {
  readonly points: readonly MapPoint[]
  /** The page's place: a neighborhood or ZIP centroid, or the shopper's position. */
  readonly center?: { readonly latitude?: number; readonly longitude?: number }
  readonly radiusMiles?: number
  /** Only when `center` is the shopper's own position. A neighborhood centroid is not "you". */
  readonly showYou?: boolean
  readonly onSelect: (id: string) => void
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | undefined>(undefined)
  const selectRef = useRef(onSelect)
  useEffect(() => { selectRef.current = onSelect }, [onSelect])
  const centerLat = center?.latitude
  const centerLng = center?.longitude

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    if (!mapRef.current) {
      const map = L.map(node, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapRef.current = map
    }
    const map = mapRef.current
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
    const frame = mapFrame({ points, center: { latitude: centerLat, longitude: centerLng }, radiusMiles })
    if (showYou && frame.hasPlace) {
      L.marker([frame.anchor.latitude, frame.anchor.longitude], {
        icon: L.divIcon({
          className: '',
          html: '<span class="map-you"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        title: 'Your location',
      }).addTo(map)
    }
    for (const point of frame.pins) {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: L.divIcon({
          className: '',
          html: '<span class="map-pin"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      })
      marker.on('click', () => selectRef.current(point.id))
      marker.bindTooltip(point.name, { direction: 'top', offset: [0, -8] })
      marker.addTo(map)
    }
    if (frame.view.kind === 'center') map.setView([frame.view.at.latitude, frame.view.at.longitude], frame.view.zoom)
    else map.fitBounds(frame.view.bounds.map((point) => [point.latitude, point.longitude] as L.LatLngTuple), { padding: [28, 28], maxZoom: 14 })
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [points, centerLat, centerLng, radiusMiles, showYou])

  // The panel changes size between the hero, results, and expanded map views. Leaflet keeps its
  // center and zoom through invalidateSize, so expanding does not lose the reader's place.
  useEffect(() => {
    const node = nodeRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize())
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return <div ref={nodeRef} className="discover-map" role="region" aria-label="Map of places in this area" />
}
