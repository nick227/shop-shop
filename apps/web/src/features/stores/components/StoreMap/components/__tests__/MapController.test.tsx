/**
 * MapController Component Unit Tests;
 */
import { render } from '@testing-library/react'
import { MapContainer } from 'react-leaflet'
import { MapController } from '../MapController'

// Mock react-leaflet;
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  useMap: jest.fn()
}))

const mockUseMap = jest.fn()
jest.doMock('react-leaflet', () => ({
  ...jest.requireActual('react-leaflet'),
  useMap: mockUseMap
}))

describe('MapController', () => {
  const mockMap = {
    getCenter: jest.fn(),
    getZoom: jest.fn(),
    setView: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseMap.mockReturnValue(mockMap)
  })

  it('should update map view when center changes', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // Change center;
    rerender(
      <MapContainer center={[40.7589, -73.9851]} zoom={12}>
        <MapController center={[40.7589, -73.9851]} zoom={12} />
      </MapContainer>
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7589, -73.9851], 12)
  })

  it('should update map view when zoom changes', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // Change zoom;
    rerender(
      <MapContainer center={[40.7505, -73.9934]} zoom={15}>
        <MapController center={[40.7505, -73.9934]} zoom={15} />
      </MapContainer>
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7505, -73.9934], 15)
  })

  it('should not update map view when position and zoom are the same', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // Rerender with same props;
    rerender(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    expect(mockMap.setView).not.toHaveBeenCalled()
  })

  it('should handle small position changes within tolerance', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // Small change within tolerance (0.0001)
    rerender(
      <MapContainer center={[40.750_500_05, -73.993_400_05]} zoom={12}>
        <MapController center={[40.750_500_05, -73.993_400_05]} zoom={12} />
      </MapContainer>
    )

    expect(mockMap.setView).not.toHaveBeenCalled()
  })

  it('should update when position change exceeds tolerance', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // Change that exceeds tolerance;
    rerender(
      <MapContainer center={[40.7506, -73.9935]} zoom={12}>
        <MapController center={[40.7506, -73.9935]} zoom={12} />
      </MapContainer>
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7506, -73.9935], 12)
  })

  it('should return null (no visual output)', () => {
    const { container } = render(
      <MapContainer center={[40.7505, -73.9934]} zoom={12}>
        <MapController center={[40.7505, -73.9934]} zoom={12} />
      </MapContainer>
    )

    // MapController should not render any DOM elements;
    expect(container.firstChild).toBeNull()
  })
})
