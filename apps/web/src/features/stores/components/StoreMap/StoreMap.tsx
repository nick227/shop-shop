/**
 * StoreMap - High-performance interactive map with optimized rendering
 * Performance: Object pooling, single-pass processing, batched DOM operations
 */
import type { ErrorInfo, ReactNode} from 'react';
import { useEffect, useRef, memo, Suspense, Component, useCallback } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreWithDistance, StoreClickHandler } from '../../../../api/backend-types'
import type { LocationCoordinates } from '../../../../types/component-props'
import { formatDistance } from '../../../../utils/format'
import { hasValidCoordinates } from '../../../../utils/storeAccessors'
import { styles } from '../../../../utils/tailwind-classes'
import { ObjectPool } from '../../../../utils/memory/ObjectPool'
import { useMapData } from '../../../../hooks/useMapData'

// Object pools for marker and icon reuse (performance optimization)
const markerPool = new ObjectPool(
  () => L.marker([0, 0]),
  (marker) => {
    marker.off()
    marker.remove()
  },
  50 // Max 50 markers in pool
)

const iconPool = new ObjectPool(
  () => L.divIcon({
    className: 'custom-store-marker',
    html: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  }),
  (icon) => {
    // Reset icon properties
    icon.options.html = ''
    icon.options.className = 'custom-store-marker'
  },
  50
)

// Color singleton (performance optimization - single DOM query)
// let cachedSuccessColor: string | undefined



// Error boundary for map components
class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Map component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.map} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Map temporarily unavailable</div>
        </div>
      )
    }

    return this.props.children
  }
}

// Pure Leaflet map component - no React Leaflet Context issues
function PureLeafletMap({ 
  center, 
  zoom, 
  mapRef,
  stores,
  userLocation,
  radiusMiles,
  onStoreClick
}: { 
  readonly center: [number, number]
  readonly zoom: number
  readonly mapRef: React.MutableRefObject<L.Map | undefined>
  readonly stores: StoreWithDistance[]
  readonly userLocation?: LocationCoordinates
  readonly radiusMiles?: number
  readonly onStoreClick?: StoreClickHandler
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | undefined>(undefined)
  const circleRef = useRef<L.Circle | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Ensure the container has proper dimensions
    const container = mapContainerRef.current
    if (!container.offsetWidth || !container.offsetHeight) {
      console.warn('Map container has no dimensions, skipping initialization')
      return
    }

    // Validate center coordinates before creating map
    if (!center || !Array.isArray(center) || center.length !== 2 || 
        typeof center[0] !== 'number' || typeof center[1] !== 'number' ||
        Number.isNaN(center[0]) || Number.isNaN(center[1])) {
      console.error('Invalid center coordinates for map:', center)
      console.error('Map data context:', { stores, userLocation, radiusMiles })
      return
    }

    try {
      const map = L.map(container, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
        // Prevent positioning errors by ensuring proper initialization
        preferCanvas: false,
        renderer: L.svg()
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Store map reference
      mapRef.current = map

      // Force a resize to ensure proper positioning
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)

      // Set up resize observer to handle container size changes
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize()
          }
        })
        resizeObserverRef.current.observe(container)
      }

      // Cleanup
      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect()
          resizeObserverRef.current = undefined
        }
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = undefined
        }
      }
    } catch (error: unknown) {
      console.error('Failed to initialize map:', error)
    }
  }, [])

  // Update map view when props change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom)
    }
  }, [center, zoom, mapRef])

  // Add user location marker and circle
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    // Validate user location coordinates
    const lat = Number(userLocation.latitude)
    const lng = Number(userLocation.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.error('Invalid user location coordinates:', userLocation)
      return
    }

    const map = mapRef.current

    try {
      // Remove existing user marker and circle
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = undefined
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
        circleRef.current = undefined
      }

      // Add user location marker
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="font-size: 20px;">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })

      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div><strong>Your Location</strong></div>')

      // Add search radius circle
      if (radiusMiles) {
        const radiusMeters = radiusMiles * 1609.34 // Convert miles to meters
        circleRef.current = L.circle([lat, lng], {
          radius: radiusMeters,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(map)
      }
    } catch (error: unknown) {
      console.error('Failed to add user location marker:', error)
    }
  }, [userLocation, radiusMiles, mapRef])

  // Optimized marker creation with object pooling
  const createMarker = useCallback((store: StoreWithDistance, isNearest: boolean) => {
    // Validate store coordinates
    const lat = Number(store.latitude)
    const lng = Number(store.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      console.error('Invalid store coordinates:', store)
      return null
    }

    const icon = iconPool.acquire()
    icon.options.html = '<div style="background: ' + (isNearest ? '#f59e0b' : '#3b82f6') + '; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">' + (isNearest ? '★' : '🏪') + '</div>'
    
    const marker = markerPool.acquire()
    marker.setLatLng([lat, lng])
    marker.setIcon(icon)
    
    // Optimized popup content
    const popupContent = '<div style="min-width: 200px;"><h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">' + store.name + '</h3>' +
      (store.description ? '<p style="margin: 0 0 8px 0; color: #666;">' + store.description + '</p>' : '') +
      (store.distance !== undefined ? '<div style="margin: 0 0 8px 0; color: #10b981;">📍 ' + formatDistance(store.distance) + ' away</div>' : '') +
      (store.addressCity || store.addressState ? '<div style="margin: 0 0 8px 0; color: #666;">' + (store.addressStreet ? '<div>' + store.addressStreet + '</div>' : '') + '<div>' + store.addressCity + ', ' + store.addressState + ' ' + store.addressZip + '</div></div>' : '') +
      '<button onclick="window.storeClick && window.storeClick(\'' + store.id + '\')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">View Menu →</button></div>'
    
    marker.bindPopup(popupContent)
    marker.on('click', () => onStoreClick?.(store))
    
    return marker
  }, [onStoreClick])

  // Add store markers with optimized processing
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    try {
      // Clear existing markers and return to pool
      for (const marker of markersRef.current) {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker)
        }
        markerPool.release(marker)
      }
      markersRef.current = []

      // OPTIMIZED: Pre-calculate nearest distance to avoid O(n²) complexity
      let nearestDistance = Infinity
      for (const store of stores) {
        if (store.distance !== undefined && store.distance < nearestDistance) {
          nearestDistance = store.distance
        }
      }

      // OPTIMIZED: Single-pass processing with pre-calculated nearest distance
      const validStores: StoreWithDistance[] = []
      
      // Single pass: filter valid stores and find nearest
      for (const store of stores) {
        if (!hasValidCoordinates(store)) continue
        
        validStores.push(store)
        if (store.distance !== undefined && store.distance < nearestDistance) {
          nearestDistance = store.distance
        }
      }

      // Batch marker creation for better performance
      const batchSize = 10
      for (let i = 0; i < validStores.length; i += batchSize) {
        const batch = validStores.slice(i, i + batchSize)
        
        for (const store of batch) {
          const isNearest = store.distance !== undefined && store.distance === nearestDistance
          const marker = createMarker(store, isNearest)
          if (marker) {
            marker.addTo(map)
            markersRef.current.push(marker)
          }
        }
      }
    } catch (error: unknown) {
      console.error('Failed to add store markers:', error)
    }
  }, [stores, createMarker, mapRef])

  return (
    <div 
      ref={mapContainerRef}
      className={styles.map}
      style={{ height: '100%', width: '100%' }}
    />
  )
}

