/**
 * A store's menu sections ("Breakfast", "Drinks"). Sections belong to the store and exist apart from
 * items: a vendor can create, rename, describe, reorder and hide them, and an empty section stays editable.
 *
 * GET answers two audiences:
 * - the store's team (VIEW_ITEMS) gets every section in menu order with its item count;
 * - everyone else, or the team with `?view=shopper`, gets only what a shopper sees: visible sections of a
 *   published store that hold at least one item on sale.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { hasStorePermission, prisma } from '@packages/db'
import { requireVendorWorkspace } from '../middleware/vendorAccess.js'

export const MAX_SECTION_NAME = 120
export const MAX_SECTION_DESCRIPTION = 500

/** Trims and collapses whitespace so "Tacos " and "Tacos" are one section. */
export function normalizeSectionName(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().replaceAll(/\s+/g, ' ') : ''
}

const name = z.string().transform(normalizeSectionName).pipe(z.string().min(1, 'Name the section').max(MAX_SECTION_NAME))
const description = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().max(MAX_SECTION_DESCRIPTION))
  .nullable()

const CreateSchema = z.object({ name, description: description.optional(), isVisible: z.boolean().optional() })
const UpdateSchema = z
  .object({ name: name.optional(), description: description.optional(), isVisible: z.boolean().optional() })
  .refine((body) => Object.keys(body).length > 0, 'Nothing to change')
const OrderSchema = z.object({ sectionIds: z.array(z.string()).min(1) })

export interface MenuSectionDto {
  readonly id: string
  readonly name: string
  readonly description: string | null
  readonly sortIndex: number
  readonly isVisible: boolean
  /** Items in the section; for shoppers, only items on sale. */
  readonly itemCount: number
}

type Params = { storeId: string; sectionId?: string }

async function requireManage(req: FastifyRequest, reply: FastifyReply, storeId: string): Promise<boolean> {
  const userId = req.user?.id
  if (!userId) {
    void reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  if (!await hasStorePermission(userId, storeId, 'MANAGE_ITEMS')) {
    void reply.code(403).send({ error: 'You cannot manage this store’s menu' })
    return false
  }
  return true
}

/** Checked by code: `@packages/db` may load its own copy of the Prisma error classes, so `instanceof` can miss. */
const isDuplicateName = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2002'

const duplicate = (reply: FastifyReply, sectionName: string) =>
  reply.code(409).send({ error: `This menu already has a section called “${sectionName}”` })

export async function listMenuSections(storeId: string, audience: 'team' | 'shopper'): Promise<MenuSectionDto[]> {
  const shopper = audience === 'shopper'
  const sections = await prisma.menuSection.findMany({
    where: { storeId, ...(shopper ? { isVisible: true } : {}) },
    orderBy: [{ sortIndex: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      sortIndex: true,
      isVisible: true,
      _count: { select: { items: shopper ? { where: { isActive: true } } : true } },
    },
  })
  return sections
    .map(({ _count, ...section }) => ({ ...section, itemCount: _count.items }))
    .filter((section) => !shopper || section.itemCount > 0)
}

export async function menuSectionRoutes(app: FastifyInstance) {
  app.get('/stores/:storeId/menu-sections', async (req, reply) => {
    const { storeId } = req.params as Params
    const { view } = req.query as { view?: string }
    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { isPublished: true } })
    if (!store) return reply.code(404).send({ error: 'Store not found' })

    const userId = req.user?.id
    const isTeam = !!userId && await hasStorePermission(userId, storeId, 'VIEW_ITEMS')
    if (isTeam && view !== 'shopper') return reply.send({ data: await listMenuSections(storeId, 'team') })
    if (!store.isPublished && !isTeam) return reply.code(404).send({ error: 'Store not found' })
    return reply.send({ data: await listMenuSections(storeId, 'shopper') })
  })

  app.post('/stores/:storeId/menu-sections', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const parsed = CreateSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Validation error' })

    // New sections go to the end of the menu.
    const last = await prisma.menuSection.aggregate({ where: { storeId }, _max: { sortIndex: true } })
    try {
      const section = await prisma.menuSection.create({
        data: {
          storeId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          isVisible: parsed.data.isVisible ?? true,
          sortIndex: (last._max.sortIndex ?? -1) + 1,
        },
      })
      return reply.code(201).send({ data: { ...section, itemCount: 0 } })
    } catch (error) {
      if (isDuplicateName(error)) return duplicate(reply, parsed.data.name)
      throw error
    }
  })

  app.patch('/stores/:storeId/menu-sections/:sectionId', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId, sectionId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const parsed = UpdateSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Validation error' })

    const existing = await prisma.menuSection.findFirst({ where: { id: sectionId, storeId }, select: { id: true } })
    if (!existing) return reply.code(404).send({ error: 'Section not found' })
    const { name: nextName, description: nextDescription, isVisible } = parsed.data
    try {
      const section = await prisma.menuSection.update({
        where: { id: existing.id },
        data: {
          ...(nextName === undefined ? {} : { name: nextName }),
          ...(nextDescription === undefined ? {} : { description: nextDescription || null }),
          ...(isVisible === undefined ? {} : { isVisible }),
        },
        include: { _count: { select: { items: true } } },
      })
      const { _count, ...rest } = section
      return reply.send({ data: { ...rest, itemCount: _count.items } })
    } catch (error) {
      if (isDuplicateName(error)) return duplicate(reply, nextName ?? '')
      throw error
    }
  })

  /** Sets the whole menu order at once; the list must name every section of the store exactly once. */
  app.put('/stores/:storeId/menu-sections/order', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const parsed = OrderSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Send every section id in the new order' })

    const ids = parsed.data.sectionIds
    const existing = await prisma.menuSection.findMany({ where: { storeId }, select: { id: true } })
    const known = new Set(existing.map((section) => section.id))
    if (new Set(ids).size !== ids.length || ids.length !== known.size || !ids.every((id) => known.has(id))) {
      return reply.code(409).send({ error: 'The menu changed since it was loaded. Reload and try again.' })
    }
    await prisma.$transaction(
      ids.map((id, sortIndex) => prisma.menuSection.update({ where: { id }, data: { sortIndex } })),
    )
    return reply.send({ data: await listMenuSections(storeId, 'team') })
  })

  /** Removes the section; its items stay on the menu, outside any section. */
  app.delete('/stores/:storeId/menu-sections/:sectionId', { preHandler: [requireVendorWorkspace] }, async (req, reply) => {
    const { storeId, sectionId } = req.params as Params
    if (!await requireManage(req, reply, storeId)) return reply
    const { count } = await prisma.menuSection.deleteMany({ where: { id: sectionId, storeId } })
    if (count === 0) return reply.code(404).send({ error: 'Section not found' })
    return reply.code(204).send()
  })
}

/** Throws when `sectionId` is set but is not one of `storeId`'s sections. */
export async function assertSectionInStore(sectionId: unknown, storeId: string): Promise<void> {
  if (sectionId === undefined || sectionId === null) return
  if (typeof sectionId !== 'string') throw new Error('Invalid section')
  const section = await prisma.menuSection.findFirst({ where: { id: sectionId, storeId }, select: { id: true } })
  if (!section) throw new Error('Section not found in this store')
}
