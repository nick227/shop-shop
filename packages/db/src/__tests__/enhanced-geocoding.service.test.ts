/**
 * Unit tests for EnhancedGeocodingService
 * Tests integration between cache and API adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EnhancedGeocodingService, GeocoderUnavailableError, GeocodingConfig } from '../services/enhanced-geocoding.service'
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
  postalCode: {
    findUnique: vi.fn().mockResolvedValue(null),
  },
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

const mockFallbackAdapter = {
  geocodeZipCode: vi.fn(),
  geocodeCityState: vi.fn(),
  geocodeAddress: vi.fn(),
}

vi.mock('../adapters/mapsco-geocoding.adapter', () => ({
  MapsCoGeocodingAdapter: vi.fn(function MapsCoMock() {
    return mockFallbackAdapter
  }),
}))

const mockLookupZipReference = vi.fn()
vi.mock('../geo/zip-reference', () => ({
  lookupZipReference: (...args: unknown[]) => mockLookupZipReference(...args),
}))

// Mock the cache service creation (`new GeocodingCacheService()` must return the mock instance)
vi.mock('../services/geocoding-cache.service', () => ({
  GeocodingCacheService: vi.fn(function GeocodingCacheServiceMock() {
    return mockCacheService
  }),
}))

describe('EnhancedGeocodingService', () => {
  let service: EnhancedGeocodingService
  let config: GeocodingConfig

  beforeEach(() => {
    vi.clearAllMocks()
    mockLookupZipReference.mockResolvedValue(null)
    mockPrisma.postalCode.findUnique.mockResolvedValue(null)
    
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
        source: 'mapbox' as const
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

    it('still returns a good answer when the cache cannot store it', async () => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue({ latitude: 32.2572, longitude: -95.5393, confidence: 'high', formattedAddress: '75758, Chandler, TX, USA', city: 'Chandler', state: 'TX', zip: '75758', country: 'US' })
      mockCacheService.cacheResult.mockRejectedValue(new Error('value too long for column country'))

      await expect(service.geocodeZip('75758')).resolves.toMatchObject({ city: 'Chandler', zip: '75758' })
    })

    it('reports a provider failure as unavailable, not as a missing ZIP', async () => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('API Error'))

      await expect(service.geocodeZip('10018')).rejects.toBeInstanceOf(GeocoderUnavailableError)
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
        source: 'mapbox' as const
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
        source: 'mapbox' as const
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

  describe('maps.co fallback', () => {
    const chandler = { latitude: 32.25, longitude: -95.5, confidence: 'high' as const, formattedAddress: '75758, Chandler, TX', city: 'Chandler', state: 'TX', zip: '75758', country: 'US' }
    let withFallback: EnhancedGeocodingService

    beforeEach(() => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockCacheService.cacheResult.mockResolvedValue(undefined)
      withFallback = new EnhancedGeocodingService(mockPrisma as any, { ...config, fallbackApiKey: 'maps-key' })
    })

    it('answers from maps.co when Positionstack fails, and labels the source', async () => {
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('401'))
      mockFallbackAdapter.geocodeZipCode.mockResolvedValue(chandler)
      await expect(withFallback.geocodeZip('75758')).resolves.toMatchObject({ city: 'Chandler', source: 'mapsco' })
      expect(mockCacheService.cacheResult).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ source: 'mapsco' }), expect.any(Number))
    })

    it('answers from maps.co when Positionstack finds nothing', async () => {
      mockGeocodingAdapter.geocodeAddress.mockResolvedValue(null)
      mockFallbackAdapter.geocodeAddress.mockResolvedValue(chandler)
      await expect(withFallback.geocodeAddress('1 Main St, Chandler, TX')).resolves.toMatchObject({ source: 'mapsco' })
    })

    it('does not ask maps.co when Positionstack answers', async () => {
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(chandler)
      await expect(withFallback.geocodeZip('75758')).resolves.toMatchObject({ source: 'positionstack' })
      expect(mockFallbackAdapter.geocodeZipCode).not.toHaveBeenCalled()
    })

    it('treats a ZIP neither provider finds as not found, and both failing as unavailable', async () => {
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('401'))
      mockFallbackAdapter.geocodeZipCode.mockResolvedValue(null)
      await expect(withFallback.geocodeZip('00000')).resolves.toBeNull()

      mockFallbackAdapter.geocodeZipCode.mockRejectedValue(new Error('429'))
      await expect(withFallback.geocodeZip('00000')).rejects.toBeInstanceOf(GeocoderUnavailableError)
    })

    it('has no fallback without a key', async () => {
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('401'))
      await expect(service.geocodeZip('75758')).rejects.toBeInstanceOf(GeocoderUnavailableError)
      expect(mockFallbackAdapter.geocodeZipCode).not.toHaveBeenCalled()
    })
  })

  describe('local ZIP reference', () => {
    const local = (zip: string, city: string, state: string, questionable = false) => ({
      accuracy: questionable ? 1 : 4,
      questionable,
      result: { latitude: 40.8154, longitude: -73.0451, city, state, zip, country: 'US', formattedAddress: `${city}, ${state} ${zip}`, confidence: questionable ? 'low' : 'medium', source: 'geonames' },
    })
    const provider = { latitude: 42.4884, longitude: -71.5178, confidence: 'high' as const, formattedAddress: '01719, Boxborough, MA, USA', city: 'Boxborough', state: 'MA', zip: '01719', country: 'US' }
    let withFallback: EnhancedGeocodingService

    beforeEach(() => {
      mockCacheService.getCachedResult.mockResolvedValue(null)
      mockCacheService.cacheResult.mockResolvedValue(undefined)
      withFallback = new EnhancedGeocodingService(mockPrisma as any, { ...config, fallbackApiKey: 'maps-key' })
    })

    it('answers served Austin ZIPs from the place directory before the national reference', async () => {
      mockPrisma.postalCode.findUnique.mockResolvedValue({ code: '78758', latitude: '30.387', longitude: '-97.7055', city: { name: 'Austin', state: 'TX', country: 'US' } })
      await expect(withFallback.geocodeZip('78758')).resolves.toMatchObject({ city: 'Austin', source: 'manual' })
      expect(mockLookupZipReference).not.toHaveBeenCalled()
      expect(mockGeocodingAdapter.geocodeZipCode).not.toHaveBeenCalled()
    })

    it('answers out-of-state and leading-zero ZIPs locally with no API call', async () => {
      for (const [zip, city, state] of [['75758', 'Chandler', 'TX'], ['00501', 'Holtsville', 'NY']] as const) {
        mockLookupZipReference.mockResolvedValueOnce(local(zip, city, state))
        await expect(withFallback.geocodeZip(zip)).resolves.toMatchObject({ zip, city, state, source: 'geonames' })
      }
      expect(mockGeocodingAdapter.geocodeZipCode).not.toHaveBeenCalled()
      expect(mockFallbackAdapter.geocodeZipCode).not.toHaveBeenCalled()
    })

    it('confirms a questionable record with the providers and prefers their answer', async () => {
      mockLookupZipReference.mockResolvedValue(local('01719', 'Boxborough', 'MA', true))
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(provider)
      await expect(withFallback.geocodeZip('01719')).resolves.toMatchObject({ source: 'positionstack' })
    })

    it('falls back to the questionable local record when the providers fail or find nothing', async () => {
      mockLookupZipReference.mockResolvedValue(local('01098', 'Worthington', 'MA', true))
      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('504'))
      mockFallbackAdapter.geocodeZipCode.mockRejectedValue(new Error('429'))
      await expect(withFallback.geocodeZip('01098')).resolves.toMatchObject({ city: 'Worthington', source: 'geonames', confidence: 'low' })

      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(null)
      mockFallbackAdapter.geocodeZipCode.mockResolvedValue(null)
      await expect(withFallback.geocodeZip('01098')).resolves.toMatchObject({ source: 'geonames' })
    })

    it('sends unknown ZIPs to the providers: not found when they answer empty, unavailable when they fail', async () => {
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(null)
      mockFallbackAdapter.geocodeZipCode.mockResolvedValue(null)
      await expect(withFallback.geocodeZip('00000')).resolves.toBeNull()

      mockGeocodingAdapter.geocodeZipCode.mockRejectedValue(new Error('504'))
      mockFallbackAdapter.geocodeZipCode.mockRejectedValue(new Error('429'))
      await expect(withFallback.geocodeZip('00000')).rejects.toBeInstanceOf(GeocoderUnavailableError)
    })

    it('keeps working through the providers if the reference table cannot be read', async () => {
      mockLookupZipReference.mockRejectedValue(new Error('table missing'))
      mockGeocodingAdapter.geocodeZipCode.mockResolvedValue(provider)
      await expect(withFallback.geocodeZip('01719')).resolves.toMatchObject({ source: 'positionstack' })
    })
  })
})
