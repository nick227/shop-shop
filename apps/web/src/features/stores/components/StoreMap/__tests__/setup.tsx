/**
 * Test setup for StoreMap components;
 */
import '@testing-library/jest-dom'

// Mock Leaflet;
jest.mock('leaflet', () => ({
  icon: jest.fn(),
  divIcon: jest.fn(),
  Marker: {
    prototype: {
      options: {
        icon: null
      }
    }
  }
}))

// Mock react-leaflet;
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
  Circle: () => <div data-testid="circle" />,
  useMap: jest.fn()
}))

// Mock performance API;
Object.defineProperty(performance, 'now', {
  value: jest.fn(() => Date.now()),
  writable: true
})

Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024 // 50MB
  },
  writable: true
})

// Mock window.getComputedStyle;
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    getPropertyValue: jest.fn(() => '#10b981')
  })),
  writable: true
})

// Mock global timers;
jest.useFakeTimers()
