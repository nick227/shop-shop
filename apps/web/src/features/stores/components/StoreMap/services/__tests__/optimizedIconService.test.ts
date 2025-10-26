/**
 * OptimizedIconService Unit Tests;
 */
import { OptimizedIconService } from '../optimizedIconService'
import L from 'leaflet'

// Mock Leaflet;
jest.mock('leaflet', () => ({
  divIcon: jest.fn((options) => ({
    ...options,
    _isDivIcon: true
  }))
}))

// Mock performance.now;
const mockPerformanceNow = jest.fn()
Object.defineProperty(performance, 'now', {
  value: mockPerformanceNow,
  writable: true
})

describe('OptimizedIconService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPerformanceNow.mockReturnValue(1000)
    // Clear cache before each test;
    OptimizedIconService.clearCache()
  })

  afterEach(() => {
    OptimizedIconService.destroy()
  })

  describe('getIcon', () => {
    it('should create and cache a new icon', () => {
      const options = {
        className: 'test-marker',
        html: '<div>Test</div>'
      }

      const icon = OptimizedIconService.getIcon('test-key', options)

      expect(L.divIcon).toHaveBeenCalledWith(options)
      expect(icon).toBeDefined()
    })

    it('should return cached icon on subsequent calls', () => {
      const options = { className: 'test-marker' }
      
      const icon1 = OptimizedIconService.getIcon('test-key-2', options)
      const icon2 = OptimizedIconService.getIcon('test-key-2', options)

      expect(icon1).toBe(icon2)
      expect(L.divIcon).toHaveBeenCalledTimes(1)
    })

    it('should track access metadata', () => {
      const options = { className: 'test-marker' }
      
      OptimizedIconService.getIcon('test-key-3', options)
      OptimizedIconService.getIcon('test-key-3', options)

      const stats = OptimizedIconService.getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.hitRate).toBeGreaterThan(0)
    })
  })

  describe('getStoreIcons', () => {
    it('should return both regular and nearest icons', () => {
      const result = OptimizedIconService.getStoreIcons(10)

      expect(result.regular).toBeDefined()
      expect(result.nearest).toBeDefined()
      expect(result.regular).not.toBe(result.nearest)
    })

    it('should use custom styles when provided', () => {
      const customStyles = {
        marker: 'custom-marker-class',
        nearestMarker: 'custom-nearest-class'
      }

      const result = OptimizedIconService.getStoreIcons(10, customStyles)

      expect(result.regular).toBeDefined()
      expect(result.nearest).toBeDefined()
    })
  })

  describe('getStoreIcon', () => {
    it('should create regular store icon', () => {
      const icon = OptimizedIconService.getStoreIcon(false)

      expect(L.divIcon).toHaveBeenCalledWith({
        className: 'custom-store-marker',
        html: expect.stringContaining('🍽️'),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })
    })

    it('should create nearest store icon', () => {
      const icon = OptimizedIconService.getStoreIcon(true)

      expect(L.divIcon).toHaveBeenCalledWith({
        className: 'custom-store-marker',
        html: expect.stringContaining('🍽️'),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      })
    })
  })

  describe('getUserIcon', () => {
    it('should create user icon', () => {
      const icon = OptimizedIconService.getUserIcon()

      expect(L.divIcon).toHaveBeenCalledWith({
        className: 'custom-user-marker',
        html: expect.stringContaining('📍'),
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    })
  })

  describe('cache management', () => {
    it('should clear cache', () => {
      OptimizedIconService.getIcon('test-key', { className: 'test' })
      expect(OptimizedIconService.getCacheStats().size).toBe(1)

      OptimizedIconService.clearCache()
      expect(OptimizedIconService.getCacheStats().size).toBe(0)
    })

    it('should provide cache statistics', () => {
      OptimizedIconService.getIcon('test-key-1', { className: 'test1' })
      OptimizedIconService.getIcon('test-key-1', { className: 'test1' }) // Hit;
      OptimizedIconService.getIcon('test-key-2', { className: 'test2' }) // Miss;
      const stats = OptimizedIconService.getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(50)
      expect(stats.hitRate).toBeGreaterThan(0)
    })

    it('should destroy service and cleanup', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      
      OptimizedIconService.destroy()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
