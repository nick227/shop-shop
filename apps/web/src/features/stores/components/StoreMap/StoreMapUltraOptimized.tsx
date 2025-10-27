/**
 * StoreMapUltraOptimized - Maximum performance map component
 * Focus: Single-pass processing, object pooling, early exit patterns
 */
import type { ErrorInfo, ReactNode} from 'react';
import { useEffect, useRef, useMemo, memo, Suspense, Component, useCallback } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreWithDistance, StoreClickHandler } from '../../../../api/backend-types'
import type { LocationCoordinates } from '../../../../types/component-props'
import { formatDistance } from '../../../../utils/format'
import { hasValidCoordinates } from '../../../../utils/storeAccessors'
import { styles } from '../../../../utils/tailwind-classes'
import { ObjectPool } from '../../../../utils/performance/memory-pool'
import { useMapData } from '../../../../hooks/useMapData'
import { UltraOptimizedStoreProcessor, UltraOptimizedPerformanceMonitor } from '../../../../utils/performance/ultra-optimized-loops'

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
let cachedSuccessColor: string | undefined = undefined
function getSuccessColor(): string {
  if (!cachedSuccessColor && typeof window !== 'undefined') {
    const style = getComputedStyle(document.documentElement)
    cachedSuccessColor = style.getPropertyValue('--color-success').trim() || '#10b981'
  }
  return cachedSuccessColor || '#10b981'
}

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

// Ultra-optimized Leaflet map component
function UltraOptimizedLeafletMap({ 
  center, 
  zoom, 
  mapRef,
  stores,
  userLocation,
  radiusMiles,
  onStoreClick
}: Readonly<{ 
  center: [number, number]
  zoom: number
  mapRef: React.MutableRefObject<L.Map | undefined>
  stores: StoreWithDistance[]
  userLocation?: LocationCoordinates
  radiusMiles?: number
  onStoreClick?: StoreClickHandler
}>) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | undefined>(undefined)
  const circleRef = useRef<L.Circle | undefined>(undefined)
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined)
  
  // Ultra-optimized store processor
  const storeProcessor = useMemo(() => new UltraOptimizedStoreProcessor(), [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const container = mapContainerRef.current
    if (!container.offsetWidth || !container.offsetHeight) {
      console.warn('Map container has no dimensions, skipping initialization')
      return
    }

    try {
      const map = L.map(container, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false,
        renderer: L.svg()
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      mapRef.current = map

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize()
          }
        })
        resizeObserverRef.current.observe(container)
      }

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

    const map = mapRef.current

    try {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current)
        userMarkerRef.current = undefined
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current)
        circleRef.current = undefined
      }

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="font-size: 20px;">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })

      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div><strong>Your Location</strong></div>')

      if (radiusMiles) {
        const radiusMeters = radiusMiles * 1609.34
        circleRef.current = L.circle([userLocation.latitude, userLocation.longitude], {
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

  // Ultra-optimized marker creation with object pooling
  const createMarker = useCallback((store: StoreWithDistance, isNearest: boolean) => {
    const icon = iconPool.acquire()
    icon.options.html = '<div style="background: ' + (isNearest ? '#f59e0b' : '#3b82f6') + '; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">' + (isNearest ? '★' : '🏪') + '</div>'
    
    const marker = markerPool.acquire()
    marker.setLatLng([Number(store.latitude), Number(store.longitude)])
    marker.setIcon(icon)
    
    const popupContent = '<div style="min-width: 200px;"><h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">' + store.name + '</h3>' +
      (store.description ? '<p style="margin: 0 0 8px 0; color: #666;">' + store.description + '</p>' : '') +
      (store.distance !== undefined ? '<div style="margin: 0 0 8px 0; color: #10b981;">📍 ' + formatDistance(store.distance) + ' away</div>' : '') +
      (store.addressCity || store.addressState ? '<div style="margin: 0 0 8px 0; color: #666;">' + (store.addressStreet ? '<div>' + store.addressStreet + '</div>' : '') + '<div>' + store.addressCity + ', ' + store.addressState + ' ' + store.addressZip + '</div></div>' : '') +
      'View Menu →</button></div>'
    
    marker.bindPopup(popupContent)
    marker.on('click', () => onStoreClick?.(store))
    
    return marker
  }, [onStoreClick])

  // Ultra-optimized store markers with single-pass processing
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

      // ULTRA-OPTIMIZED: Single-pass processing with performance monitoring
      const result = UltraOptimizedPerformanceMonitor.track('store-processing', () => {
        return storeProcessor.processStores(stores)
      })

      // Batch marker creation for better performance
      const batchSize = 10
      for (let i = 0; i < result.markerData.length; i += batchSize) {
        const endIndex = Math.min(i + batchSize, result.markerData.length)
        
        for (let j = i; j < endIndex; j++) {
          const markerData = result.markerData[j]
          if (!markerData) continue
          const marker = createMarker(markerData.store, markerData.isNearest)
          marker.addTo(map)
          markersRef.current.push(marker)
        }
      }
    } catch (error: unknown) {
      console.error('Failed to add store markers:', error)
    }
  }, [stores, createMarker, mapRef, storeProcessor])

  return (
    <div 
      ref={mapContainerRef}
      className={styles.map}
      style={{ height: '100%', width: '100%' }}
    />
  )
}

export interface StoreMapUltraOptimizedProps {
  stores: StoreWithDistance[]
  userLocation?: LocationCoordinates
  radiusMiles?: number
  onStoreClick?: StoreClickHandler
  height?: string
}

function StoreMapUltraOptimizedComponent({ 
  stores, 
  userLocation, 
  radiusMiles = 25,
  onStoreClick,
  height = '500px'
}: StoreMapUltraOptimizedProps) {
  
  // Use optimized map data hook for single-pass processing
  const mapData = useMapData({
    stores,
    userLocation: userLocation as any,
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
          <UltraOptimizedLeafletMap
            center={mapData.mapCenter}
            zoom={mapData.mapZoom}
            mapRef={mapRef}
            stores={mapData.validStores}
            userLocation={userLocation!}
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
const StoreMapUltraOptimized = memo(StoreMapUltraOptimizedComponent)
export default StoreMapUltraOptimized
export { StoreMapUltraOptimized }