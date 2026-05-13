import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '@packages/db'
import { requireAdmin } from '../middleware/rbac.js'

const BulkDeleteStoresSchema = z.object({
  storeIds: z.array(z.string()).min(1).max(100), // Limit to 100 stores at a time
  reason: z.string().optional(), // Optional reason for audit trail
})

export async function adminStoresRoutes(app: FastifyInstance) {
  // Same auth as /api/admin/*: Bearer JWT via verifyJWT + ADMIN role (app.jwt is not registered).
  app.addHook('preHandler', requireAdmin())

  // GET /api/admin/stores - List all stores for admin
  app.get('/stores', async (request, reply) => {
    const { search, status, page = '1', limit = '50' } = request.query as {
      search?: string
      status?: string
      page?: string
      limit?: string
    }

    const pageNum = Math.max(Number(page), 1)
    const limitNum = Math.min(Math.max(Number(limit), 1), 100) // Max 100 per page
    const skip = (pageNum - 1) * limitNum

    try {
      const where: any = {}

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { addressCity: { contains: search, mode: 'insensitive' } },
          { owner: { email: { contains: search, mode: 'insensitive' } } },
        ]
      }

      if (status) {
        where.status = status
      }

      const [stores, total] = await Promise.all([
        prisma.store.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
            _count: {
              select: {
                items: true,
                orders: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.store.count({ where }),
      ])

      const pages = Math.ceil(total / limitNum)

      return reply.send({
        data: stores,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages,
          hasNext: pageNum < pages,
          hasPrev: pageNum > 1,
        },
      })
    } catch (error) {
      app.log.error(error, 'Failed to fetch admin stores')
      return reply.code(500).send({ error: 'Failed to fetch stores' })
    }
  })

  // DELETE /api/admin/stores/bulk - Bulk delete stores
  app.delete('/stores/bulk', async (request, reply) => {
    try {
      const { storeIds, reason } = BulkDeleteStoresSchema.parse(request.body)
      const adminUser = request.user

      // Validate all stores exist before deletion
      const stores = await prisma.store.findMany({
        where: { id: { in: storeIds } },
        include: {
          owner: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: {
              items: true,
              orders: true,
            },
          },
        },
      })

      if (stores.length === 0) {
        return reply.code(404).send({ error: 'No stores found' })
      }

      if (stores.length !== storeIds.length) {
        return reply.code(400).send({ 
          error: 'Some stores not found', 
          missing: storeIds.filter(id => !stores.find(s => s.id === id))
        })
      }

      // Check for stores with orders (business rule: don't delete stores with orders)
      const storesWithOrders = stores.filter(store => store._count.orders > 0)
      if (storesWithOrders.length > 0) {
        return reply.code(400).send({ 
          error: 'Cannot delete stores with existing orders',
          storesWithOrders: storesWithOrders.map(s => ({ id: s.id, name: s.name, orderCount: s._count.orders }))
        })
      }

      // Perform deletion in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Delete related data first (cascade handles most, but we'll be explicit)
        await tx.mediaAsset.deleteMany({
          where: { storeId: { in: storeIds } }
        })

        await tx.storeTag.deleteMany({
          where: { storeId: { in: storeIds } }
        })

        // Delete the stores
        const deletedStores = await tx.store.deleteMany({
          where: { id: { in: storeIds } }
        })

        return deletedStores
      })

      // Log the bulk delete action for audit
      await prisma.adminAuditLog.create({
        data: {
          adminId: adminUser.id,
          action: 'BULK_DELETE_STORES',
          targetType: 'Store',
          targetId: null,
          payload: {
            storeIds,
            storeNames: stores.map(s => ({ id: s.id, name: s.name, ownerEmail: s.owner.email })),
            reason: reason || 'No reason provided',
            deletedCount: result.count,
          },
        },
      })

      return reply.send({
        success: true,
        deletedCount: result.count,
        deletedStores: stores.map(s => ({ 
          id: s.id, 
          name: s.name, 
          ownerEmail: s.owner.email,
          itemCount: s._count.items 
        })),
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid request data', details: error.errors })
      }

      app.log.error(error, 'Failed to bulk delete stores')
      return reply.code(500).send({ error: 'Failed to delete stores' })
    }
  })

  // GET /api/admin/stores/:id - Get single store details for admin
  app.get('/stores/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const [store, kyc] = await Promise.all([
        prisma.store.findUnique({
          where: { id },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
            items: {
              select: {
                id: true,
                title: true,
                price: true,
                isActive: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 10, // Recent 10 items
            },
            mediaAssets: {
              where: { kind: 'IMAGE' },
              orderBy: { sortIndex: 'asc' },
              take: 5,
            },
            tags: {
              include: {
                tag: true,
              },
            },
            teamMembers: {
              select: {
                id: true,
                permissionsJson: true,
                user: { select: { id: true, name: true, email: true } },
              },
              take: 20,
            },
            _count: {
              select: {
                items: true,
                orders: true,
                mediaAssets: true,
              },
            },
          },
        }),
        prisma.vendorVerification.findFirst({
          where: { user: { storesOwned: { some: { id } } } },
          select: {
            id: true,
            status: true,
            businessName: true,
            businessType: true,
            submittedAt: true,
            reviewedAt: true,
            approvedAt: true,
            reviewNotes: true,
            rejectionReason: true,
          },
        }),
      ])

      if (!store) {
        return reply.code(404).send({ error: 'Store not found' })
      }

      return reply.send({ ...store, kyc })
    } catch (error) {
      app.log.error(error, 'Failed to fetch store details')
      return reply.code(500).send({ error: 'Failed to fetch store details' })
    }
  })
}
