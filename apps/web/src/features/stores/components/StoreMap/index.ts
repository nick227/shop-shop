/**
 * StoreMap Module Exports;
 * Centralized exports for all map-related components and services;
 */

// Main components;
export { StoreDestinationMap } from './StoreDestinationMap'
export type { StoreMapProps } from './StoreMap'

// Sub-components;
export { MapController } from './components/MapController'
export { StoreMarker } from './components/StoreMarker'
export { UserLocationMarker } from './components/UserLocationMarker'
export { MapLegend } from './components/MapLegend'
export { MapErrorBoundary } from './components/MapErrorBoundary'

// Hooks;
export { useMapCenter } from './hooks/useMapCenter'
export { useMapZoom } from './hooks/useMapZoom'

// Services;
export { IconService } from './services/iconService'
export { ColorService } from './services/colorService'

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
