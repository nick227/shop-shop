/**
 * IconService Unit Tests;
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('leaflet', () => {
  const divIcon = vi.fn((options: unknown) => ({
    ...(options as Record<string, unknown>),
    _isDivIcon: true,
  }))

  return {
    __esModule: true,
    default: { divIcon },
    divIcon,
  }
})

import { IconService } from '../iconService'
import L from 'leaflet'

describe('IconService', () => {
  beforeEach(() => {
    // Clear any existing cache;
    vi.clearAllMocks()
    IconService.clearCache()
  })

  describe('getIcon', () => {
    it('should create and cache a new icon', () => {
      const options = {
        className: 'test-marker',
        html: '<div>Test</div>',
        iconSize: [30, 30] as [number, number],
        iconAnchor: [15, 15] as [number, number],
        popupAnchor: [0, -15] as [number, number]
      }

      const icon = IconService.getIcon('test-key', options)

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining(options))
      expect(icon).toBeDefined()
    })

    it('should return cached icon on subsequent calls', () => {
      const options = { className: 'test-marker' }
      
      const icon1 = IconService.getIcon('test-key-2', options)
      const icon2 = IconService.getIcon('test-key-2', options)

      expect(icon1).toBe(icon2)
      expect(L.divIcon).toHaveBeenCalledTimes(1)
    })

    it('should use default values when options are not provided', () => {
      const icon = IconService.getIcon('test-key-3', {})

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-marker',
        html: '<div>📍</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      }))
    })
  })

  describe('getStoreIcon', () => {
    it('should create regular store icon', () => {
      const icon = IconService.getStoreIcon(false)

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-store-marker',
        html: expect.stringContaining('🍽️'),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      }))
    })

    it('should create nearest store icon', () => {
      const icon = IconService.getStoreIcon(true)

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-store-marker',
        html: expect.stringContaining('🍽️'),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      }))
    })

    it('should use custom styles when provided', () => {
      const customStyles = {
        marker: 'custom-marker-class',
        nearestMarker: 'custom-nearest-class',
        markerIcon: 'custom-icon-class'
      }

      const icon = IconService.getStoreIcon(true, customStyles)

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-store-marker',
        html: expect.stringContaining('custom-marker-class'),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      }))
    })
  })

  describe('getUserIcon', () => {
    it('should create user icon with default styles', () => {
      const icon = IconService.getUserIcon()

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-user-marker',
        html: expect.stringContaining('📍'),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }))
    })

    it('should use custom styles when provided', () => {
      const customStyles = {
        userMarker: 'custom-user-class'
      }

      const icon = IconService.getUserIcon(customStyles)

      expect(L.divIcon).toHaveBeenCalledWith(expect.objectContaining({
        className: 'custom-user-marker',
        html: expect.stringContaining('custom-user-class'),
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }))
    })
  })
})
