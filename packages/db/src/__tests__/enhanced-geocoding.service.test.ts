/**
 * Unit tests for EnhancedGeocodingService
 * Tests integration between cache and API adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnhancedGeocodingService, GeocodingConfig } from '../services/enhanced-geocoding.service'
import { GeocodingCacheService } from '../services/geocoding-cache.service'

// Mock the geocoding adapter
const mockGeocodingAdapter = {
  geocodeZipCode: vi.fn(),
  geocodeCityState: vi.fn(),
  geocodeAddress: vi.fn(),
  reverseGeocode: vi.fn()
}

// Mock the cache service
const mockCacheService = {
  getCachedResult: vi.fn(),
  cacheResult: vi.fn(),
  getCacheStats: vi.fn(),
  clearExpiredEntries: vi.fn(),
  populateCommonZips: vi.fn()
}

// Mock Prisma client
const mockPrisma = {
  geocodingCache: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn()
  }
}

// Mock the geocoding adapter creation
vi.mock('../adapters/geocoding.adapter', () => ({
  createGeocodingAdapter: vi.fn(() => mockGeocodingAdapter)
}))

// Mock the cache service creation
vi.mock('../services/geocoding-cache.service', () => ({
  GeocodingCacheService: vi.fn(() => mockCacheService)
}))

describe('EnhancedGeocodingService', () => {
  let service: EnhancedGeocodingService
  let config: GeocodingConfig

  beforeEach(() => {
    vi.clearAllMocks()
    
    config = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.positionstack.com/v1',
      enableCache: true,
      cacheTTLHours: 24 * 30
    }

    service = new EnhancedGeocodingService(mockPrisma as any, config)
  })

  describe('geocodeZip', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high' as const,
        source: 'positionstack' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(cachedResult)

      const result = await service.geocodeZip('10018')

      expect(result).toEqual(cachedResult)
      expect(mockCacheService.getCachedResult).toHaveBeenCalledWith({
        queryType: 'zip',
        queryValue: '10018'
      })
      expect(mockGeocodingAdapter.geocodeZipCode).not.toHaveBeenCalled()
    })

    it('should call API and cache result on cache miss', async () => {
      const apiResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(apiResult)
      mockCacheService.cacheResult.mockResolvedValue(undefined)

      const result = await service.geocodeZip('10018')

      expect(result).toEqual({
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack'
      })

      expect(mockGeocodingAdapter.geocodeZipCode).toHaveBeenCalledWith('10018')
      expect(mockCacheService.cacheResult).toHaveBeenCalledWith(
        { queryType: 'zip', queryValue: '10018' },
        expect.objectContaining({
          latitude: 40.7505,
          longitude: -73.9934,
          source: 'positionstack'
        }),
        24 * 30
      )
    })

    it('should return null when API returns null', async () => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(null)

      const result = await service.geocodeZip('99999')

      expect(result).toBeNull()
      expect(mockCacheService.cacheResult).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('API Error'))

      const result = await service.geocodeZip('10018')

      expect(result).toBeNull()
      expect(mockCacheService.cacheResult).not.toHaveBeenCalled()
    })

    it('should skip cache when disabled', async () => {
      const serviceWithCacheDisabled = new EnhancedGeocodingService(mockPrisma as any, {
        ...config,
        enableCache: false
      })

      const apiResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high' as const
      }

      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(apiResult)

      const result = await serviceWithCacheDisabled.geocodeZip('10018')

      expect(result).toEqual({
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack'
      })

      expect(mockCacheService.getCachedResult).not.toHaveBeenCalled()
      expect(mockCacheService.cacheResult).not.toHaveBeenCalled()
    })
  })

  describe('geocodeCity', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        latitude: 47.6062,
        longitude: -122.3321,
        city: 'Seattle',
        state: 'WA',
        country: 'US',
        formattedAddress: 'Seattle, WA',
        confidence: 'high' as const,
        source: 'positionstack' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(cachedResult)

      const result = await service.geocodeCity('Seattle', 'WA')

      expect(result).toEqual(cachedResult)
      expect(mockCacheService.getCachedResult).toHaveBeenCalledWith({
        queryType: 'city',
        queryValue: 'Seattle, WA'
      })
    })

    it('should call API and cache result on cache miss', async () => {
      const apiResult = {
        latitude: 47.6062,
        longitude: -122.3321,
        city: 'Seattle',
        state: 'WA',
        country: 'US',
        formattedAddress: 'Seattle, WA',
        confidence: 'high' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeCityState.mockResolvedValue(apiResult)
      mockCacheService.cacheResult.mockResolvedValue(undefined)

      const result = await service.geocodeCity('Seattle', 'WA')

      expect(result).toEqual({
        latitude: 47.6062,
        longitude: -122.3321,
        city: 'Seattle',
        state: 'WA',
        country: 'US',
        formattedAddress: 'Seattle, WA',
        confidence: 'high',
        source: 'positionstack'
      })

      expect(mockGeocodingAdapter.geocodeCityState).toHaveBeenCalledWith('Seattle', 'WA')
      expect(mockCacheService.cacheResult).toHaveBeenCalled()
    })
  })

  describe('geocodeAddress', () => {
    it('should return cached result when available', async () => {
      const cachedResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: '123 Broadway, New York, NY 10018',
        confidence: 'high' as const,
        source: 'positionstack' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(cachedResult)

      const result = await service.geocodeAddress('123 Broadway, New York, NY 10018')

      expect(result).toEqual(cachedResult)
      expect(mockCacheService.getCachedResult).toHaveBeenCalledWith({
        queryType: 'address',
        queryValue: '123 Broadway, New York, NY 10018'
      })
    })

    it('should call API and cache result on cache miss', async () => {
      const apiResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: '123 Broadway, New York, NY 10018',
        confidence: 'high' as const
      }

      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeAddress.mockResolvedValue(apiResult)
      mockCacheService.cacheResult.mockResolvedValue(undefined)

      const result = await service.geocodeAddress('123 Broadway, New York, NY 10018')

      expect(result).toEqual({
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: '123 Broadway, New York, NY 10018',
        confidence: 'high',
        source: 'positionstack'
      })

      expect(mockGeocodingAdapter.geocodeAddress).toHaveBeenCalledWith('123 Broadway, New York, NY 10018')
      expect(mockCacheService.cacheResult).toHaveBeenCalled()
    })
  })

  describe('getCacheStats', () => {
    it('should delegate to cache service', async () => {
      const mockStats = {
        totalEntries: 100,
        expiredEntries: 10,
        entriesByType: { zip: 50, city: 30, address: 20 },
        entriesBySource: { positionstack: 80, manual: 20 }
      }

      mockCacheService.getCacheStats.mockResolvedValue(mockStats)

      const result = await service.getCacheStats()

      expect(result).toEqual(mockStats)
      expect(mockCacheService.getCacheStats).toHaveBeenCalled()
    })
  })

  describe('clearExpiredCache', () => {
    it('should delegate to cache service', async () => {
      mockCacheService.clearExpiredEntries.mockResolvedValue(5)

      const result = await service.clearExpiredCache()

      expect(result).toBe(5)
      expect(mockCacheService.clearExpiredEntries).toHaveBeenCalled()
    })
  })

  describe('populateCommonZips', () => {
    it('should delegate to cache service', async () => {
      mockCacheService.populateCommonZips.mockResolvedValue(undefined)

      await service.populateCommonZips()

      expect(mockCacheService.populateCommonZips).toHaveBeenCalled()
    })
  })
})
