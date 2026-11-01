/**
 * Store-owned menu categories. A category is the label at `Item.optionsJson.category`; renaming,
 * merging or removing one rewrites every matching item of the store in one transaction, so a
 * failure leaves the menu exactly as it was rather than half-renamed.
 *
 * Matching mirrors apps/web/src/pages/vendor/menuCategories.ts: whitespace-normalized,
 * case-insensitive. Only `category` changes; platform classification (ItemTag, type, subtype) is kept.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { hasStorePermission, prisma } from '@packages/db'
import type { Prisma } from '@packages/db/generated/client'
import { requireVendorWorkspace } from '../middleware/vendorAccess.js'

const MAX_CATEGORY_LENGTH = 60

export function normalizeCategory(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().replaceAll(/\s+/g, ' ') : ''
}

const sameCategory = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0

const BodySchema = z.object({
  from: z.string().transform(normalizeCategory).pipe(z.string().min(1)),
  /** Empty removes the category; its items become uncategorized. */
  to: z.string().transform(normalizeCategory).pipe(z.string().max(MAX_CATEGORY_LENGTH)),
})

export async function menuCategoryRoutes(app: FastifyInstance) {
  app.post('/stores/:storeId/menu-categories/rename', {
    preHandler: [requireVendorWorkspace],
  }, async (req, reply) => {
    const { storeId } = req.params as { storeId: string }
    const userId = req.user?.id
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' })
    if (!await hasStorePermission(userId, storeId, 'MANAGE_ITEMS')) {
      return reply.code(403).send({ error: 'You cannot manage this store’s menu' })
    }

    const parsed = BodySchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Validation error', details: parsed.error.flatten() })
    const { from, to } = parsed.data

    const items = await prisma.item.findMany({ where: { storeId }, select: { id: true, optionsJson: true } })
    const others = items.filter((item) => !sameCategory(normalizeCategory(categoryOf(item.optionsJson)), from))
    const matching = items.filter((item) => !others.includes(item))

    // Merging into an existing category keeps that category's spelling.
    const target = to
      ? normalizeCategory(others.map((i) => categoryOf(i.optionsJson)).find((c) => sameCategory(normalizeCategory(c), to)) ?? to)
      : ''

    await prisma.$transaction(
      matching.map((item) => {
        const options = { ...(isRecord(item.optionsJson) ? item.optionsJson : {}) }
        if (target) options.category = target
        else delete options.category
        return prisma.item.update({ where: { id: item.id }, data: { optionsJson: options as Prisma.InputJsonValue } })
      }),
    )

    return reply.send({ from, to: target, updated: matching.length })
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function categoryOf(optionsJson: unknown): string {
  return isRecord(optionsJson) && typeof optionsJson.category === 'string' ? optionsJson.category : ''
}
