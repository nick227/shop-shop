import { Prisma } from '../generated/client/index.js'
import type { ExtendedPrismaClient } from '../client.js'

export type RiverFeedNear = Readonly<{ lat: number; lng: number; radiusMiles: number }>

export type RiverFeedCursor = Readonly<{ p: number; t: string; id: string }>

function cursorWhere(cursor: RiverFeedCursor | undefined): Prisma.Sql {
  if (cursor === undefined) return Prisma.sql`TRUE`
  return Prisma.sql`(
    (p.priority < ${cursor.p})
    OR (p.priority = ${cursor.p} AND p.createdAt < ${new Date(cursor.t)})
    OR (p.priority = ${cursor.p} AND p.createdAt = ${new Date(cursor.t)} AND p.id < ${cursor.id})
  )`
}

function mediaWhere(requireMedia: boolean): Prisma.Sql {
  return requireMedia ? Prisma.sql`(JSON_LENGTH(p.mediaUrls) > 0)` : Prisma.sql`TRUE`
}

function storeWhere(storeId: string | undefined): Prisma.Sql {
  return storeId === undefined ? Prisma.sql`TRUE` : Prisma.sql`p.storeId = ${storeId}`
}

/**
 * Standard River feed ordering when geo is off (MySQL-safe media filter via JSON_LENGTH).
 */
export async function queryRiverFeedIdsStandard(
  prisma: ExtendedPrismaClient,
  args: Readonly<{
    take: number
    cursor?: RiverFeedCursor
    storeId?: string
    requireMedia: boolean
  }>,
): Promise<string[]> {
  const { take, cursor, storeId, requireMedia } = args

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT p.id
    FROM Post p
    INNER JOIN Store s ON p.storeId = s.id
    WHERE s.isPublished = TRUE
      AND ${storeWhere(storeId)}
      AND ${cursorWhere(cursor)}
      AND ${mediaWhere(requireMedia)}
    ORDER BY p.priority DESC, p.createdAt DESC, p.id DESC
    LIMIT ${take}
  `)

  return rows.map((r) => r.id)
}

/**
 * Ordered post ids for the River feed when geo filter is active (Haversine in SQL).
 * Requires Store.latitude/longitude; only joins published stores.
 */
export async function queryRiverFeedIdsWithGeo(
  prisma: ExtendedPrismaClient,
  args: Readonly<{
    take: number
    cursor?: RiverFeedCursor
    storeId?: string
    near: RiverFeedNear
    requireMedia: boolean
  }>,
): Promise<string[]> {
  const { take, cursor, storeId, near, requireMedia } = args

  const { lat, lng, radiusMiles } = near

  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT p.id
    FROM Post p
    INNER JOIN Store s ON p.storeId = s.id
    WHERE s.isPublished = TRUE
      AND s.latitude IS NOT NULL
      AND s.longitude IS NOT NULL
      AND ${storeWhere(storeId)}
      AND ${cursorWhere(cursor)}
      AND ${mediaWhere(requireMedia)}
      AND (
        3959 * ACOS(
          LEAST(1.0, GREATEST(-1.0,
            COS(RADIANS(${lat})) * COS(RADIANS(s.latitude)) * COS(RADIANS(s.longitude) - RADIANS(${lng}))
            + SIN(RADIANS(${lat})) * SIN(RADIANS(s.latitude))
          ))
        )
      ) <= ${radiusMiles}
    ORDER BY p.priority DESC, p.createdAt DESC, p.id DESC
    LIMIT ${take}
  `)

  return rows.map((r) => r.id)
}
