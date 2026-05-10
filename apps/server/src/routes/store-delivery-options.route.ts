import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

export const storeDeliveryOptionsRoutes = async (app: FastifyInstance) => {
  // Get store delivery options (public endpoint for customers)
  app.get('/stores/:storeId/delivery-options', async (req, reply) => {
    const { storeId } = req.params as { storeId: string }
    
    // For now, return mock data based on existing store settings
    // TODO: Update to use store_delivery_options table after Prisma regeneration
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { 
        deliveryEnabled: true,
        pickupEnabled: true,
        deliveryCharge: true
      }
    })

    if (!store) {
      return reply.code(404).send({ error: 'Store not found' })
    }

    const deliveryOptions: Array<{
      deliveryMode: string
      enabled: boolean
      feeDisclosure: string
      externalInfoUrl: string | null
      sortOrder: number
    }> = [
      {
        deliveryMode: 'PICKUP',
        enabled: store.pickupEnabled,
        feeDisclosure: 'Free',
        externalInfoUrl: null,
        sortOrder: 0
      }
    ]

    if (store.deliveryEnabled) {
      deliveryOptions.push({
        deliveryMode: 'IN_HOUSE',
        enabled: true,
        feeDisclosure: store.deliveryCharge ? `$${store.deliveryCharge} delivery fee` : 'Free delivery',
        externalInfoUrl: null,
        sortOrder: 1
      })
    }

    // Add DoorDash option if enabled (for now, enable in development)
    if (process.env.NODE_ENV === 'development') {
      deliveryOptions.push({
        deliveryMode: 'DOORDASH_DRIVE',
        enabled: true,
        feeDisclosure: '$5.99 delivery fee',
        externalInfoUrl: 'https://www.doordash.com',
        sortOrder: 2
      })
    }

    return reply.code(200).send({
      storeId,
      deliveryOptions: deliveryOptions.filter(option => option.enabled)
    })
  })
}
