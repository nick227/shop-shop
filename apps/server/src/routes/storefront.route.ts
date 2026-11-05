/**
 * A store's public storefront: its presentation config (draft and published), plus the live facts the
 * page shows around it (ordering state, hours, popular items, store media).
 *
 * - GET is public for published stores. The store's team can also ask for `?view=draft` to preview
 *   unpublished changes; everyone else always gets the published config (or the defaults).
 * - Saving a draft, publishing and discarding need MANAGE_STORE_SETTINGS.
 *
 * The ordering state is the same check checkout runs (`storeOrderingBlock`), so the storefront never
 * says a store is taking orders when checkout would refuse one, or the other way around.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { computeBundlePrice, hasStorePermission, prisma, storeOrderingBlock, STORE_ORDERING_MESSAGES } from '@packages/db'
import {
  defaultStorefrontConfig,
  normalizeStorefrontConfig,
  sameStorefrontConfig,
  type StorefrontConfig,
  type StorefrontRefs,
} from '@packages/shared/storefront'
import { requireVendorWorkspace } from '../middleware/vendorAccess.js'
import { HoursStatusService } from '../services/hoursStatus.service.js'

/** Order activity counted toward "popular". */
const POPULAR_WINDOW_DAYS = 60
const POPULAR_LIMIT = 24
const COUNTED_STATUSES = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'] as const

type Params = { storeId: string }

const hoursService = new HoursStatusService()

async function storeRefs(storeId: string): Promise<StorefrontRefs> {
  const [items, bundles, media] = await Promise.all([
    prisma.item.findMany({ where: { storeId }, select: { id: true } }),
    prisma.bundle.findMany({ where: { storeId }, select: { id: true } }),
    prisma.mediaAsset.findMany({ where: { storeId, itemId: null, bundleId: null }, select: { id: true } }),
  ])
  return {
    itemIds: new Set(items.map((i) => i.id)),
    bundleIds: new Set(bundles.map((b) => b.id)),
    mediaIds: new Set(media.map((m) => m.id)),
  }
}

