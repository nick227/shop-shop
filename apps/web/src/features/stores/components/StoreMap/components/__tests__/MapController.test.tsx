// @ts-nocheck
/**
 * MapController Component Unit Tests;
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'

const mockUseMap = vi.fn()

vi.mock('react-leaflet', () => ({
  useMap: () => mockUseMap(),
}))

import { MapController } from '../MapController'

describe('MapController', () => {
  const mockMap = {
    getCenter: vi.fn(),
    getZoom: vi.fn(),
    setView: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMap.mockReturnValue(mockMap)
  })

  it('should update map view when center changes', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // Change center;
    rerender(
      <MapController center={[40.7589, -73.9851]} zoom={12} />
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7589, -73.9851], 12)
  })

  it('should update map view when zoom changes', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // Change zoom;
    rerender(
      <MapController center={[40.7505, -73.9934]} zoom={15} />
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7505, -73.9934], 15)
  })

  it('should not update map view when position and zoom are the same', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // Rerender with same props;
    rerender(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    expect(mockMap.setView).not.toHaveBeenCalled()
  })

  it('should handle small position changes within tolerance', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // Small change within tolerance (0.0001)
    rerender(
      <MapController center={[40.750_500_05, -73.993_400_05]} zoom={12} />
    )

    expect(mockMap.setView).not.toHaveBeenCalled()
  })

  it('should update when position change exceeds tolerance', () => {
    mockMap.getCenter.mockReturnValue({ lat: 40.7505, lng: -73.9934 })
    mockMap.getZoom.mockReturnValue(12)

    const { rerender } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // Change that exceeds tolerance;
    rerender(
      <MapController center={[40.7506, -73.9935]} zoom={12} />
    )

    expect(mockMap.setView).toHaveBeenCalledWith([40.7506, -73.9935], 12)
  })

  it('should return undefined (no visual output)', () => {
    const { container } = render(
      <MapController center={[40.7505, -73.9934]} zoom={12} />
    )

    // MapController should not render any DOM elements;
    expect(container.firstChild).toBeNull()
  })
})
