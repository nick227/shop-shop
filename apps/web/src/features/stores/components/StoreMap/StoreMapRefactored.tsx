/**
 * StoreMapRefactored - Refactored map component with proper separation of concerns
 * Follows SRP: Each component has a single responsibility
 * Reusable: Components can be composed independently
 */
import { useEffect, useRef, useMemo, memo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import type { StoreWithDistance, StoreClickHandler } from '@api/types'
import { hasValidCoordinates } from '@utils/storeAccessors'
import { styles } from '@utils/tailwind-classes'
import { useMapCenter } from './hooks/useMapCenter'
import { useMapZoom } from './hooks/useMapZoom'
import { IconService } from './services/iconService'
import { MapController } from './components/MapController'
import { StoreMarker } from './components/StoreMarker'
import { UserLocationMarker } from './components/UserLocationMarker'
import { MapLegend } from './components/MapLegend'
import { MapErrorBoundary } from './components/MapErrorBoundary'

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

export interface StoreMapProps {
  stores: StoreWithDistance[]
  userLocation?: { latitude: number; longitude: number }
  radiusMiles?: number
  onStoreClick?: StoreClickHandler
  height?: string
}

function StoreMapRefactoredComponent({ 
  stores, 
  userLocation, 
  radiusMiles = 25,
  onStoreClick,
  height = '500px'
}: StoreMapProps) {
  const mapRef = useRef<L.Map>(null)
  
  // Memoize valid stores - use centralized validator to prevent NaN coordinates
  const validStores = useMemo(() => 
    stores.filter(hasValidCoordinates),
    [stores]
  )
  
  // Use custom hooks for map calculations
  const mapCenter = useMapCenter({ 
    userLocation, 
    stores: validStores.map(s => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) }))
  })
  const mapZoom = useMapZoom({ radiusMiles })
  
  // Find nearest store
  const nearestStore = useMemo(() => 
    validStores.length > 0 ? validStores[0] : null,
    [validStores]
  )
  
  // Get cached icons using service
  const storeIcon = IconService.getStoreIcon(false, styles)
  const nearestStoreIcon = IconService.getStoreIcon(true, styles)
  
  // Cleanup map on unmount to prevent memory leaks
  useEffect(() => {
    const currentMap = mapRef.current
    return () => {
      if (currentMap) {
        currentMap.remove()
      }
    }
  }, [])

  return (
    <MapErrorBoundary>
      <div className={styles['container']} style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className={styles['map']}
          ref={mapRef}
        >
          {/* Map tiles from OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map controller to update view */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* User location marker and radius circle */}
          {userLocation && (
            <UserLocationMarker 
              userLocation={userLocation as LocationCoordinates} 
              radiusMiles={radiusMiles}
            />
          )}

          {/* Store markers */}
          {validStores.map((store) => {
            const isNearest = nearestStore?.id === store.id
            const icon = isNearest ? nearestStoreIcon : storeIcon
            
            return (
              <StoreMarker
                key={store.id}
                store={store}
                isNearest={isNearest}
                onStoreClick={onStoreClick}
                icon={icon}
              />
            )
          })}
        </MapContainer>

        {/* Map legend */}
        <MapLegend 
          userLocation={userLocation as LocationCoordinates}
          storeCount={validStores.length}
          radiusMiles={radiusMiles}
        />
      </div>
    </MapErrorBoundary>
  )
}

// Memoize to prevent unnecessary re-renders
const StoreMapRefactored = memo(StoreMapRefactoredComponent)
export default StoreMapRefactored
export { StoreMapRefactored }
