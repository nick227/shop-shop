import type { MediaKind } from '../generated/client/index.js'
import type { ExtendedPrismaClient } from '../client.js'
import type { MediaItem } from './river.service.js'

export const riverIngestKey = {
  store: (storeId: string) => `auto_store:${storeId}`,
  itemLive: (itemId: string) => `item_live:${itemId}`,
  itemRestock: (itemId: string) => `item_restock:${itemId}`,
} as const

function mediaRowToItem(row: { kind: MediaKind; url: string }): MediaItem {
  const type = row.kind === 'VIDEO' ? 'video' : 'image'
  return { type, url: row.url }
}

export async function firstStoreImageMedia(
  db: ExtendedPrismaClient,
  storeId: string,
): Promise<MediaItem[] | null> {
  const row = await db.mediaAsset.findFirst({
    where: { storeId, kind: { in: ['IMAGE', 'VIDEO'] } },
    orderBy: { sortIndex: 'asc' },
    select: { kind: true, url: true },
  })
  if (!row) return null
  return [mediaRowToItem(row)]
}

export async function firstItemImageMedia(
  db: ExtendedPrismaClient,
  itemId: string,
): Promise<MediaItem[] | null> {
  const row = await db.mediaAsset.findFirst({
    where: { itemId, kind: { in: ['IMAGE', 'VIDEO'] } },
    orderBy: { sortIndex: 'asc' },
    select: { kind: true, url: true },
  })
  if (!row) return null
  return [mediaRowToItem(row)]
}

export async function loadAutomationKeys(db: ExtendedPrismaClient): Promise<Set<string>> {
  const rows = await db.post.findMany({
    where: { automationKey: { not: null } },
    select: { automationKey: true },
  })
  return new Set(
    rows.map((r) => r.automationKey).filter((k): k is string => typeof k === 'string' && k.length > 0),
  )
}
