/**
 * National US ZIP reference data (GeoNames postal codes).
 *
 * Kept apart from the served-place directory: PostalCode lists only ZIPs in cities Shop-Shop
 * serves, and nothing here creates a Place or marks a city as served. Each point is a ZIP
 * centroid, good for "shops near 78758", never a delivery address.
 */
import { createHash, randomUUID } from 'crypto'
import { inflateRawSync } from 'zlib'
import { Prisma } from '../generated/client/index.js'
import type { ExtendedPrismaClient } from '../client.js'
import type { GeocodingResult } from '../services/geocoding-cache.service.js'

export const ZIP_DATASET = {
  name: 'us-zip',
  source: 'geonames',
  url: 'https://download.geonames.org/export/zip/US.zip',
  entry: 'US.txt',
  license: 'CC BY 4.0',
  attribution: 'ZIP code data © GeoNames (www.geonames.org), licensed under CC BY 4.0.',
} as const

/** GeoNames accuracy codes. 1 is estimated from neighboring codes; blank means unknown. */
const TRUSTED_ACCURACY = new Set([4, 6])

export function isQuestionableAccuracy(accuracy: number | null | undefined): boolean {
  return accuracy == null || !TRUSTED_ACCURACY.has(accuracy)
}

export interface ZipRow {
  readonly zip: string
  readonly city: string
  readonly state: string
  readonly county: string | null
  readonly latitude: number
  readonly longitude: number
  readonly accuracy: number | null
}

export type SkipReason = 'malformed' | 'invalidZip' | 'militaryOrNoState' | 'invalidCoordinates' | 'duplicate'

/**
 * Within the US and its territories: the states, Puerto Rico and the Caribbean, and the Pacific
 * (Hawaii, Alaska's Aleutians across the antimeridian, Guam, Samoa, the Marshall Islands).
 * Rejects missing geocodes (0,0) and overseas military post offices.
 */
export function validUsCoordinate(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  if (latitude === 0 && longitude === 0) return false
  if (latitude < -15 || latitude > 72) return false
  return (longitude >= -180 && longitude <= -64) || (longitude >= 130 && longitude <= 180)
}

/** Parse the tab-separated GeoNames country file (no header, 12 columns). */
export function parseGeoNamesZips(text: string): { readonly rows: ZipRow[]; readonly skipped: Record<SkipReason, number> } {
  const skipped: Record<SkipReason, number> = { malformed: 0, invalidZip: 0, militaryOrNoState: 0, invalidCoordinates: 0, duplicate: 0 }
  const byZip = new Map<string, ZipRow>()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const cols = line.split('\t')
    if (cols.length < 11) {
      skipped.malformed += 1
      continue
    }
    // Keep the ZIP as text: Number('00501') would lose the leading zeros.
    const zip = cols[1]!.trim()
    if (!/^\d{5}$/.test(zip)) {
      skipped.invalidZip += 1
      continue
    }
    const state = cols[4]!.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(state)) {
      skipped.militaryOrNoState += 1
      continue
    }
    const latitude = Number(cols[9])
    const longitude = Number(cols[10])
    if (!validUsCoordinate(latitude, longitude)) {
      skipped.invalidCoordinates += 1
      continue
    }
    const accuracyText = cols[11]?.trim() ?? ''
    const accuracy = accuracyText === '' ? null : Number.parseInt(accuracyText, 10)
    const row: ZipRow = {
      zip,
      city: cols[2]!.trim().slice(0, 120),
      state,
      county: cols[5]?.trim() ? cols[5].trim().slice(0, 120) : null,
      latitude,
      longitude,
      accuracy: Number.isFinite(accuracy) ? accuracy : null,
    }
    const existing = byZip.get(zip)
    if (existing) {
      skipped.duplicate += 1
      // Keep the better-placed record for a ZIP listed twice.
      if (isQuestionableAccuracy(existing.accuracy) && !isQuestionableAccuracy(row.accuracy)) byZip.set(zip, row)
      continue
    }
    byZip.set(zip, row)
  }
  return { rows: [...byZip.values()], skipped }
}

/** Read one stored or deflated entry from a zip archive using its central directory. */
export function readZipEntry(archive: Buffer, name: string): Buffer {
  const endSignature = 0x06054b50
  let end = -1
  for (let at = archive.length - 22; at >= Math.max(0, archive.length - 65_557); at -= 1) {
    if (archive.readUInt32LE(at) === endSignature) {
      end = at
      break
    }
  }
  if (end < 0) throw new Error('Not a zip archive')
  const entries = archive.readUInt16LE(end + 10)
  let at = archive.readUInt32LE(end + 16)
  for (let index = 0; index < entries; index += 1) {
    if (archive.readUInt32LE(at) !== 0x02014b50) throw new Error('Corrupt zip directory')
    const method = archive.readUInt16LE(at + 10)
    const compressedSize = archive.readUInt32LE(at + 20)
    const nameLength = archive.readUInt16LE(at + 28)
    const extraLength = archive.readUInt16LE(at + 30)
    const commentLength = archive.readUInt16LE(at + 32)
    const localOffset = archive.readUInt32LE(at + 42)
    const entryName = archive.toString('utf8', at + 46, at + 46 + nameLength)
    if (entryName === name) {
      const localNameLength = archive.readUInt16LE(localOffset + 26)
      const localExtraLength = archive.readUInt16LE(localOffset + 28)
      const start = localOffset + 30 + localNameLength + localExtraLength
      const data = archive.subarray(start, start + compressedSize)
      if (method === 0) return Buffer.from(data)
      if (method === 8) return inflateRawSync(data)
      throw new Error(`Unsupported zip compression method ${method}`)
    }
    at += 46 + nameLength + extraLength + commentLength
  }
  throw new Error(`${name} not found in archive`)
}

