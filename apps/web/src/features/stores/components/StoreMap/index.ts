/**
 * StoreMap Module Exports;
 * Centralized exports for all map-related components and services;
 */

// Main components;
export { default as StoreMap } from './StoreMap'
export { default as StoreMapRefactored } from './StoreMapRefactored'
export { StoreMapOptimized } from './StoreMapOptimized'
export { default as StoreMapUltraOptimized } from './StoreMapUltraOptimized'
export type { StoreMapProps } from './StoreMap'
export type { StoreMapOptimizedProps } from './StoreMapOptimized'
export type { StoreMapUltraOptimizedProps } from './StoreMapUltraOptimized'

// Sub-components;
export { MapController } from './components/MapController'
export { StoreMarker } from './components/StoreMarker'
export { OptimizedStoreMarkers } from './components/OptimizedStoreMarkers'
export { UserLocationMarker } from './components/UserLocationMarker'
export { MapLegend } from './components/MapLegend'
export { MapErrorBoundary } from './components/MapErrorBoundary'

// Hooks;
export { useMapCenter } from './hooks/useMapCenter'
export { useMapZoom } from './hooks/useMapZoom'
export { useOptimizedMapData } from './hooks/useOptimizedMapData'

// Services;
export { IconService } from './services/iconService'
export { OptimizedIconService } from './services/optimizedIconService'
export { ColorService } from './services/colorService'

// Utils;
export { PerformanceMonitor } from './utils/performanceMonitor'

// Types;
export type { MapControllerProps } from './components/MapController'
export type { StoreMarkerProps } from './components/StoreMarker'
export type { UserLocationMarkerProps } from './components/UserLocationMarker'
export type { MapLegendProps } from './components/MapLegend'
export type { MapErrorBoundaryProps, MapErrorBoundaryState } from './components/MapErrorBoundary'
export type { LocationData, MapCenterOptions } from './hooks/useMapCenter'
export type { MapZoomOptions } from './hooks/useMapZoom'
export type { CircleOptions } from './services/colorService'
export type { IconOptions } from './services/iconService'