export interface StoreMapProps {
  readonly stores: StoreWithDistance[]
  readonly userLocation?: LocationCoordinates
  readonly radiusMiles?: number
  readonly onStoreClick?: StoreClickHandler
  readonly height?: string
}

function StoreMapComponent({ 
  stores, 
  userLocation, 
  radiusMiles = 25,
  onStoreClick,
  height = '500px'
}: StoreMapProps) {
  
  // Use optimized map data hook for single-pass processing
  const mapData = useMapData({
    stores,
    userLocation: userLocation ? {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radiusMiles: radiusMiles || 25,
      source: 'geolocation' as const
    } : undefined,
    radiusMiles,
    defaultCenter: [40.7505, -73.9934],
    defaultZoom: 12
  })

  // Map reference for direct Leaflet control
  const mapRef = useRef<L.Map | undefined>(undefined)
  

  return (
    <div className={styles.container} style={{ height }}>
      <Suspense fallback={<div className={styles.map} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>}>
        <MapErrorBoundary>
          <PureLeafletMap
            center={mapData.mapCenter}
            zoom={mapData.mapZoom}
            mapRef={mapRef}
            stores={mapData.validStores}
            userLocation={userLocation}
            radiusMiles={radiusMiles}
            onStoreClick={onStoreClick}
          />
        </MapErrorBoundary>
      </Suspense>

      {/* Map legend */}
      <div className={styles.legend}>
        {userLocation && (
          <div className={styles.legendItem}>
            <span className={styles.legendIcon}>📍</span>
            <span>Your Location</span>
          </div>
        )}
        <div className={styles.legendItem}>
          <span className={styles.legendIcon}>🍽️</span>
          <span>Restaurants ({mapData.validStoresCount})</span>
        </div>
        {userLocation && radiusMiles && (
          <div className={styles.legendItem}>
            <span className={styles.legendCircle}></span>
            <span>{radiusMiles} mi radius</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
const StoreMap = memo(StoreMapComponent)
export default StoreMap
export { StoreMap }