/** The store's best sellers on sale now, most units first. */
export async function popularItemIds(storeId: string): Promise<string[]> {
  const since = new Date(Date.now() - POPULAR_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const rows = await prisma.orderItem.groupBy({
    by: ['itemId'],
    where: {
      itemId: { not: null },
      item: { storeId, isActive: true, isSoldOut: false },
      order: { storeId, createdAt: { gte: since }, status: { in: [...COUNTED_STATUSES] } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: POPULAR_LIMIT,
  })
  return rows.flatMap((row) => (row.itemId ? [row.itemId] : []))
}

/**
 * The store's active bundles as shoppers can buy them: contents, the price the pricing rules resolve,
 * and savings. A bundle with any item off sale is left out, since it cannot be ordered whole.
 */
export async function storefrontBundles(storeId: string) {
  const bundles = await prisma.bundle.findMany({
    where: { storeId, isActive: true },
    orderBy: [{ sortIndex: 'asc' }, { createdAt: 'asc' }],
    include: {
      pricing: { select: { pricingType: true, showSavings: true, savingsLabel: true } },
      items: {
        orderBy: { sortIndex: 'asc' },
        include: { item: { select: { id: true, title: true, price: true, isActive: true, isSoldOut: true, storeId: true } } },
      },
      media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1, select: { url: true } },
    },
  })
  const orderable = bundles.filter(
    (bundle) =>
      bundle.items.length > 0 &&
      bundle.items.every((line) => line.item.storeId === storeId && line.item.isActive && !line.item.isSoldOut),
  )
  return Promise.all(
    orderable.map(async (bundle) => {
      const price = await computeBundlePrice(bundle.id)
      return {
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        isActive: true,
        imageUrl: bundle.media[0]?.url ?? null,
        items: bundle.items.map((line) => ({
          itemId: line.item.id,
          title: line.item.title,
          price: Number(line.item.price),
          quantity: line.quantity,
        })),
        pricing: bundle.pricing,
        resolvedPrice: Number(price.resolvedPrice),
        itemSum: Number(price.itemSum),
        savings: Number(price.savings),
      }
    }),
  )
}

async function canManage(req: FastifyRequest, storeId: string): Promise<boolean> {
  const userId = req.user?.id
  return !!userId && hasStorePermission(userId, storeId, 'MANAGE_STORE_SETTINGS')
}

async function requireManage(req: FastifyRequest, reply: FastifyReply, storeId: string): Promise<boolean> {
  if (!req.user?.id) {
    void reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  if (!await canManage(req, storeId)) {
    void reply.code(403).send({ error: 'You cannot change this storefront' })
    return false
  }
  return true
}

function editorState(row: { draftJson: unknown; publishedJson: unknown; publishedAt: Date | null } | null) {
  const draft = normalizeStorefrontConfig(row?.draftJson)
  const published = row?.publishedJson ? normalizeStorefrontConfig(row.publishedJson) : null
  return {
    draft,
    published,
    publishedAt: row?.publishedAt?.toISOString() ?? null,
    // A store that never published shows the defaults; a draft equal to them has nothing to publish.
    hasUnpublishedChanges: !sameStorefrontConfig(draft, published ?? defaultStorefrontConfig()),
  }
}

export async function storefrontRoutes(app: FastifyInstance) {
  app.get('/stores/:storeId/storefront', async (req, reply) => {
    const { storeId } = req.params as Params
    const { view } = req.query as { view?: string }
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        status: true,
        isPublished: true,
        acceptingOrders: true,
        ordersPausedReason: true,
        pickupEnabled: true,
        deliveryEnabled: true,
        prepTimeMin: true,
        deliveryCharge: true,
        deliveryDistance: true,
        hoursJson: true,
        timezone: true,
        storefront: { select: { draftJson: true, publishedJson: true, publishedAt: true } },
      },
    })
    if (!store) return reply.code(404).send({ error: 'Store not found' })

    const userId = req.user?.id
    const isTeam = !!userId && await hasStorePermission(userId, storeId, 'VIEW_ITEMS')
    if (!store.isPublished && !isTeam) return reply.code(404).send({ error: 'Store not found' })

    const wantsDraft = view === 'draft' && await canManage(req, storeId)
    const row = store.storefront
    const config: StorefrontConfig = normalizeStorefrontConfig(wantsDraft ? row?.draftJson : row?.publishedJson)

    const [popular, media, hours, bundles] = await Promise.all([
      popularItemIds(storeId),
      prisma.mediaAsset.findMany({
        where: { storeId, itemId: null, bundleId: null },
        orderBy: [{ sortIndex: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, url: true, kind: true, altText: true },
      }),
      hoursService.getStoreHoursStatus(storeId).catch(() => null),
      storefrontBundles(storeId),
    ])

    const block = storeOrderingBlock(store)
    const posted = store.hoursJson as { storeHours?: unknown; timezone?: unknown } | null
    const storeHours = posted?.storeHours

    return reply.send({
      data: {
        config,
        view: wantsDraft ? 'draft' : 'published',
        ...(wantsDraft ? { editor: editorState(row) } : {}),
        ordering: {
          acceptingOrders: block === null,
          // The merchant's own note when they paused; otherwise the platform's message.
          message: block === null ? null : (block === 'PAUSED_BY_STORE' && store.ordersPausedReason) || STORE_ORDERING_MESSAGES[block],
          pickupEnabled: store.pickupEnabled,
          deliveryEnabled: store.deliveryEnabled,
          prepTimeMin: store.prepTimeMin,
          deliveryCharge: store.deliveryCharge === null ? null : Number(store.deliveryCharge),
          deliveryDistanceMiles: store.deliveryDistance === null ? null : Number(store.deliveryDistance),
        },
        // Posted hours are information; a store without them makes no open/closed claim.
        hours: storeHours
          ? {
              isOpenNow: hours?.isStoreOpen ?? false,
              today: hours?.todayHours?.store ?? null,
              timezone: store.timezone ?? (typeof posted?.timezone === 'string' ? posted.timezone : null),
              week: storeHours,
            }
          : null,
        popularItemIds: popular,
        media,
        bundles,
      },
    })
  })

  app.get('/stores/:storeId/storefront/editor', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const row = await prisma.storefrontConfig.findUnique({ where: { storeId } })
    return reply.send({ data: editorState(row) })
  })

  app.put('/stores/:storeId/storefront/draft', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const body = req.body as { config?: unknown } | undefined
    if (!body || typeof body !== 'object' || !('config' in body)) {
      return reply.code(400).send({ error: 'Send the storefront config' })
    }
    const draft = normalizeStorefrontConfig(body.config, await storeRefs(storeId))
    const row = await prisma.storefrontConfig.upsert({
      where: { storeId },
      create: { storeId, draftJson: draft as object, draftUpdatedAt: new Date() },
      update: { draftJson: draft as object, draftUpdatedAt: new Date() },
    })
    return reply.send({ data: editorState(row) })
  })

  app.post('/stores/:storeId/storefront/publish', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const existing = await prisma.storefrontConfig.findUnique({ where: { storeId } })
    // Check references again: an item or photo may have been deleted since the draft was saved.
    const published = normalizeStorefrontConfig(existing?.draftJson, await storeRefs(storeId))
    const now = new Date()
    const row = await prisma.storefrontConfig.upsert({
      where: { storeId },
      create: { storeId, draftJson: published as object, publishedJson: published as object, publishedAt: now, publishedById: req.user!.id },
      update: { draftJson: published as object, publishedJson: published as object, publishedAt: now, publishedById: req.user!.id },
    })
    return reply.send({ data: editorState(row) })
  })

  /** Throws away unpublished changes: the draft goes back to what shoppers see. */
  app.post('/stores/:storeId/storefront/discard', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const existing = await prisma.storefrontConfig.findUnique({ where: { storeId } })
    if (!existing) return reply.send({ data: editorState(null) })
    const restored = normalizeStorefrontConfig(existing.publishedJson)
    const row = await prisma.storefrontConfig.update({
      where: { storeId },
      data: { draftJson: restored as object, draftUpdatedAt: new Date() },
    })
    return reply.send({ data: editorState(row) })
  })
}
