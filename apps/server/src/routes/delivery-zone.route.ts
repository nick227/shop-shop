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
  prisma,
} from '@packages/db'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac'
import { userHasStoreAccess } from '../middleware/storeAccess.js'

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
    preHandler: [authenticate, requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = CreateDeliveryZoneSchema.parse(req.body)

      const store = await prisma.store.findUnique({ where: { id: input.storeId }, select: { id: true } })
      if (!store) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, input.storeId, 'settings'))) {
        return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
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
  app.get('/delivery-zones/:id', { preHandler: [optionalAuthenticate] }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const zone = await getDeliveryZone(params.id)

      if (!zone) {
        return reply.code(404).send({ error: 'Delivery zone not found' })
      }

      if (
        req.user &&
        (req.user.role === 'VENDOR' || req.user.role === 'STAFF') &&
        !(await userHasStoreAccess(req.user.id, req.user.role, zone.storeId, 'settings'))
      ) {
        return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
      }

      return reply.code(200).send({ zone })
    } catch (error) {
      throw error
    }
  })

  // PATCH /delivery-zones/:id - Update delivery zone
  app.patch('/delivery-zones/:id', {
    preHandler: [authenticate, requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = UpdateDeliveryZoneSchema.parse(req.body)

      const existingZone = await getDeliveryZone(params.id)
      if (!existingZone) return reply.code(404).send({ error: 'Delivery zone not found' })
      const zoneStore = await prisma.store.findUnique({ where: { id: existingZone.storeId }, select: { id: true } })
      if (!zoneStore) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, existingZone.storeId, 'settings'))) {
        return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
      }

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
    preHandler: [authenticate, requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }

      const zoneToDelete = await getDeliveryZone(params.id)
      if (!zoneToDelete) return reply.code(404).send({ error: 'Delivery zone not found' })
      const deleteStore = await prisma.store.findUnique({ where: { id: zoneToDelete.storeId }, select: { id: true } })
      if (!deleteStore) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, zoneToDelete.storeId, 'settings'))) {
        return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
      }

      await deleteDeliveryZone(params.id)
      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /stores/:storeId/delivery-zones - Get all zones for a store
  app.get('/stores/:storeId/delivery-zones', { preHandler: [optionalAuthenticate] }, async (req, reply) => {
    try {
      const params = req.params as { storeId: string }
      const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { id: true } })
      if (!store) return reply.code(404).send({ error: 'Store not found' })

      if (
        req.user &&
        (req.user.role === 'VENDOR' || req.user.role === 'STAFF') &&
        !(await userHasStoreAccess(req.user.id, req.user.role, params.storeId, 'settings'))
      ) {
        return reply.code(403).send({ error: 'Forbidden: you do not manage this store' })
      }

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
    preHandler: [authenticate, requireRole(['VENDOR', 'STAFF', 'ADMIN'])],
  }, async (req, reply) => {
    try {
      const input = BulkUpdatePrioritiesSchema.parse(req.body)

      if (req.user!.role !== 'ADMIN') {
        for (const update of input.updates) {
          const z = await getDeliveryZone(update.zoneId)
          if (!z) return reply.code(404).send({ error: `Delivery zone ${update.zoneId} not found` })
          const s = await prisma.store.findUnique({ where: { id: z.storeId }, select: { id: true } })
          if (!s) return reply.code(404).send({ error: 'Store not found' })
          if (!(await userHasStoreAccess(req.user!.id, req.user!.role, z.storeId, 'settings'))) {
            return reply.code(403).send({ error: 'Forbidden: you do not manage all zones in this update' })
          }
        }
      }

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

