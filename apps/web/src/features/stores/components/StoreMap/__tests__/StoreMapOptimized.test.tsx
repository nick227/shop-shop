/**
 * StoreMapOptimized Component Unit Tests
 */
import { render, screen } from '@testing-library/react'
import { StoreMapOptimized } from '../StoreMapOptimized'
import type { StoreWithDistance } from '@api/types'

// Mock all dependencies
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Circle: () => <div data-testid="circle" />
}))

jest.mock('leaflet', () => ({
  icon: jest.fn(),
  divIcon: jest.fn()
}))

jest.mock('@shared/lib/storeAccessors', () => ({
  hasValidCoordinates: jest.fn((store: StoreWithDistance) => 
    store.latitude !== undefined && store.longitude !== undefined
  )
}))

jest.mock('@shared/lib/tailwind-classes', () => ({
  styles: {
    container: 'container-class',
    map: 'map-class',
    legend: 'legend-class'
  }
}))

jest.mock('../services/optimizedIconService', () => ({
  OptimizedIconService: {
    getStoreIcons: jest.fn(() => ({
      regular: { _isRegularIcon: true },
      nearest: { _isNearestIcon: true }
    })),
    clearCache: jest.fn()
  }
}))

jest.mock('../hooks/useOptimizedMapData', () => ({
  useOptimizedMapData: jest.fn(() => ({
    validStores: [
      {
        id: '1',
        name: 'Test Store',
        latitude: 40.7505,
        longitude: -73.9934,
        distance: 0.5
      }
    ],
    nearestStore: {
      id: '1',
      name: 'Test Store',
      latitude: '40.7505',
      longitude: '-73.9934',
      distance: 0.5
    },
    mapCenter: [40.7505, -73.9934],
    mapZoom: 12
  }))
}))

jest.mock('../components/MapController', () => ({
  MapController: () => <div data-testid="map-controller" />
}))

jest.mock('../components/OptimizedStoreMarkers', () => ({
  OptimizedStoreMarkers: ({ stores }: { stores: StoreWithDistance[] }) => (
    <div data-testid="optimized-store-markers">
      {stores.map(store => (
        <div key={store.id} data-testid={'store-marker-' + store.id + ''}>
          {store.name}
        </div>
      ))}
    </div>
  )
}))

jest.mock('../components/UserLocationMarker', () => ({
  UserLocationMarker: () => <div data-testid="user-location-marker" />
}))

jest.mock('../components/MapLegend', () => ({
  MapLegend: ({ storeCount }: { storeCount: number }) => (
    <div data-testid="map-legend">
      Stores: {storeCount}
    </div>
  )
}))

jest.mock('../components/MapErrorBoundary', () => ({
  MapErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  )
}))

describe('StoreMapOptimized', () => {
  const mockStores: StoreWithDistance[] = [
    {
      id: '1',
      name: 'Test Store',
      latitude: '40.7505',
      longitude: '-73.9934',
      distance: 0.5,
      ownerUserId: 'user1',
      slug: 'test-store',
      description: 'Test store description',
      companyName: 'Test Company',
      taxId: '123456789',
      addressStreet: '123 Test St',
      addressCity: 'Test City',
      addressState: 'TS',
      addressZip: '12345',
      phone: '555-1234',
      email: 'test@store.com',
      website: 'https://teststore.com',
      hours: '9AM-5PM',
      rating: 4.5,
      reviewCount: 100,
      prepTimeMin: 30,
      deliveryFee: 2.99,
      minOrder: 15,
      serviceFeePercent: 10,
      deliveryRadius: 5,
      isOpen: true,
      isDeliveryAvailable: true,
      isPickupAvailable: true,
      categories: ['restaurant'],
      tags: ['fast-food'],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    } as unknown as StoreWithDistance
  ]

  const mockUserLocation = {
    latitude: 40.7128,
    longitude: -74.006,
    radiusMiles: 25,
    source: 'manual' as const
  }

  const mockOnStoreClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render map container with all components', () => {
    render(
      <StoreMapOptimized
        stores={mockStores}
        userLocation={mockUserLocation as any}
        radiusMiles={25}
        onStoreClick={mockOnStoreClick}
      />
    )

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument()
    expect(screen.getByTestId('map-controller')).toBeInTheDocument()
    expect(screen.getByTestId('user-location-marker')).toBeInTheDocument()
    expect(screen.getByTestId('optimized-store-markers')).toBeInTheDocument()
    expect(screen.getByTestId('map-legend')).toBeInTheDocument()
  })

  it('should render without user location', () => {
    render(
      <StoreMapOptimized
        stores={mockStores}
        radiusMiles={25}
        onStoreClick={mockOnStoreClick}
      />
    )

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.queryByTestId('user-location-marker')).not.toBeInTheDocument()
  })

  it('should apply custom height', () => {
    const { container } = render(
      <StoreMapOptimized
        stores={mockStores}
      />
    )

    const mapContainer = container.querySelector('.container-class')
    expect(mapContainer).toHaveStyle({ height: '600px' })
  })

  it('should use default height when not provided', () => {
    const { container } = render(
      <StoreMapOptimized
        stores={mockStores}
      />
    )

    const mapContainer = container.querySelector('.container-class')
    expect(mapContainer).toHaveStyle({ height: '500px' })
  })

  it('should pass correct props to OptimizedStoreMarkers', () => {
    render(
      <StoreMapOptimized
        stores={mockStores}
        onStoreClick={mockOnStoreClick}
      />
    )

    expect(screen.getByTestId('store-marker-1')).toBeInTheDocument()
    expect(screen.getByText('Test Store')).toBeInTheDocument()
  })

  it('should pass correct props to MapLegend', () => {
    render(
      <StoreMapOptimized
        stores={mockStores}
        userLocation={mockUserLocation as any}
        radiusMiles={25}
      />
    )

    expect(screen.getByText('Stores: 1')).toBeInTheDocument()
  })

  it('should handle empty stores array', () => {
    const { useOptimizedMapData } = require('../hooks/useOptimizedMapData')
    useOptimizedMapData.mockReturnValue({
      validStores: [],
      nearestStore: undefined,
      mapCenter: [40.7505, -73.9934],
      mapZoom: 12
    })

    render(
      <StoreMapOptimized
        stores={[]}
      />
    )

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('Stores: 0')).toBeInTheDocument()
  })

  it('should cleanup on unmount', () => {
    const { OptimizedIconService } = require('../services/optimizedIconService')
    const { unmount } = render(
      <StoreMapOptimized
        stores={mockStores}
      />
    )

    unmount()

    expect(OptimizedIconService.clearCache).toHaveBeenCalled()
  })

  it('should handle missing onStoreClick prop', () => {
    render(
      <StoreMapOptimized
        stores={mockStores}
      />
    )

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('should use default radiusMiles when not provided', () => {
    const { useOptimizedMapData } = require('../hooks/useOptimizedMapData')
    
    render(
      <StoreMapOptimized
        stores={mockStores}
      />
    )

    expect(useOptimizedMapData).toHaveBeenCalledWith({
      stores: mockStores,
      userLocation: undefined,
      radiusMiles: 25
    })
  })
})
