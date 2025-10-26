/**
 * Geocoding Cache Service
 * Provides caching layer between user queries and Positionstack API
 * Prevents redundant API calls and improves performance
 */

import { PrismaClient } from '../generated/client'

export interface GeocodingCacheEntry {
  id: string
  queryType: 'zip' | 'city' | 'address'
  queryValue: string
  latitude: number
  longitude: number
  city?: string
  state?: string
  zip?: string
  country?: string
  formattedAddress?: string
  confidence: 'high' | 'medium' | 'low'
  source: 'positionstack' | 'manual' | 'fallback'
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
}

export interface GeocodingQuery {
  queryType: 'zip' | 'city' | 'address'
  queryValue: string
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  city?: string
  state?: string
  zip?: string
  country?: string
  formattedAddress?: string
  confidence: 'high' | 'medium' | 'low'
  source: 'positionstack' | 'manual' | 'fallback'
}

export class GeocodingCacheService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get cached geocoding result
   */
  async getCachedResult(query: GeocodingQuery): Promise<GeocodingResult | null> {
    const cacheEntry = await this.prisma.geocodingCache.findUnique({
      where: {
        queryType_queryValue: {
          queryType: query.queryType,
          queryValue: query.queryValue
        }
      }
    })

    if (!cacheEntry) {
      return null
    }

    // Check if cache entry has expired
    if (cacheEntry.expiresAt && cacheEntry.expiresAt < new Date()) {
      // Delete expired entry
      await this.prisma.geocodingCache.delete({
        where: { id: cacheEntry.id }
      })
      return null
    }

    return {
      latitude: Number(cacheEntry.latitude),
      longitude: Number(cacheEntry.longitude),
      city: cacheEntry.city || undefined,
      state: cacheEntry.state || undefined,
      zip: cacheEntry.zip || undefined,
      country: cacheEntry.country || undefined,
      formattedAddress: cacheEntry.formattedAddress || undefined,
      confidence: cacheEntry.confidence as 'high' | 'medium' | 'low',
      source: cacheEntry.source as 'positionstack' | 'manual' | 'fallback'
    }
  }

  /**
   * Store geocoding result in cache
   */
  async cacheResult(
    query: GeocodingQuery,
    result: GeocodingResult,
    ttlHours: number = 24 * 30 // 30 days default
  ): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + ttlHours)

    await this.prisma.geocodingCache.upsert({
      where: {
        queryType_queryValue: {
          queryType: query.queryType,
          queryValue: query.queryValue
        }
      },
      update: {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        zip: result.zip,
        country: result.country,
        formattedAddress: result.formattedAddress,
        confidence: result.confidence,
        source: result.source,
        expiresAt,
        updatedAt: new Date()
      },
      create: {
        queryType: query.queryType,
        queryValue: query.queryValue,
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        zip: result.zip,
        country: result.country,
        formattedAddress: result.formattedAddress,
        confidence: result.confidence,
        source: result.source,
        expiresAt
      }
    })
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredEntries(): Promise<number> {
    const result = await this.prisma.geocodingCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    return result.count
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number
    expiredEntries: number
    entriesByType: Record<string, number>
    entriesBySource: Record<string, number>
  }> {
    const [totalEntries, expiredEntries, entriesByType, entriesBySource] = await Promise.all([
      this.prisma.geocodingCache.count(),
      this.prisma.geocodingCache.count({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      }),
      this.prisma.geocodingCache.groupBy({
        by: ['queryType'],
        _count: true
      }),
      this.prisma.geocodingCache.groupBy({
        by: ['source'],
        _count: true
      })
    ])

    return {
      totalEntries,
      expiredEntries,
      entriesByType: entriesByType.reduce((acc, item) => {
        acc[item.queryType] = item._count
        return acc
      }, {} as Record<string, number>),
      entriesBySource: entriesBySource.reduce((acc, item) => {
        acc[item.source] = item._count
        return acc
      }, {} as Record<string, number>)
    }
  }

  /**
   * Pre-populate cache with common ZIP codes
   */
  async populateCommonZips(): Promise<void> {
    const commonZips = [
      { zip: '10018', lat: 40.7505, lon: -73.9934, city: 'New York', state: 'NY' },
      { zip: '90012', lat: 34.0522, lon: -118.2437, city: 'Los Angeles', state: 'CA' },
      { zip: '92101', lat: 32.7157, lon: -117.1611, city: 'San Diego', state: 'CA' },
      { zip: '60601', lat: 41.8781, lon: -87.6298, city: 'Chicago', state: 'IL' },
      { zip: '33101', lat: 25.7617, lon: -80.1918, city: 'Miami', state: 'FL' },
      { zip: '98101', lat: 47.6062, lon: -122.3321, city: 'Seattle', state: 'WA' },
      { zip: '02101', lat: 42.3601, lon: -71.0589, city: 'Boston', state: 'MA' },
      { zip: '30301', lat: 33.7490, lon: -84.3880, city: 'Atlanta', state: 'GA' },
      { zip: '75201', lat: 32.7767, lon: -96.7970, city: 'Dallas', state: 'TX' },
      { zip: '85001', lat: 33.4484, lon: -112.0740, city: 'Phoenix', state: 'AZ' }
    ]

    for (const zip of commonZips) {
      await this.cacheResult(
        { queryType: 'zip', queryValue: zip.zip },
        {
          latitude: zip.lat,
          longitude: zip.lon,
          city: zip.city,
          state: zip.state,
          zip: zip.zip,
          country: 'US',
          formattedAddress: `${zip.city}, ${zip.state} ${zip.zip}`,
          confidence: 'high',
          source: 'manual'
        },
        24 * 365 // 1 year TTL for manual entries
      )
    }
  }
}
