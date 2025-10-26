import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createDeliveryZone,
  getDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getStoreDeliveryZones,
  calculateDeliveryFee,
  bulkUpdateZonePriorities,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'

const GeoJSONPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()))),
})

const CreateDeliveryZoneSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().min(1),
  polygonJson: z.unknown(),
  baseFee: z.number().positive(),
  minOrder: z.number().positive().optional(),
  priority: z.number().int().optional(),
})

const UpdateDeliveryZoneSchema = z.object({
  name: z.string().min(1).optional(),
  polygonJson: z.unknown().optional(),
  baseFee: z.number().positive().optional(),
  minOrder: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
})

const CalculateDeliveryFeeSchema = z.object({
  storeId: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  orderSubtotal: z.number().positive(),
})

const BulkUpdatePrioritiesSchema = z.object({
  updates: z.array(
    z.object({
      zoneId: z.string().uuid(),
      priority: z.number().int(),
    })
  ),
})

export const deliveryZoneRoutes = async (app: FastifyInstance) => {
  // POST /delivery-zones - Create delivery zone
  app.post('/delivery-zones', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = CreateDeliveryZoneSchema.parse(req.body)
      
      // Verify user owns the store
      const userId = req.user?.id
      if (!userId || req.user?.role !== 'ADMIN') {
        // TODO: Verify store ownership
      }

      const zone = await createDeliveryZone({
        storeId: input.storeId,
        name: input.name,
        polygonJson: input.polygonJson,
        baseFee: input.baseFee,
        minOrder: input.minOrder,
        priority: input.priority,
      })
      return reply.code(201).send({ zone })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // GET /delivery-zones/:id - Get delivery zone
  app.get('/delivery-zones/:id', async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const zone = await getDeliveryZone(params.id)

      if (!zone) {
        return reply.code(404).send({ error: 'Delivery zone not found' })
      }

      return reply.code(200).send({ zone })
    } catch (error) {
      throw error
    }
  })

  // PATCH /delivery-zones/:id - Update delivery zone
  app.patch('/delivery-zones/:id', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = UpdateDeliveryZoneSchema.parse(req.body)

      // TODO: Verify user owns the store

      const zone = await updateDeliveryZone(params.id, input)
      return reply.code(200).send({ zone })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /delivery-zones/:id - Delete delivery zone
  app.delete('/delivery-zones/:id', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }

      // TODO: Verify user owns the store

      await deleteDeliveryZone(params.id)
      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /stores/:storeId/delivery-zones - Get all zones for a store
  app.get('/stores/:storeId/delivery-zones', async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      const zones = await getStoreDeliveryZones(params.storeId)

      return reply.code(200).send({ zones })
    } catch (error) {
      throw error
    }
  })

  // POST /delivery-zones/calculate-fee - Calculate delivery fee
  app.post('/delivery-zones/calculate-fee', async (req, reply) => {
    try {
      const input = CalculateDeliveryFeeSchema.parse(req.body)

      const result = await calculateDeliveryFee(
        input.storeId,
        { lat: input.lat, lng: input.lng },
        input.orderSubtotal
      )

      return reply.code(200).send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // POST /delivery-zones/bulk-update-priorities - Bulk update zone priorities
  app.post('/delivery-zones/bulk-update-priorities', {
    preHandler: [requireRole(['VENDOR', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = BulkUpdatePrioritiesSchema.parse(req.body)

      // TODO: Verify user owns all stores

      await bulkUpdateZonePriorities(input.updates)
      return reply.code(200).send({ success: true })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })
}

