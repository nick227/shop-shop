import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface MapPoint {
  readonly id: string
  readonly name: string
  readonly latitude: number
  readonly longitude: number
}

export function NeighborhoodMap({
  points,
  userLat,
  userLng,
  onSelect,
}: {
  readonly points: readonly MapPoint[]
  readonly userLat?: number
  readonly userLng?: number
  readonly onSelect: (id: string) => void
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | undefined>(undefined)
  const selectRef = useRef(onSelect)
  useEffect(() => { selectRef.current = onSelect }, [onSelect])

  useEffect(() => {
    const node = nodeRef.current
    if (!node || (points.length === 0 && userLat == undefined)) return
    if (!mapRef.current) {
      const map = L.map(node, { zoomControl: true, attributionControl: false })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
      mapRef.current = map
    }
    const map = mapRef.current
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) layer.remove()
    })
    const bounds: L.LatLngTuple[] = []
    if (userLat != undefined && userLng != undefined) {
      bounds.push([userLat, userLng])
      L.marker([userLat, userLng], {
        icon: L.divIcon({
          className: '',
          html: '<span class="map-you"></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      }).addTo(map)
    }
    for (const point of points) {
      bounds.push([point.latitude, point.longitude])
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
    if (bounds.length === 1) map.setView(bounds[0], 13)
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
    window.setTimeout(() => map.invalidateSize(), 60)
  }, [points, userLat, userLng])

  return <div ref={nodeRef} className="discover-map" />
}
