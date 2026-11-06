import { getAccountCapabilities } from '@packages/db'
import { requireVendorWorkspace } from '../middleware/vendorAccess.js'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createDeliveryZone,
  getDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getStoreDeliveryZones,
  getActiveStoreDeliveryZones,
  calculateDeliveryFee,
  bulkUpdateZonePriorities,
  prisma,
} from '@packages/db'
import { requireRole } from '../middleware/rbac.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'
import { isPublicStore } from '../services/store-visibility.service.js'
import { VendorErrors } from './vendor/vendorHelpers.js'
import { validateZonePolygon } from '../commerce/deliveryZones.js'
import { deliveryEligibility, resolveDestination } from '../commerce/fulfillment.js'

const GeoJSONPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()))),
})

// A fee of 0 is free delivery; a minimum of null clears it.
const CreateDeliveryZoneSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(1, 'Name the zone').max(60),
  polygonJson: z.unknown(),
  baseFee: z.number().min(0).max(100),
  minOrder: z.number().min(0).max(1000).nullable().optional(),
  priority: z.number().int().optional(),
})

const UpdateDeliveryZoneSchema = z.object({
  name: z.string().trim().min(1, 'Name the zone').max(60).optional(),
  polygonJson: z.unknown().optional(),
  baseFee: z.number().min(0).max(100).optional(),
  minOrder: z.number().min(0).max(1000).nullable().optional(),
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

/** What a shopper needs about a zone: where it covers and what delivery there costs. */
export function publicDeliveryZone(zone: { id: string; name: string; polygonJson: unknown; baseFee: unknown; minOrder: unknown }) {
  const money = (value: unknown) => (value === null || value === undefined ? null : String(value))
  return { id: zone.id, name: zone.name, polygonJson: zone.polygonJson, baseFee: money(zone.baseFee), minOrder: money(zone.minOrder) }
}

export const deliveryZoneRoutes = async (app: FastifyInstance) => {
  // POST /delivery-zones - Create delivery zone
  app.post('/delivery-zones', {
    preHandler: [requireVendorWorkspace],
  }, async (req, reply) => {
    try {
      const input = CreateDeliveryZoneSchema.parse(req.body)
      const shape = validateZonePolygon(input.polygonJson)
      if ('error' in shape) return reply.code(400).send({ error: shape.error })

      const store = await prisma.store.findUnique({ where: { id: input.storeId }, select: { id: true } })
      if (!store) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, input.storeId, 'settings'))) {
        return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
      }

      const zone = await createDeliveryZone({
        storeId: input.storeId,
        name: input.name,
        polygonJson: shape.polygon,
        baseFee: input.baseFee,
        minOrder: input.minOrder ?? undefined,
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

      if (
        req.user &&
        (req.user.role === 'VENDOR' || req.user.role === 'STAFF') &&
        !(await userHasStoreAccess(req.user.id, req.user.role, zone.storeId, 'settings'))
      ) {
        return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
      }

      return reply.code(200).send({ zone })
    } catch (error) {
      throw error
    }
  })

  // PATCH /delivery-zones/:id - Update delivery zone
  app.patch('/delivery-zones/:id', {
    preHandler: [requireVendorWorkspace],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }
      const input = UpdateDeliveryZoneSchema.parse(req.body)
      if (input.polygonJson !== undefined) {
        const shape = validateZonePolygon(input.polygonJson)
        if ('error' in shape) return reply.code(400).send({ error: shape.error })
        input.polygonJson = shape.polygon
      }

      const existingZone = await getDeliveryZone(params.id)
      if (!existingZone) return reply.code(404).send({ error: 'Delivery zone not found' })
      const zoneStore = await prisma.store.findUnique({ where: { id: existingZone.storeId }, select: { id: true } })
      if (!zoneStore) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, existingZone.storeId, 'settings'))) {
        return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
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
    preHandler: [requireVendorWorkspace],
  }, async (req, reply) => {
    try {
      const params = req.params as { id: string }

      const zoneToDelete = await getDeliveryZone(params.id)
      if (!zoneToDelete) return reply.code(404).send({ error: 'Delivery zone not found' })
      const deleteStore = await prisma.store.findUnique({ where: { id: zoneToDelete.storeId }, select: { id: true } })
      if (!deleteStore) return reply.code(404).send({ error: 'Store not found' })
      if (!(await userHasStoreAccess(req.user!.id, req.user!.role, zoneToDelete.storeId, 'settings'))) {
        return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
      }

      await deleteDeliveryZone(params.id)
      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /stores/:storeId/delivery-zones - Get all zones for a store
  /**
   * Store managers get every zone as stored, for editing. Everyone else gets the active zones of a
   * public store in the shopper shape (coverage and fees, in the order checkout applies them); a
   * private store answers exactly like a missing one.
   */
  app.get('/stores/:storeId/delivery-zones', async (req, reply) => {
    const params = req.params as { storeId: string }
    const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { id: true, isPublished: true, status: true } })
    if (!store) return reply.code(404).send({ error: 'Store not found' })

    if (req.user && await userHasStoreAccess(req.user.id, req.user.role, params.storeId, 'settings')) {
      return reply.code(200).send({ zones: await getStoreDeliveryZones(params.storeId) })
    }
    if (!isPublicStore(store)) return reply.code(404).send({ error: 'Store not found' })

    const zones = await getActiveStoreDeliveryZones(params.storeId)
    return reply.code(200).send({ zones: zones.map(publicDeliveryZone) })
  })

  /**
   * Vendor preview: would this address get delivery, and for how much? Uses the shopper's eligibility
   * rules on the saved settings, so what the vendor sees is what shoppers get.
   */
  app.post('/stores/:storeId/delivery-preview', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as { storeId: string }
    if (!(await userHasStoreAccess(req.user!.id, req.user!.role, storeId, 'settings'))) {
      return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
    }
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, deliveryEnabled: true, pickupEnabled: true, deliveryCharge: true, deliveryDistance: true, deliveryMinimum: true, latitude: true, longitude: true },
    })
    if (!store) return reply.code(404).send({ error: 'Store not found' })
    const body = (req.body ?? {}) as { address?: unknown; subtotal?: number }
    const destination = await resolveDestination({ deliveryAddress: body.address }, req.user!.id)
    // Without a subtotal, judge the area as if the order meets the minimum.
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : Number(store.deliveryMinimum ?? 0) + 1000
    const eligibility = await deliveryEligibility(store, destination, subtotal)
    return reply.send({
      destination: destination && destination !== 'NOT_FOUND' ? { lat: destination.lat, lng: destination.lng, approximate: destination.approximate } : null,
      eligibility,
    })
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
    preHandler: [requireVendorWorkspace],
  }, async (req, reply) => {
    try {
      const input = BulkUpdatePrioritiesSchema.parse(req.body)

      if (!(await getAccountCapabilities(req.user!.id)).canAdministerStores) {
        for (const update of input.updates) {
          const z = await getDeliveryZone(update.zoneId)
          if (!z) return reply.code(404).send({ error: `Delivery zone ${update.zoneId} not found` })
          const s = await prisma.store.findUnique({ where: { id: z.storeId }, select: { id: true } })
          if (!s) return reply.code(404).send({ error: 'Store not found' })
          if (!(await userHasStoreAccess(req.user!.id, req.user!.role, z.storeId, 'settings'))) {
            return VendorErrors.forbidden(reply, 'You cannot access settings for this store')
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

