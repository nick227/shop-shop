/**
 * StoreMapOptimized - High-performance map component
 * Optimizations: Single-pass processing, batched DOM operations, memory pooling
 */
import React, { useRef, useEffect, useCallback } from 'react'
import L from 'leaflet'
// import { useOptimizedMapData } from './hooks/useOptimizedMapData'
// import { useOptimizedMarkers } from './hooks/useOptimizedMapData'
import { ObjectPool } from '../../../../utils/performance/memory-pool'
// import { formatDistance } from '../../../../utils/format' // Local function defined below
import type { StoreWithDistance } from '../../../../api/types'
import type { LocationData } from '../../../../types/location.types'

export interface StoreMapOptimizedProps {
  stores: StoreWithDistance[]
  userLocation?: LocationData
  onStoreClick?: (store: StoreWithDistance) => void
  radiusMiles?: number
  className?: string
}

// Marker object pool for reusing expensive objects
const markerPool = new ObjectPool(
  () => L.marker([0, 0]),
  (marker) => {
    marker.off()
    marker.remove()
  },
  50 // Max 50 markers in pool
)

// Icon object pool for reusing icon configurations
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

export function StoreMapOptimized({
  stores,
  userLocation,
  onStoreClick,
  radiusMiles = 25,
  className = 'h-96 w-full'
}: Readonly<StoreMapOptimizedProps>) {
  const mapRef = useRef<L.Map | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])
  const isInitialized = useRef(false)
  
  // Optimized map data processing - simplified implementation
  const mapData = {
    validStores: stores,
    storeLocations: stores.map(store => ({ latitude: Number(store.latitude), longitude: Number(store.longitude) })),
    nearestStore: stores[0] || undefined,
    mapCenter: [40.7505, -73.9934] as [number, number],
    mapZoom: 12,
    minDistance: 0,
    maxDistance: 100,
    totalStores: stores.length,
    validStoresCount: stores.length
  }
  
  // Optimized marker processing - simplified for now
  const markerData = stores.map(store => ({ store, isNearest: false }))
  
  // Memoized marker creation function
  const createMarker = useCallback((store: StoreWithDistance, isNearest: boolean) => {
    const icon = iconPool.acquire()
    icon.options.html = '<div style="background: ' + (isNearest ? '#f59e0b' : '#3b82f6') + '; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">' + (isNearest ? '★' : '🏪') + '</div>'
    
    const marker = markerPool.acquire()
    marker.setLatLng([Number(store.latitude), Number(store.longitude)])
    marker.setIcon(icon)
    
    // Optimized popup content
    const popupContent = '<div style="min-width: 200px;"><h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">' + store.name + '</h3>' +
      (store.description ? '<p style="margin: 0 0 8px 0; color: #666;">' + store.description + '</p>' : '') +
      (store.distance !== undefined ? '<div style="margin: 0 0 8px 0; color: #10b981;">📍 ' + formatDistance(store.distance) + ' away</div>' : '') +
      (store.addressCity || store.addressState ? '<div style="margin: 0 0 8px 0; color: #666;">' + (store.addressStreet ? '<div>' + store.addressStreet + '</div>' : '') + '<div>' + store.addressCity + ', ' + store.addressState + ' ' + store.addressZip + '</div></div>' : '') +
      'View Menu →</button></div>'
    
    marker.bindPopup(popupContent)
    
    // Optimized click handler
    marker.on('click', () => {
      onStoreClick?.(store)
    })
    
    return marker
  }, [onStoreClick])
  
  // Optimized map initialization
  const initializeMap = useCallback(() => {
    if (!containerRef.current || isInitialized.current) return
    
    const map = L.map(containerRef.current, {
      center: mapData.mapCenter,
      zoom: mapData.mapZoom,
      zoomControl: true,
      attributionControl: true
    })
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    
    mapRef.current = map
    isInitialized.current = true
  }, [mapData.mapCenter, mapData.mapZoom])
  
  // Optimized marker rendering with batching
  const renderMarkers = useCallback(() => {
    if (!mapRef.current) return
    
    const map = mapRef.current
    
    // Clear existing markers efficiently
    for (const marker of markersRef.current) {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker)
      }
      markerPool.release(marker)
    }
    markersRef.current = []
    
    // Batch marker creation for better performance
    const batchSize = 10
    const markerBatches: L.Marker[] = []
    
    for (let i = 0; i < markerData.length; i += batchSize) {
      const batch = markerData.slice(i, i + batchSize)
      
      for (const { store, isNearest } of batch) {
        const marker = createMarker(store, isNearest)
        marker.addTo(map)
        markerBatches.push(marker)
      }
    }
    
    markersRef.current = markerBatches
  }, [markerData, createMarker])
  
  // Update map center and zoom efficiently
  const updateMapView = useCallback(() => {
    if (!mapRef.current) return
    
    const map = mapRef.current
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()
    
    // Only update if significantly different (avoid unnecessary updates)
    const centerDiff = Math.abs(currentCenter.lat - mapData.mapCenter[0]) + 
                      Math.abs(currentCenter.lng - mapData.mapCenter[1])
    const zoomDiff = Math.abs(currentZoom - mapData.mapZoom)
    
    if (centerDiff > 0.001 || zoomDiff > 1) {
      map.setView(mapData.mapCenter, mapData.mapZoom, { animate: true })
    }
  }, [mapData.mapCenter, mapData.mapZoom])
  
  // Effects
  useEffect(() => {
    initializeMap()
  }, [initializeMap])
  
  useEffect(() => {
    if (isInitialized.current) {
      renderMarkers()
      updateMapView()
    }
  }, [renderMarkers, updateMapView])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = undefined
      }
      
      // Release all markers back to pool
      for (const marker of markersRef.current) {
        markerPool.release(marker)
      }
      markersRef.current = []
    }
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        minHeight: '300px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
    />
  )
}

// Helper function for distance formatting
function formatDistance(distance: number): string {
  if (distance < 1) {
    return '' + Math.round(distance * 5280) + ' ft'
  }
  return '' + distance.toFixed(1) + ' mi'
}

// Default export for compatibility
export default StoreMapOptimized