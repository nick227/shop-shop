/**
 * The delivery area on a map: the store, its radius or zones, the zone being drawn (click to add a
 * corner, drag a corner to move it, click an edge's midpoint to add one, double-click a corner to
 * remove it), and an address being checked.
 */
import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from './zoneGeometry'

const MILE = 1609.344

export interface MapZone {
  readonly id: string
  readonly ring: LatLng[]
  readonly color: string
  readonly label: string
  readonly active: boolean
}

export interface DeliveryAreaMapProps {
  readonly store: LatLng | null
  readonly radiusMiles: number | null
  readonly zones: readonly MapZone[]
  /** The outline being drawn or reshaped, with its color. */
  readonly draft: { ring: LatLng[]; color: string; drawing: boolean } | null
  readonly onDraftChange: (ring: LatLng[]) => void
  readonly onSelectZone: (id: string) => void
  readonly pin: { at: LatLng; ok: boolean } | null
}

const storeIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#111827;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})
const vertexIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;border-radius:3px;background:#fff;border:2px solid ${color};box-shadow:0 1px 2px rgba(0,0,0,.35);cursor:grab"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
const midpointIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:10px;height:10px;border-radius:9999px;background:${color};opacity:.55;border:1px solid #fff;cursor:copy"></span>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
const pinIcon = (ok: boolean) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:${ok ? '#16a34a' : '#dc2626'};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  })

/** Frames everything that matters whenever `frameKey` changes. */
function Frame({ points, frameKey }: { points: LatLng[]; frameKey: string }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) map.setView(points[0], 13)
    else map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 15 })
    // Only reframe on purpose, not on every vertex drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameKey, map])
  return null
}

/** Keeps a checked address in view without losing the area around it. */
function ShowPin({ at }: { at: LatLng | null }) {
  const map = useMap()
  useEffect(() => {
    if (!at || map.getBounds().contains(at)) return
    map.fitBounds(map.getBounds().extend(at), { padding: [28, 28] })
  }, [at?.[0], at?.[1], map])
  return null
}

function ClickToAdd({ enabled, onAdd }: { enabled: boolean; onAdd: (point: LatLng) => void }) {
  const map = useMapEvents({
    click: (event) => {
      if (enabled) onAdd([event.latlng.lat, event.latlng.lng])
    },
  })
  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = enabled ? 'crosshair' : ''
    if (enabled) map.doubleClickZoom.disable()
    else map.doubleClickZoom.enable()
  }, [enabled, map])
  return null
}

function DraftOutline({ ring, color, drawing, onChange }: { ring: LatLng[]; color: string; drawing: boolean; onChange: (ring: LatLng[]) => void }) {
  const vertex = useMemo(() => vertexIcon(color), [color])
  const midpoint = useMemo(() => midpointIcon(color), [color])
  const closed = !drawing && ring.length >= 3
  return (
    <>
      {closed ? (
        <Polygon positions={ring} pathOptions={{ color, weight: 3, fillOpacity: 0.18 }} />
      ) : (
        <Polyline positions={ring} interactive={false} pathOptions={{ color, weight: 3, dashArray: '6 6' }} />
      )}
      {ring.map((point, index) => (
        <Marker
          key={`v-${index}`}
          position={point}
          icon={vertex}
          draggable
          keyboard={false}
          title={`Corner ${index + 1}`}
          eventHandlers={{
            drag: (event) => {
              const at = (event.target as L.Marker).getLatLng()
              onChange(ring.map((p, i) => (i === index ? [at.lat, at.lng] : p)))
            },
            dblclick: (event) => {
              L.DomEvent.stop(event)
              if (ring.length > 3) onChange(ring.filter((_, i) => i !== index))
            },
          }}
        />
      ))}
      {closed
        ? ring.map((point, index) => {
            const next = ring[(index + 1) % ring.length]
            const mid: LatLng = [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2]
            return (
              <Marker
                key={`m-${index}`}
                position={mid}
                icon={midpoint}
                keyboard={false}
                title="Add a corner here"
                eventHandlers={{
                  click: (event) => {
                    L.DomEvent.stop(event)
                    onChange([...ring.slice(0, index + 1), mid, ...ring.slice(index + 1)])
                  },
                }}
              />
            )
          })
        : null}
    </>
  )
}

export default function DeliveryAreaMap({ store, radiusMiles, zones, draft, onDraftChange, onSelectZone, pin }: DeliveryAreaMapProps) {
  const framed = useMemo(() => {
    const points: LatLng[] = []
    if (store) points.push(store)
    for (const zone of zones) points.push(...zone.ring)
    if (store && radiusMiles && zones.length === 0) {
      const dLat = radiusMiles / 69
      const dLng = radiusMiles / (69.172 * Math.cos((store[0] * Math.PI) / 180))
      points.push([store[0] + dLat, store[1] + dLng], [store[0] - dLat, store[1] - dLng])
    }
    return points
  }, [store, zones, radiusMiles])
  const frameKey = `${zones.map((z) => z.id).join(',')}|${store?.join(',')}|${zones.length === 0 ? radiusMiles : ''}`
  const center = framed[0] ?? ([39.5, -98.35] as LatLng)

  return (
    <MapContainer center={center} zoom={framed.length > 0 ? 12 : 4} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Frame points={framed} frameKey={frameKey} />
      <ClickToAdd enabled={Boolean(draft?.drawing)} onAdd={(point) => draft && onDraftChange([...draft.ring, point])} />
      {store && radiusMiles && radiusMiles > 0 && zones.every((z) => !z.active) && !draft ? (
        <Circle center={store} radius={radiusMiles * MILE} interactive={false} pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.1 }} />
      ) : null}
      {zones.map((zone) => (
        <Polygon
          key={`${zone.id}-${draft ? 'locked' : 'live'}`}
          positions={zone.ring}
          interactive={!draft}
          pathOptions={{
            color: zone.color,
            weight: 2,
            fillOpacity: zone.active ? 0.16 : 0.04,
            dashArray: zone.active ? undefined : '4 6',
          }}
          eventHandlers={{ click: () => !draft && onSelectZone(zone.id) }}
        >
          <Tooltip sticky>{zone.label}</Tooltip>
        </Polygon>
      ))}
      {draft ? <DraftOutline ring={draft.ring} color={draft.color} drawing={draft.drawing} onChange={onDraftChange} /> : null}
      {store ? (
        <Marker position={store} icon={storeIcon} keyboard={false} interactive={false}>
          <Tooltip direction="top" offset={[0, -8]}>Your store</Tooltip>
        </Marker>
      ) : null}
      <ShowPin at={pin?.at ?? null} />
      {pin ? <Marker position={pin.at} icon={pinIcon(pin.ok)} keyboard={false} interactive={false} /> : null}
    </MapContainer>
  )
}
