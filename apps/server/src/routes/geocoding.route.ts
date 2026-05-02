/**
 * Geocoding API Routes
 * Provides ZIP code and address geocoding services
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import type { PrismaClient } from '@packages/db/generated/client'
import { createEnhancedGeocodingService } from '@packages/db'
import { env } from '../env.js'
import { prisma } from '@packages/db'

// Request schemas
const ZipCodeQuerySchema = z.object({
  zip: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits'),
})

const CityStateQuerySchema = z.object({
  city: z.string().min(2, 'City name required'),
  state: z.string().length(2, 'State must be 2-letter code (e.g., NY)'),
})

const AddressQuerySchema = z.object({
  address: z.string().min(5, 'Full address required'),
})

// Response type
interface GeocodeResponse {
  latitude: number
  longitude: number
  city?: string
  state?: string
  zip?: string
  country?: string
  displayName: string
}

/**
 * Helper function to validate if coordinates are in the US
 * US bounds: roughly 24.5°N to 49°N, 66°W to 125°W
 * Includes continental US, Alaska, Hawaii, Puerto Rico, etc.
 */
function isUSCoordinates(lat: number, lon: number): boolean {
  return lat >= 24.5 && lat <= 49 && lon >= -125 && lon <= -66
}

export async function geocodingRoutes(app: FastifyInstance) {
  // Check if geocoding is enabled
  if (!env.GEOCODING_API_KEY) {
    app.log.warn('⚠️  Geocoding API key not configured - geocoding endpoints will return 503')
    
    // Register routes that return 503 Service Unavailable
    app.get('/geocode/zip', async (req, reply) => {
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'Geocoding API key not configured. Set GEOCODING_API_KEY in environment variables.'
      })
    })
    app.get('/geocode/city', async (req, reply) => {
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'Geocoding API key not configured'
      })
    })
    app.get('/geocode/address', async (req, reply) => {
      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'Geocoding API key not configured'
      })
    })
    return
  }

  app.log.info(`✅ Geocoding API key configured (${env.GEOCODING_API_KEY.substring(0, 8)}...)`)

  // Create enhanced geocoding service with caching
  const geocoder = createEnhancedGeocodingService(prisma as unknown as PrismaClient, {
    apiKey: env.GEOCODING_API_KEY,
    enableCache: true,
    cacheTTLHours: 24 * 30 // 30 days
  })

  // Pre-populate cache with common ZIP codes on startup
  try {
    await geocoder.populateCommonZips()
    app.log.info('Geocoding cache pre-populated with common ZIP codes')
  } catch (error) {
    app.log.warn({ error }, 'Failed to pre-populate geocoding cache')
  }

  /**
   * GET /geocode/zip?zip=10018
   * Geocode a ZIP code to coordinates
   * Returns 404 if Positionstack returns non-US coordinates
   */
  app.get('/geocode/zip', async (req: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()
    
    try {
      const { zip } = ZipCodeQuerySchema.parse(req.query)
      
      app.log.info(`📍 [Geocoding] Request for ZIP: ${zip}`)

      const result = await geocoder.geocodeZip(zip)
      
      const elapsed = Date.now() - startTime

      if (!result) {
        app.log.warn(`⚠️  [Geocoding] ZIP ${zip} not found (${elapsed}ms)`)
        return reply.status(404).send({
          error: 'Not Found',
          message: `ZIP code ${zip} not found or unable to geocode`
        })
      }

      app.log.info({
        zip,
        result: {
          lat: result.latitude,
          lon: result.longitude,
          city: result.city,
          state: result.state,
          source: result.source
        },
        elapsed: `${elapsed}ms`
      }, '✅ [Geocoding] ZIP lookup successful')

      // Validate that coordinates are in the US (prevent international results)
      if (!isUSCoordinates(result.latitude, result.longitude)) {
        app.log.warn({
          zip,
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress
        }, '🌍 [Geocoding] Non-US coordinates returned for US ZIP code')
        
        return reply.status(404).send({
          error: 'Not Found',
          message: `ZIP code ${zip} not found in US (API returned international result)`
        })
      }

      const response: GeocodeResponse = {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        zip: result.zip,
        country: result.country || 'US',
        displayName: result.formattedAddress || `${result.city}, ${result.state} ${result.zip}`
      }
      
      app.log.info(`📤 [Geocoding] Returning: ${response.displayName}`)
      return reply.send(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid request'
        })
      }
      
      req.log.error(error)
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to geocode ZIP code'
      })
    }
  })

  /**
   * GET /geocode/city?city=New%20York&state=NY
   * Geocode a city/state to coordinates
   */
  app.get('/geocode/city', async (req: FastifyRequest, reply: FastifyReply) => {
    const startTime = Date.now()
    
    try {
      const { city, state } = CityStateQuerySchema.parse(req.query)
      
      app.log.info(`🏙️  [Geocoding] Request for City: ${city}, ${state}`)

      const result = await geocoder.geocodeCity(city, state)
      
      const elapsed = Date.now() - startTime

      if (!result) {
        app.log.warn(`⚠️  [Geocoding] City ${city}, ${state} not found (${elapsed}ms)`)
        return reply.status(404).send({
          error: 'Not Found',
          message: `City "${city}, ${state}" not found or unable to geocode`
        })
      }

      app.log.info({
        city,
        state,
        result: {
          lat: result.latitude,
          lon: result.longitude,
          source: result.source
        },
        elapsed: `${elapsed}ms`
      }, '✅ [Geocoding] City lookup successful')

      // Validate that coordinates are in the US
      if (!isUSCoordinates(result.latitude, result.longitude)) {
        app.log.warn({
          city,
          state,
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress
        }, '🌍 [Geocoding] Non-US coordinates returned for US city/state')
        
        return reply.status(404).send({
          error: 'Not Found',
          message: `City "${city}, ${state}" not found in US (API returned international result)`
        })
      }

      const response: GeocodeResponse = {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        zip: result.zip,
        country: result.country || 'US',
        displayName: result.formattedAddress || `${result.city}, ${result.state}`
      }
      
      app.log.info(`📤 [Geocoding] Returning: ${response.displayName}`)
      return reply.send(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid request'
        })
      }
      
      req.log.error(error)
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to geocode city/state'
      })
    }
  })

  /**
   * GET /geocode/address?address=123%20Main%20St,%20New%20York,%20NY
   * Geocode a full address to coordinates
   */
  app.get('/geocode/address', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { address } = AddressQuerySchema.parse(req.query)

      const result = await geocoder.geocodeAddress(address)

      if (!result) {
        return reply.status(404).send({
          error: 'Not Found',
          message: `Address "${address}" not found or unable to geocode`
        })
      }

      const response: GeocodeResponse = {
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        zip: result.zip,
        country: result.country || 'US',
        displayName: result.formattedAddress || address
      }
      
      return reply.send(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid request'
        })
      }
      
      req.log.error(error)
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to geocode address'
      })
    }
  })

  /**
   * GET /geocode/stats
   * Get cache statistics
   */
  app.get('/geocode/stats', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await geocoder.getCacheStats()
      return reply.send(stats)
    } catch (error) {
      req.log.error(error)
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get cache statistics'
      })
    }
  })

  app.log.info({
    routes: [
      'GET /geocode/zip',
      'GET /geocode/city',
      'GET /geocode/address',
      'GET /geocode/stats'
    ]
  }, 'Geocoding routes registered')
}

