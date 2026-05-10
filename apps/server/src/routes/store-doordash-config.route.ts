import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { authenticate } from '../middleware/auth.js'

const storeDoorDashConfigSchema = z.object({
  inHouseDeliveryEnabled: z.boolean().default(false),
  doorDashDeliveryEnabled: z.boolean().default(false),
  inHouseDeliveryFee: z.number().min(0).default(0),
  doorDashDeliveryFee: z.number().min(0).default(0),
  doorDashInfoUrl: z.string().url().optional(),
  doorDashSupportUrl: z.string().url().optional(),
  minimumOrderAmount: z.number().min(0).default(0),
  maxDeliveryRadius: z.number().min(0.1).default(10),
  pickupContactName: z.string().min(1).optional(),
  pickupContactPhone: z.string().min(1).optional(),
  deliveryInstructions: z.string().optional(),
  // In-house delivery specific settings
  inHouseFreeDeliveryThreshold: z.number().min(0).optional(),
  inHouseDistanceFee: z.number().min(0).optional(),
  inHouseMaxDeliveryDistance: z.number().min(0.1).optional(),
})

export const storeDoorDashConfigRoutes = async (app: FastifyInstance) => {
  // Get store DoorDash configuration
  app.get('/api/stores/:storeId/doordash-config', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { storeId } = req.params as { storeId: string }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Get store delivery options
      const storeDeliveryOptions = await prisma.storeDeliveryOption.findMany({
        where: { storeId },
        select: {
          deliveryMode: true,
          enabled: true,
          feeCents: true,
          metadata: true
        }
      })

      // Convert to DoorDash config format
      const inHouseOption = storeDeliveryOptions.find(opt => opt.deliveryMode === 'STORE_MANAGED_DELIVERY')
      const doorDashOption = storeDeliveryOptions.find(opt => opt.deliveryMode === 'DOORDASH_DRIVE')

      const config = {
        inHouseDeliveryEnabled: inHouseOption?.enabled ?? false,
        doorDashDeliveryEnabled: doorDashOption?.enabled ?? false,
        inHouseDeliveryFee: (inHouseOption?.feeCents ?? 0) / 100,
        doorDashDeliveryFee: (doorDashOption?.feeCents ?? 0) / 100,
        doorDashInfoUrl: doorDashOption?.metadata?.infoUrl ?? '',
        doorDashSupportUrl: doorDashOption?.metadata?.supportUrl ?? '',
        minimumOrderAmount: doorDashOption?.metadata?.minimumOrderAmount ?? 0,
        maxDeliveryRadius: doorDashOption?.metadata?.maxDeliveryRadius ?? 10,
        pickupContactName: doorDashOption?.metadata?.pickupContactName ?? '',
        pickupContactPhone: doorDashOption?.metadata?.pickupContactPhone ?? '',
        deliveryInstructions: doorDashOption?.metadata?.deliveryInstructions ?? '',
      }

      return reply.code(200).send(config)

    } catch (error) {
      console.error('Error getting store DoorDash config:', error)
      return reply.code(500).send({ 
        error: 'Failed to get DoorDash configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Update store DoorDash configuration
  app.put('/api/stores/:storeId/doordash-config', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { storeId } = req.params as { storeId: string }
      const validatedData = storeDoorDashConfigSchema.parse(req.body)

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Validate DoorDash configuration before enabling
      if (validatedData.doorDashDeliveryEnabled) {
        if (!validatedData.pickupContactName?.trim()) {
          return reply.code(400).send({ error: 'Pickup contact name is required when DoorDash is enabled' })
        }
        
        if (!validatedData.pickupContactPhone?.trim()) {
          return reply.code(400).send({ error: 'Pickup contact phone is required when DoorDash is enabled' })
        }
      }

      // Update or create in-house delivery option
      await prisma.storeDeliveryOption.upsert({
        where: {
          storeId_deliveryMode: {
            storeId,
            deliveryMode: 'STORE_MANAGED_DELIVERY'
          }
        },
        update: {
          enabled: validatedData.inHouseDeliveryEnabled,
          feeCents: Math.round(validatedData.inHouseDeliveryFee * 100),
          metadata: null
        },
        create: {
          storeId,
          deliveryMode: 'STORE_MANAGED_DELIVERY',
          enabled: validatedData.inHouseDeliveryEnabled,
          feeCents: Math.round(validatedData.inHouseDeliveryFee * 100),
          metadata: null
        }
      })

      // Update or create DoorDash delivery option
      const doorDashMetadata = {
        infoUrl: validatedData.doorDashInfoUrl || null,
        supportUrl: validatedData.doorDashSupportUrl || null,
        minimumOrderAmount: validatedData.minimumOrderAmount,
        maxDeliveryRadius: validatedData.maxDeliveryRadius,
        pickupContactName: validatedData.pickupContactName || null,
        pickupContactPhone: validatedData.pickupContactPhone || null,
        deliveryInstructions: validatedData.deliveryInstructions || null
      }

      await prisma.storeDeliveryOption.upsert({
        where: {
          storeId_deliveryMode: {
            storeId,
            deliveryMode: 'DOORDASH_DRIVE'
          }
        },
        update: {
          enabled: validatedData.doorDashDeliveryEnabled,
          feeCents: Math.round(validatedData.doorDashDeliveryFee * 100),
          metadata: doorDashMetadata
        },
        create: {
          storeId,
          deliveryMode: 'DOORDASH_DRIVE',
          enabled: validatedData.doorDashDeliveryEnabled,
          feeCents: Math.round(validatedData.doorDashDeliveryFee * 100),
          metadata: doorDashMetadata
        }
      })

      // Return updated configuration
      const config = {
        inHouseDeliveryEnabled: validatedData.inHouseDeliveryEnabled,
        doorDashDeliveryEnabled: validatedData.doorDashDeliveryEnabled,
        inHouseDeliveryFee: validatedData.inHouseDeliveryFee,
        doorDashDeliveryFee: validatedData.doorDashDeliveryFee,
        doorDashInfoUrl: validatedData.doorDashInfoUrl || '',
        doorDashSupportUrl: validatedData.doorDashSupportUrl || '',
        minimumOrderAmount: validatedData.minimumOrderAmount,
        maxDeliveryRadius: validatedData.maxDeliveryRadius,
        pickupContactName: validatedData.pickupContactName || '',
        pickupContactPhone: validatedData.pickupContactPhone || '',
        deliveryInstructions: validatedData.deliveryInstructions || '',
        inHouseFreeDeliveryThreshold: validatedData.inHouseFreeDeliveryThreshold,
        inHouseDistanceFee: validatedData.inHouseDistanceFee,
        inHouseMaxDeliveryDistance: validatedData.inHouseMaxDeliveryDistance,
      }

      return reply.code(200).send(config)

    } catch (error) {
      console.error('Error updating store DoorDash config:', error)
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid configuration data', 
          details: error.errors 
        })
      }

      return reply.code(500).send({ 
        error: 'Failed to update DoorDash configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Delete store DoorDash configuration
  app.delete('/api/stores/:storeId/doordash-config', { preHandler: authenticate }, async (req, reply) => {
    try {
      const { storeId } = req.params as { storeId: string }

      // Check if user owns/manages the store
      const storeMember = await prisma.storeMember.findFirst({
        where: {
          userId: req.user!.id,
          storeId,
          role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
        }
      })

      if (!storeMember) {
        return reply.code(403).send({ error: 'Access denied: You do not manage this store' })
      }

      // Disable both delivery options
      await prisma.storeDeliveryOption.updateMany({
        where: {
          storeId,
          deliveryMode: { in: ['STORE_MANAGED_DELIVERY', 'DOORDASH_DRIVE'] }
        },
        data: {
          enabled: false
        }
      })

      return reply.code(200).send({ success: true })

    } catch (error) {
      console.error('Error deleting store DoorDash config:', error)
      return reply.code(500).send({ 
        error: 'Failed to delete DoorDash configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
