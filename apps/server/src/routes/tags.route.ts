/**
 * GET /api/tags — enumerate public search tags, grouped by category.
 * Supports ?target=STORE|ITEM|BOTH and ?category=DIETARY etc.
 * Response is cacheable (tags change rarely).
 */
import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

interface TagGroup {
  category: string
  label: string
  target: string
  tags: { slug: string; label: string }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  DIETARY: 'Dietary',
  FREE_FROM: 'Free From',
  CONTAINS_ALLERGEN: 'Contains Allergen',
  CUISINE: 'Cuisine',
  FEATURE: 'Features',
  MEAL_TIME: 'Meal Time',
  ITEM_TYPE: 'Item Type',
  OCCASION: 'Occasion',
}

export const tagsRoutes = async (app: FastifyInstance) => {
  app.get('/tags', async (req, reply) => {
    const raw = req.query as Record<string, unknown>
    const targetFilter = typeof raw.target === 'string' ? raw.target.toUpperCase() : undefined
    const categoryFilter = typeof raw.category === 'string' ? raw.category.toUpperCase() : undefined

    const tags = await prisma.tag.findMany({
      where: {
        isPublic: true,
        ...(targetFilter ? { target: targetFilter as any } : {}),
        ...(categoryFilter ? { category: categoryFilter as any } : {}),
      },
      select: { slug: true, label: true, category: true, target: true, sortOrder: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    })

    // Group by category in a single pass
    const groupMap = new Map<string, TagGroup>()
    for (const tag of tags) {
      let group = groupMap.get(tag.category)
      if (!group) {
        group = {
          category: tag.category,
          label: CATEGORY_LABELS[tag.category] ?? tag.category,
          target: tag.target,
          tags: [],
        }
        groupMap.set(tag.category, group)
      }
      group.tags.push({ slug: tag.slug, label: tag.label })
    }

    reply.header('Cache-Control', 'public, max-age=300')
    return reply.send({ groups: [...groupMap.values()] })
  })
}
