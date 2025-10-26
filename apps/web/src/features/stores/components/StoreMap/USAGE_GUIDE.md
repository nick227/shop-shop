# StoreMap Usage Guide

## Quick Start

### Basic Usage
```tsx
import { StoreMapRefactored } from '@features/stores/components/StoreMap'

function MyComponent() {
  return (
    <StoreMapRefactored 
      stores={stores}
      userLocation={userLocation}
      radiusMiles={25}
      onStoreClick={handleStoreClick}
      height="500px"
    />
  )
}
```

### Composed Usage (Advanced)
```tsx
import { 
  MapContainer, 
  TileLayer, 
  MapController, 
  StoreMarker, 
  UserLocationMarker, 
  MapLegend,
  useMapCenter,
  useMapZoom 
} from '@features/stores/components/StoreMap'

function CustomMap() {
  const center = useMapCenter({ userLocation, stores })
  const zoom = useMapZoom({ radiusMiles: 25 })
  
  return (
    <MapContainer center={center} zoom={zoom}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapController center={center} zoom={zoom} />
      <UserLocationMarker userLocation={userLocation} radiusMiles={25} />
      {stores.map(store => (
        <StoreMarker key={store.id} store={store} icon={getIcon(store)} />
      ))}
    </MapContainer>
    <MapLegend userLocation={userLocation} storeCount={stores.length} />
  )
}
```

## Component Reference

### Main Components

#### `StoreMapRefactored`
Main map component with all features included.

**Props:**
- `stores: StoreWithDistance[]` - Array of stores to display
- `userLocation?: { latitude: number; longitude: number }` - User's location
- `radiusMiles?: number` - Search radius in miles (default: 25)
- `onStoreClick?: StoreClickHandler` - Callback when store is clicked
- `height?: string` - Map height (default: '500px')

#### `StoreMapLazy`
SSR-safe wrapper for the main map component.

**Props:** Same as `StoreMapRefactored`

### Sub-Components

#### `MapController`
Controls map view programmatically.

**Props:**
- `center: [number, number]` - Map center coordinates
- `zoom: number` - Map zoom level

#### `StoreMarker`
Renders individual store markers.

**Props:**
- `store: StoreWithDistance` - Store data
- `isNearest: boolean` - Whether this is the nearest store
- `onStoreClick?: StoreClickHandler` - Click handler
- `icon: L.DivIcon` - Leaflet icon

#### `UserLocationMarker`
Renders user location marker and radius circle.

**Props:**
- `userLocation: { latitude: number; longitude: number }` - User location
- `radiusMiles?: number` - Search radius

#### `MapLegend`
Renders map legend with counts and information.

**Props:**
- `userLocation?: { latitude: number; longitude: number }` - User location
- `storeCount: number` - Number of stores
- `radiusMiles?: number` - Search radius

#### `MapErrorBoundary`
Error boundary for map components.

**Props:**
- `children: ReactNode` - Map components
- `fallback?: ReactNode` - Custom error fallback
- `onError?: (error: Error, errorInfo: any) => void` - Error handler

### Hooks

#### `useMapCenter`
Calculates map center coordinates.

```tsx
const center = useMapCenter({ 
  userLocation, 
  stores: storeLocations,
  defaultCenter: [40.7505, -73.9934] // NYC
})
```

#### `useMapZoom`
Calculates map zoom level based on radius.

```tsx
const zoom = useMapZoom({ 
  radiusMiles: 25,
  defaultZoom: 12 
})
```

### Services

#### `IconService`
Manages map icons with caching.

```tsx
// Get store icon
const storeIcon = IconService.getStoreIcon(false, styles)
const nearestIcon = IconService.getStoreIcon(true, styles)

// Get user icon
const userIcon = IconService.getUserIcon(styles)

// Get custom icon
const customIcon = IconService.getIcon('custom', {
  className: 'my-marker',
  html: '<div>📍</div>',
  iconSize: [30, 30]
})
```

#### `ColorService`
Manages map colors and CSS variables.

```tsx
// Get success color
const color = ColorService.getSuccessColor()

// Get circle options
const circleOptions = ColorService.getCircleOptions('#ff0000')
```

## Performance Optimizations

### Icon Caching
Icons are automatically cached to prevent recreation:
```tsx
// Icons are cached by key, so multiple calls return the same instance
const icon1 = IconService.getStoreIcon(false, styles)
const icon2 = IconService.getStoreIcon(false, styles) // Same instance
```

### Memoization
Components use React.memo and useMemo for optimal performance:
```tsx
// Hooks are memoized
const center = useMapCenter({ userLocation, stores }) // Only recalculates when dependencies change
const zoom = useMapZoom({ radiusMiles }) // Only recalculates when radiusMiles changes
```

### Error Boundaries
All map components are wrapped in error boundaries for graceful failure:
```tsx
<MapErrorBoundary onError={(error) => console.error('Map error:', error)}>
  <StoreMapRefactored {...props} />
</MapErrorBoundary>
```

## Customization

### Custom Styles
```tsx
const customStyles = {
  marker: 'w-10 h-10 bg-red-500 rounded-full',
  nearestMarker: 'ring-4 ring-yellow-400',
  markerIcon: 'text-2xl',
  userMarker: 'w-6 h-6 bg-blue-500'
}

const icon = IconService.getStoreIcon(false, customStyles)
```

### Custom Icons
```tsx
const customIcon = IconService.getIcon('my-icon', {
  className: 'custom-marker',
  html: '<div class="my-marker">🏪</div>',
  iconSize: [50, 50],
  iconAnchor: [25, 50]
})
```

### Custom Colors
```tsx
const circleOptions = ColorService.getCircleOptions('#ff6b6b')
```

## Error Handling

### Built-in Error Boundary
```tsx
<MapErrorBoundary 
  fallback={<div>Custom error message</div>}
  onError={(error) => reportError(error)}
>
  <StoreMapRefactored {...props} />
</MapErrorBoundary>
```

### Manual Error Handling
```tsx
try {
  const icon = IconService.getStoreIcon(false, styles)
} catch (error) {
  console.error('Icon creation failed:', error)
}
```

## Best Practices

### 1. Use Lazy Loading for SSR
```tsx
import { StoreMapLazy } from '@features/stores/components/StoreMap'

// Always use StoreMapLazy in SSR environments
<StoreMapLazy {...props} />
```

### 2. Memoize Props
```tsx
const memoizedStores = useMemo(() => stores, [stores])
const memoizedUserLocation = useMemo(() => userLocation, [userLocation])

<StoreMapRefactored 
  stores={memoizedStores}
  userLocation={memoizedUserLocation}
/>
```

### 3. Handle Loading States
```tsx
{isLoading ? (
  <div className="h-[500px] bg-gray-200 flex items-center justify-center">
    <Spinner />
  </div>
) : (
  <StoreMapRefactored {...props} />
)}
```

### 4. Validate Data
```tsx
const validStores = stores.filter(hasValidCoordinates)
<StoreMapRefactored stores={validStores} />
```

This architecture provides a robust, performant, and highly customizable map system that follows React best practices and proper separation of concerns.
