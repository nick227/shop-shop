import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'
import { userHasStoreAccess } from '../middleware/storeAccess.js'

/**
 * StoreDeliveryOption schema only persists: enabled, feeDisclosure, externalInfoUrl,
 * sortOrder. Rich DoorDash settings (fees, contact, radius, etc.) are not modeled —
 * any frontend that needs them must store them elsewhere or be reconciled with the schema.
 */
const storeDoorDashConfigSchema = z.object({
  inHouseDeliveryEnabled: z.boolean().default(false),
  doorDashDeliveryEnabled: z.boolean().default(false),
  doorDashInfoUrl: z.string().url().optional().nullable(),
  feeDisclosure: z.string().optional().nullable(),
})

type DoorDashConfigResponse = Readonly<{
  inHouseDeliveryEnabled: boolean
  doorDashDeliveryEnabled: boolean
  doorDashInfoUrl: string | null
  feeDisclosure: string | null
}>

const IN_HOUSE_MODE = 'STORE_MANAGED_DELIVERY'
const DOORDASH_MODE = 'DOORDASH_DRIVE'

export const storeDoorDashConfigRoutes = async (app: FastifyInstance) => {
  app.get(
    '/api/stores/:storeId/doordash-config',
    { preHandler: authenticate },
    async (req, reply) => {
      const { storeId } = req.params as { storeId: string }

      const hasAccess = await userHasStoreAccess(
        req.user!.id,
        req.user!.role,
        storeId,
        'settings',
      )
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      const options = await prisma.storeDeliveryOption.findMany({
        where: { storeId, deliveryMode: { in: [IN_HOUSE_MODE, DOORDASH_MODE] } },
        select: {
          deliveryMode: true,
          enabled: true,
          externalInfoUrl: true,
          feeDisclosure: true,
        },
      })

      const inHouse = options.find((o) => o.deliveryMode === IN_HOUSE_MODE)
      const doorDash = options.find((o) => o.deliveryMode === DOORDASH_MODE)

      const config: DoorDashConfigResponse = {
        inHouseDeliveryEnabled: inHouse?.enabled ?? false,
        doorDashDeliveryEnabled: doorDash?.enabled ?? false,
        doorDashInfoUrl: doorDash?.externalInfoUrl ?? null,
        feeDisclosure: doorDash?.feeDisclosure ?? inHouse?.feeDisclosure ?? null,
      }

      return reply.code(200).send(config)
    },
  )

  app.put(
    '/api/stores/:storeId/doordash-config',
    { preHandler: authenticate },
    async (req, reply) => {
      const { storeId } = req.params as { storeId: string }

      const hasAccess = await userHasStoreAccess(
        req.user!.id,
        req.user!.role,
        storeId,
        'settings',
      )
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      let data: z.infer<typeof storeDoorDashConfigSchema>
      try {
        data = storeDoorDashConfigSchema.parse(req.body)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .code(400)
            .send({ error: 'Invalid configuration data', details: error.errors })
        }
        throw error
      }

      await prisma.storeDeliveryOption.upsert({
        where: { storeId_deliveryMode: { storeId, deliveryMode: IN_HOUSE_MODE } },
        update: {
          enabled: data.inHouseDeliveryEnabled,
          feeDisclosure: data.feeDisclosure ?? null,
        },
        create: {
          storeId,
          deliveryMode: IN_HOUSE_MODE,
          enabled: data.inHouseDeliveryEnabled,
          feeDisclosure: data.feeDisclosure ?? null,
        },
      })

      await prisma.storeDeliveryOption.upsert({
        where: { storeId_deliveryMode: { storeId, deliveryMode: DOORDASH_MODE } },
        update: {
          enabled: data.doorDashDeliveryEnabled,
          externalInfoUrl: data.doorDashInfoUrl ?? null,
          feeDisclosure: data.feeDisclosure ?? null,
        },
        create: {
          storeId,
          deliveryMode: DOORDASH_MODE,
          enabled: data.doorDashDeliveryEnabled,
          externalInfoUrl: data.doorDashInfoUrl ?? null,
          feeDisclosure: data.feeDisclosure ?? null,
        },
      })

      const response: DoorDashConfigResponse = {
        inHouseDeliveryEnabled: data.inHouseDeliveryEnabled,
        doorDashDeliveryEnabled: data.doorDashDeliveryEnabled,
        doorDashInfoUrl: data.doorDashInfoUrl ?? null,
        feeDisclosure: data.feeDisclosure ?? null,
      }

      return reply.code(200).send(response)
    },
  )

  app.delete(
    '/api/stores/:storeId/doordash-config',
    { preHandler: authenticate },
    async (req, reply) => {
      const { storeId } = req.params as { storeId: string }

      const hasAccess = await userHasStoreAccess(
        req.user!.id,
        req.user!.role,
        storeId,
        'settings',
      )
      if (!hasAccess) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      await prisma.storeDeliveryOption.updateMany({
        where: {
          storeId,
          deliveryMode: { in: [IN_HOUSE_MODE, DOORDASH_MODE] },
        },
        data: { enabled: false },
      })

      return reply.code(200).send({ success: true })
    },
  )
}
