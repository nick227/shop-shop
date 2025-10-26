/**
 * Unit tests for GeocodingCacheService
 * Tests caching functionality, TTL, and cache statistics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GeocodingCacheService, GeocodingQuery, GeocodingResult } from '../services/geocoding-cache.service'

// Mock Prisma client
const mockPrisma = {
  geocodingCache: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    delete: vi.fn()
  }
}

describe('GeocodingCacheService', () => {
  let cacheService: GeocodingCacheService

  beforeEach(() => {
    vi.clearAllMocks()
    cacheService = new GeocodingCacheService(mockPrisma as any)
  })

  describe('getCachedResult', () => {
    it('should return null when no cache entry exists', async () => {
      mockPrisma.geocodingCache.findUnique.mockResolvedValue(null)

      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result = await cacheService.getCachedResult(query)

      expect(result).toBeNull()
      expect(mockPrisma.geocodingCache.findUnique).toHaveBeenCalledWith({
        where: {
          queryType_queryValue: {
            queryType: 'zip',
            queryValue: '10018'
          }
        }
      })
    })

    it('should return cached result when valid entry exists', async () => {
      const mockCacheEntry = {
        id: 'cache-1',
        queryType: 'zip',
        queryValue: '10018',
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day from now
      }

      mockPrisma.geocodingCache.findUnique.mockResolvedValue(mockCacheEntry)

      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result = await cacheService.getCachedResult(query)

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
    })

    it('should return null and delete expired entry', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      const mockCacheEntry = {
        id: 'cache-1',
        queryType: 'zip',
        queryValue: '10018',
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: expiredDate
      }

      mockPrisma.geocodingCache.findUnique.mockResolvedValue(mockCacheEntry)
      mockPrisma.geocodingCache.delete.mockResolvedValue({ id: 'cache-1' })

      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result = await cacheService.getCachedResult(query)

      expect(result).toBeNull()
      expect(mockPrisma.geocodingCache.delete).toHaveBeenCalledWith({
        where: { id: 'cache-1' }
      })
    })

    it('should return cached result when no expiration date', async () => {
      const mockCacheEntry = {
        id: 'cache-1',
        queryType: 'zip',
        queryValue: '10018',
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null
      }

      mockPrisma.geocodingCache.findUnique.mockResolvedValue(mockCacheEntry)

      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result = await cacheService.getCachedResult(query)

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
    })
  })

  describe('cacheResult', () => {
    it('should cache a new result', async () => {
      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result: GeocodingResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack'
      }

      mockPrisma.geocodingCache.upsert.mockResolvedValue({ id: 'cache-1' })

      await cacheService.cacheResult(query, result, 24)

      expect(mockPrisma.geocodingCache.upsert).toHaveBeenCalledWith({
        where: {
          queryType_queryValue: {
            queryType: 'zip',
            queryValue: '10018'
          }
        },
        update: {
          latitude: 40.7505,
          longitude: -73.9934,
          city: 'New York',
          state: 'NY',
          zip: '10018',
          country: 'US',
          formattedAddress: 'New York, NY 10018',
          confidence: 'high',
          source: 'positionstack',
          expiresAt: expect.any(Date),
          updatedAt: expect.any(Date)
        },
        create: {
          queryType: 'zip',
          queryValue: '10018',
          latitude: 40.7505,
          longitude: -73.9934,
          city: 'New York',
          state: 'NY',
          zip: '10018',
          country: 'US',
          formattedAddress: 'New York, NY 10018',
          confidence: 'high',
          source: 'positionstack',
          expiresAt: expect.any(Date)
        }
      })
    })

    it('should use default TTL of 30 days', async () => {
      const query: GeocodingQuery = { queryType: 'zip', queryValue: '10018' }
      const result: GeocodingResult = {
        latitude: 40.7505,
        longitude: -73.9934,
        city: 'New York',
        state: 'NY',
        zip: '10018',
        country: 'US',
        formattedAddress: 'New York, NY 10018',
        confidence: 'high',
        source: 'positionstack'
      }

      mockPrisma.geocodingCache.upsert.mockResolvedValue({ id: 'cache-1' })

      await cacheService.cacheResult(query, result)

      const upsertCall = mockPrisma.geocodingCache.upsert.mock.calls[0][0]
      const expiresAt = upsertCall.create.expiresAt
      const expectedExpiry = new Date(Date.now() + 24 * 30 * 60 * 60 * 1000) // 30 days

      // Check that the expiry is approximately 30 days from now (within 2 hours tolerance)
      const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
      expect(timeDiff).toBeLessThan(2 * 60 * 60 * 1000) // Within 2 hours
    })
  })

  describe('clearExpiredEntries', () => {
    it('should delete expired entries and return count', async () => {
      mockPrisma.geocodingCache.deleteMany.mockResolvedValue({ count: 5 })

      const deletedCount = await cacheService.clearExpiredEntries()

      expect(deletedCount).toBe(5)
      expect(mockPrisma.geocodingCache.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      })
    })
  })

  describe('getCacheStats', () => {
    it('should return comprehensive cache statistics', async () => {
      mockPrisma.geocodingCache.count
        .mockResolvedValueOnce(100) // total entries
        .mockResolvedValueOnce(10)  // expired entries

      mockPrisma.geocodingCache.groupBy
        .mockResolvedValueOnce([ // entries by type
          { queryType: 'zip', _count: 50 },
          { queryType: 'city', _count: 30 },
          { queryType: 'address', _count: 20 }
        ])
        .mockResolvedValueOnce([ // entries by source
          { source: 'positionstack', _count: 80 },
          { source: 'manual', _count: 20 }
        ])

      const stats = await cacheService.getCacheStats()

      expect(stats).toEqual({
        totalEntries: 100,
        expiredEntries: 10,
        entriesByType: {
          zip: 50,
          city: 30,
          address: 20
        },
        entriesBySource: {
          positionstack: 80,
          manual: 20
        }
      })
    })
  })

  describe('populateCommonZips', () => {
    it('should cache common ZIP codes with manual source', async () => {
      mockPrisma.geocodingCache.upsert.mockResolvedValue({ id: 'cache-1' })

      await cacheService.populateCommonZips()

      // Should cache 10 common ZIP codes
      expect(mockPrisma.geocodingCache.upsert).toHaveBeenCalledTimes(10)

      // Check first ZIP code (10018 - NYC)
      const firstCall = mockPrisma.geocodingCache.upsert.mock.calls[0][0]
      expect(firstCall.create.queryType).toBe('zip')
      expect(firstCall.create.queryValue).toBe('10018')
      expect(firstCall.create.latitude).toBe(40.7505)
      expect(firstCall.create.longitude).toBe(-73.9934)
      expect(firstCall.create.city).toBe('New York')
      expect(firstCall.create.state).toBe('NY')
      expect(firstCall.create.source).toBe('manual')
      expect(firstCall.create.confidence).toBe('high')
    })
  })
})
