import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { Prisma, prisma } from '@packages/db'

type TagTx = Pick<typeof prisma, 'neighborhoodTag' | 'placeTag'>

/** The discovery categories the web feed understands (`?category=`). */
export const TAG_CATEGORIES = ['food', 'grocery', 'convenience', 'retail', 'arts', 'outdoors'] as const

const blankToNull = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : null
}

export const TagInput = z
  .object({
    label: z.string().trim().min(1).max(60),
    kind: z.enum(['EDITORIAL', 'DISCOVERY']),
    categoryId: z.enum(TAG_CATEGORIES).nullable().optional(),
    searchQuery: z.string().trim().max(80).nullable().optional(),
    visible: z.boolean().optional(),
  })
  .refine((tag) => tag.kind === 'EDITORIAL' || Boolean(tag.categoryId || blankToNull(tag.searchQuery)), {
    message: 'Discovery tags need a category or a search query',
  })

export type NeighborhoodTagInput = z.infer<typeof TagInput>

export type PlaceTagView = {
  readonly id: string
  readonly label: string
  readonly kind: 'EDITORIAL' | 'DISCOVERY'
  readonly categoryId: string | null
  readonly searchQuery: string | null
  readonly sortIndex: number
  readonly visible: boolean
}

/**
 * Discovery tags are identified by their query mapping, so "Coffee" and "Coffee shops"
 * pointing at the same query share one tag and the label becomes a per-place rename.
 * Editorial tags are identified by their label as well.
 */
export function tagSlug(tag: NeighborhoodTagInput): string {
  const normal = (value: string | null | undefined) => (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const parts = [
    tag.kind.toLowerCase(),
    tag.kind === 'EDITORIAL' ? normal(tag.label) : '',
    tag.categoryId ?? '',
    normal(tag.searchQuery),
  ]
  return parts.join(':').slice(0, 160)
}

/** Replace a place's tags. Order in `tags` becomes the sort order. */
export async function syncPlaceTags(tx: TagTx, placeId: string, tags: readonly NeighborhoodTagInput[]) {
  const seen = new Set<string>()
  const rows: { tagId: string; label: string | null; sortIndex: number; visible: boolean }[] = []
  for (const input of tags) {
    const slug = tagSlug(input)
    if (seen.has(slug)) continue
    seen.add(slug)
    const tag = await tx.neighborhoodTag.upsert({
      where: { slug },
      create: {
        id: randomUUID(),
        slug,
        label: input.label,
        kind: input.kind,
        categoryId: input.categoryId ?? null,
        searchQuery: blankToNull(input.searchQuery),
      },
      update: {},
    })
    rows.push({
      tagId: tag.id,
      label: tag.label === input.label ? null : input.label,
      sortIndex: rows.length,
      visible: input.visible ?? true,
    })
  }
  await tx.placeTag.deleteMany({ where: { placeId } })
  if (rows.length > 0) await tx.placeTag.createMany({ data: rows.map((row) => ({ placeId, ...row })) })
}

export const placeTagInclude = {
  orderBy: { sortIndex: 'asc' },
  include: { tag: true },
} as const satisfies Prisma.Place$tagsArgs

type PlaceTagRow = Prisma.PlaceTagGetPayload<{ include: { tag: true } }>

export function placeTagView(row: PlaceTagRow): PlaceTagView {
  return {
    id: row.tag.id,
    label: row.label ?? row.tag.label,
    kind: row.tag.kind,
    categoryId: row.tag.categoryId,
    searchQuery: row.tag.searchQuery,
    sortIndex: row.sortIndex,
    visible: row.visible,
  }
}
