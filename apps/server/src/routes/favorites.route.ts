import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  addFavoriteStore,
  removeFavoriteStore,
  getUserFavoriteStores,
  isStoreFavorited,
  addFavoriteItem,
  removeFavoriteItem,
  getUserFavoriteItems,
  reorderFromPreviousOrder,
  getUserOrderHistory,
} from '@packages/db'
import { requireRole } from '../middleware/rbac'
import { VendorErrors } from './vendor/vendorHelpers'

const FavoriteStoreSchema = z.object({
  storeId: z.string().uuid(),
})

const FavoriteItemSchema = z.object({
  itemId: z.string().uuid(),
})

const ReorderSchema = z.object({
  orderId: z.string().uuid(),
})

export const favoritesRoutes = async (app: FastifyInstance) => {
  // POST /favorites/stores - Add store to favorites
  app.post('/favorites/stores', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const input = FavoriteStoreSchema.parse(req.body)

      const favorite = await addFavoriteStore(userId, input.storeId)

      return reply.code(201).send({ favorite })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /favorites/stores/:storeId - Remove store from favorites
  app.delete('/favorites/stores/:storeId', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const params = req.params as { storeId: string }

      await removeFavoriteStore(userId, params.storeId)

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /favorites/stores - Get user's favorite stores
  app.get('/favorites/stores', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const favorites = await getUserFavoriteStores(userId)

      return reply.code(200).send({ favorites })
    } catch (error) {
      throw error
    }
  })

  // GET /favorites/stores/:storeId/check - Check if store is favorited
  app.get('/favorites/stores/:storeId/check', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const params = req.params as { storeId: string }

      const isFavorited = await isStoreFavorited(userId, params.storeId)

      return reply.code(200).send({ isFavorited })
    } catch (error) {
      throw error
    }
  })

  // POST /favorites/items - Add item to favorites
  app.post('/favorites/items', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const input = FavoriteItemSchema.parse(req.body)

      const favorite = await addFavoriteItem(userId, input.itemId)

      return reply.code(201).send({ favorite })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /favorites/items/:itemId - Remove item from favorites
  app.delete('/favorites/items/:itemId', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const params = req.params as { itemId: string }

      await removeFavoriteItem(userId, params.itemId)

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /favorites/items - Get user's favorite items
  app.get('/favorites/items', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const favorites = await getUserFavoriteItems(userId)

      return reply.code(200).send({ favorites })
    } catch (error) {
      throw error
    }
  })

  // POST /orders/reorder - Reorder from previous order
  app.post('/orders/reorder', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const input = ReorderSchema.parse(req.body)

      const cart = await reorderFromPreviousOrder(userId, input.orderId)

      return reply.code(200).send({ cart })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.errors })
      }
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('Unauthorized') ||
          error.message.includes('not available') ||
          error.message.includes('None of the items')
        ) {
          return reply.code(400).send({ error: error.message })
        }
      }
      throw error
    }
  })

  // GET /orders/me/history - Get order history for reorder
  app.get('/orders/me/history', {
    preHandler: [requireRole(['USER'])],
  }, async (req, reply) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return VendorErrors.unauthorized(reply)
      }

      const query = req.query as { limit?: string; offset?: string }

      const history = await getUserOrderHistory(userId, {
        limit: query.limit ? parseInt(query.limit) : undefined,
        offset: query.offset ? parseInt(query.offset) : undefined,
      })

      return reply.code(200).send({ history })
    } catch (error) {
      throw error
    }
  })
}

