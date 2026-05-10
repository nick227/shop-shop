import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDeliveryProviderAdapter } from '@packages/db'
import { prisma } from '@packages/db'

const quoteRequestSchema = z.object({
  orderId: z.string().uuid(),
  storeId: z.string().uuid(),
  provider: z.enum(['DOORDASH_DRIVE', 'IN_HOUSE', 'UBER_DIRECT']),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
})

export const deliveryQuoteRoutes = async (app: FastifyInstance) => {
  // Get delivery quote (called during checkout)
  app.post('/api/delivery/quote', async (req, reply) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body)
      const { orderId, storeId, provider, dropoffLatitude, dropoffLongitude } = validatedData

      // Verify order exists and belongs to the store
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { 
          id: true,
          storeId: true,
          userId: true,
          deliveryLatitude: true,
          deliveryLongitude: true,
          status: true
        }
      })

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' })
      }

      if (order.storeId !== storeId) {
        return reply.code(400).send({ error: 'Order does not belong to specified store' })
      }

      // Check if store supports this delivery provider
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { 
          deliveryEnabled: true,
          pickupEnabled: true,
          latitude: true,
          longitude: true
        }
      })

      if (!store) {
        return reply.code(404).send({ error: 'Store not found' })
      }

      // For IN_HOUSE delivery, check if store has delivery enabled
      if (provider === 'IN_HOUSE' && !store.deliveryEnabled) {
        return reply.code(400).send({ error: 'Store does not support in-house delivery' })
      }

      // For DOORDASH_DRIVE, check if enabled (for now, enable in development)
      if (provider === 'DOORDASH_DRIVE' && process.env.NODE_ENV !== 'development') {
        return reply.code(400).send({ error: 'DoorDash delivery not available' })
      }

      // Get the delivery provider adapter
      const adapter = getDeliveryProviderAdapter(provider)

      // Get the quote
      const quote = await adapter.quoteDelivery({
        orderId,
        storeId,
        dropoffLatitude,
        dropoffLongitude,
      })

      return reply.code(200).send({
        success: true,
        provider,
        quote: {
          feeCents: quote.feeCents,
          currency: quote.currency,
          etaMinutes: quote.etaMinutes,
          providerPayload: quote.providerPayload,
        }
      })

    } catch (error) {
      console.error('Delivery quote error:', error)
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request data', 
          details: error.errors 
        })
      }

      return reply.code(500).send({ 
        error: 'Failed to get delivery quote',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get multiple quotes for all available providers
  app.post('/api/delivery/quotes', async (req, reply) => {
    try {
      const validatedData = quoteRequestSchema.omit({ provider: true }).parse(req.body)
      const { orderId, storeId, dropoffLatitude, dropoffLongitude } = validatedData

      // Verify order and store
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { storeId: true }
      })

      if (!order || order.storeId !== storeId) {
        return reply.code(404).send({ error: 'Order not found or invalid store' })
      }

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { deliveryEnabled: true }
      })

      if (!store) {
        return reply.code(404).send({ error: 'Store not found' })
      }

      // Determine available providers
      const availableProviders = []
      
      // Always include pickup (no fee)
      availableProviders.push({
        provider: 'PICKUP' as const,
        feeCents: 0,
        currency: 'USD' as const,
        etaMinutes: null,
        available: true,
      })

      // Include in-house delivery if enabled
      if (store.deliveryEnabled) {
        availableProviders.push({
          provider: 'IN_HOUSE' as const,
          feeCents: 0, // TODO: Calculate based on store settings
          currency: 'USD' as const,
          etaMinutes: 30, // TODO: Calculate based on store settings
          available: true,
        })
      }

      // Include DoorDash in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const adapter = getDeliveryProviderAdapter('DOORDASH_DRIVE')
          const quote = await adapter.quoteDelivery({
            orderId,
            storeId,
            dropoffLatitude,
            dropoffLongitude,
          })

          availableProviders.push({
            provider: 'DOORDASH_DRIVE' as const,
            feeCents: quote.feeCents,
            currency: quote.currency,
            etaMinutes: quote.etaMinutes,
            available: true,
          })
        } catch (error) {
          console.error('DoorDash quote error:', error)
          availableProviders.push({
            provider: 'DOORDASH_DRIVE' as const,
            feeCents: 0,
            currency: 'USD' as const,
            etaMinutes: null,
            available: false,
            error: 'Temporarily unavailable',
          })
        }
      }

      return reply.code(200).send({
        success: true,
        orderId,
        storeId,
        quotes: availableProviders,
      })

    } catch (error) {
      console.error('Multiple delivery quotes error:', error)
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid request data', 
          details: error.errors 
        })
      }

      return reply.code(500).send({ 
        error: 'Failed to get delivery quotes',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