export interface ZipImportReport {
  readonly datasetId: string
  readonly checksum: string
  readonly sourceDate: Date
  readonly imported: number
  readonly removed: number
  readonly skipped: Record<SkipReason, number>
  readonly questionable: number
  /** True when this exact file was already imported and nothing changed. */
  readonly unchanged: boolean
}

type ZipReferenceDb = Pick<ExtendedPrismaClient, 'referenceDataset' | 'zipReference' | '$transaction'>

const BATCH = 1000

/**
 * Import a GeoNames US.zip archive. Safe to rerun: the same file (by checksum) is a no-op unless
 * forced, rows are upserted by ZIP, and ZIPs the publisher dropped are removed in the same
 * transaction. Served places and PostalCode are never touched.
 */
export async function importZipReference(
  db: ZipReferenceDb,
  input: { readonly archive: Buffer; readonly sourceDate: Date; readonly sourceUrl?: string; readonly force?: boolean },
): Promise<ZipImportReport> {
  const checksum = createHash('sha256').update(input.archive).digest('hex')
  const { rows, skipped } = parseGeoNamesZips(readZipEntry(input.archive, ZIP_DATASET.entry).toString('utf8'))
  if (rows.length === 0) throw new Error('The archive has no usable ZIP rows')
  const questionable = rows.filter((row) => isQuestionableAccuracy(row.accuracy)).length
  const skippedCount = Object.values(skipped).reduce((sum, count) => sum + count, 0)

  const existing = await db.referenceDataset.findUnique({ where: { name_checksum: { name: ZIP_DATASET.name, checksum } } })
  if (existing && !input.force) {
    const loaded = await db.zipReference.count({ where: { datasetId: existing.id } })
    if (loaded === rows.length) {
      return { datasetId: existing.id, checksum, sourceDate: existing.sourceDate, imported: 0, removed: 0, skipped, questionable, unchanged: true }
    }
  }

  const datasetId = existing?.id ?? randomUUID()
  const removed = await db.$transaction(async (tx) => {
    const dataset = {
      name: ZIP_DATASET.name,
      source: ZIP_DATASET.source,
      sourceUrl: input.sourceUrl ?? ZIP_DATASET.url,
      sourceDate: input.sourceDate,
      checksum,
      license: ZIP_DATASET.license,
      attribution: ZIP_DATASET.attribution,
      recordCount: rows.length,
      skippedCount,
    }
    await tx.referenceDataset.upsert({ where: { id: datasetId }, create: { id: datasetId, ...dataset }, update: { ...dataset, importedAt: new Date() } })
    for (let start = 0; start < rows.length; start += BATCH) {
      const values = rows.slice(start, start + BATCH).map((row) => Prisma.sql`(${row.zip}, ${row.city}, ${row.state}, ${row.county}, ${row.latitude.toFixed(8)}, ${row.longitude.toFixed(8)}, ${row.accuracy}, ${ZIP_DATASET.source}, ${input.sourceDate}, ${datasetId}, NOW(3))`)
      await tx.$executeRaw`
        INSERT INTO \`ZipReference\` (\`zip\`, \`city\`, \`state\`, \`county\`, \`latitude\`, \`longitude\`, \`accuracy\`, \`source\`, \`sourceDate\`, \`datasetId\`, \`updatedAt\`)
        VALUES ${Prisma.join(values)}
        ON DUPLICATE KEY UPDATE
          \`city\` = VALUES(\`city\`), \`state\` = VALUES(\`state\`), \`county\` = VALUES(\`county\`),
          \`latitude\` = VALUES(\`latitude\`), \`longitude\` = VALUES(\`longitude\`), \`accuracy\` = VALUES(\`accuracy\`),
          \`source\` = VALUES(\`source\`), \`sourceDate\` = VALUES(\`sourceDate\`), \`datasetId\` = VALUES(\`datasetId\`), \`updatedAt\` = NOW(3)`
    }
    // Every row in this file now points at this dataset; anything else from the same source was dropped upstream.
    const stale = await tx.zipReference.deleteMany({ where: { source: ZIP_DATASET.source, datasetId: { not: datasetId } } })
    return stale.count
  }, { timeout: 180_000, maxWait: 10_000 })

  return { datasetId, checksum, sourceDate: input.sourceDate, imported: rows.length, removed, skipped, questionable, unchanged: false }
}

export interface ZipReferenceHit {
  readonly result: GeocodingResult
  readonly accuracy: number | null
  /** Estimated or unknown placement: worth confirming with an external provider. */
  readonly questionable: boolean
}

export async function lookupZipReference(db: Pick<ExtendedPrismaClient, 'zipReference'>, zip: string): Promise<ZipReferenceHit | null> {
  if (!/^\d{5}$/.test(zip)) return null
  const row = await db.zipReference.findUnique({ where: { zip } })
  if (!row) return null
  const questionable = isQuestionableAccuracy(row.accuracy)
  return {
    accuracy: row.accuracy,
    questionable,
    result: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      city: row.city,
      state: row.state,
      zip: row.zip,
      country: 'US',
      formattedAddress: `${row.city}, ${row.state} ${row.zip}`,
      // A ZIP centroid: never "high", which address lookups treat as a precise location.
      confidence: questionable ? 'low' : 'medium',
      source: 'geonames',
    },
  }
}
