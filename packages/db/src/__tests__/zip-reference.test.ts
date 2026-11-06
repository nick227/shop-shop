import { deflateRawSync } from 'zlib'
import { describe, expect, it, vi } from 'vitest'
import { importZipReference, isQuestionableAccuracy, parseGeoNamesZips, readZipEntry, validUsCoordinate } from '../geo/zip-reference'

const line = (zip: string, city: string, state: string, lat: string, lng: string, accuracy = '4') =>
  ['US', zip, city, state ? 'State' : '', state, 'County', '001', '', '', lat, lng, accuracy].join('\t')

/** Smallest valid zip archive with one deflated entry: local header, data, central directory, end record. */
function zipArchive(name: string, content: string): Buffer {
  const data = deflateRawSync(Buffer.from(content))
  const nameBytes = Buffer.from(name)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(8, 8)
  local.writeUInt32LE(data.length, 18)
  local.writeUInt32LE(Buffer.byteLength(content), 22)
  local.writeUInt16LE(nameBytes.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(8, 10)
  central.writeUInt32LE(data.length, 20)
  central.writeUInt32LE(Buffer.byteLength(content), 24)
  central.writeUInt16LE(nameBytes.length, 28)
  central.writeUInt32LE(0, 42)
  const directoryOffset = local.length + nameBytes.length + data.length
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + nameBytes.length, 12)
  end.writeUInt32LE(directoryOffset, 16)
  return Buffer.concat([local, nameBytes, data, central, nameBytes, end])
}

const FILE = [
  line('78758', 'Austin', 'TX', '30.3764', '-97.7078'),
  line('00501', 'Holtsville', 'NY', '40.8154', '-73.0451'),
  line('02108', 'Boston', 'MA', '42.3576', '-71.0684'),
  line('09001', 'APO AA', '', '38.1105', '15.6613', ''),
  line('12345', 'Nowhere', 'NY', '0', '0'),
  line('99553', 'Akutan', 'AK', '54.143', '-165.7854', '1'),
  line('96860', 'Jbphh', 'HI', '21.316', '-157.8677', '1'),
  line('96860', 'Pearl Harbor', 'HI', '21.3448', '-157.9774', '4'),
  line('7875', 'Short', 'TX', '30.1', '-97.1'),
].join('\n')

describe('GeoNames ZIP parsing', () => {
  it('keeps ZIPs as five-digit text, so leading zeros survive', () => {
    const { rows } = parseGeoNamesZips(FILE)
    expect(rows.map((row) => row.zip)).toEqual(expect.arrayContaining(['00501', '02108', '78758']))
    expect(rows.find((row) => row.zip === '00501')).toMatchObject({ city: 'Holtsville', state: 'NY', latitude: 40.8154, accuracy: 4 })
  })

  it('skips military post offices, missing geocodes, and malformed ZIPs, and counts why', () => {
    const { rows, skipped } = parseGeoNamesZips(FILE)
    expect(rows.map((row) => row.zip)).not.toEqual(expect.arrayContaining(['09001', '12345', '7875']))
    expect(skipped).toMatchObject({ militaryOrNoState: 1, invalidCoordinates: 1, invalidZip: 1, duplicate: 1 })
  })

  it('keeps the better-placed record when a ZIP is listed twice', () => {
    const { rows } = parseGeoNamesZips(FILE)
    expect(rows.filter((row) => row.zip === '96860')).toEqual([expect.objectContaining({ city: 'Pearl Harbor', accuracy: 4 })])
  })

  it('treats estimated or unknown accuracy as questionable', () => {
    expect(isQuestionableAccuracy(4)).toBe(false)
    expect(isQuestionableAccuracy(6)).toBe(false)
    expect(isQuestionableAccuracy(1)).toBe(true)
    expect(isQuestionableAccuracy(null)).toBe(true)
  })

  it('accepts US territories across the antimeridian and rejects points abroad', () => {
    expect(validUsCoordinate(51.88, 179.0)).toBe(true) // Aleutians
    expect(validUsCoordinate(13.47, 144.75)).toBe(true) // Guam
    expect(validUsCoordinate(-14.27, -170.7)).toBe(true) // American Samoa
    expect(validUsCoordinate(18.2, -66.5)).toBe(true) // Puerto Rico
    expect(validUsCoordinate(49.4, 8.69)).toBe(false) // Heidelberg APO
    expect(validUsCoordinate(0, 0)).toBe(false)
    expect(validUsCoordinate(Number.NaN, -97)).toBe(false)
  })

  it('reads the data file out of the published zip archive', () => {
    expect(readZipEntry(zipArchive('US.txt', FILE), 'US.txt').toString('utf8')).toBe(FILE)
    expect(() => readZipEntry(zipArchive('US.txt', FILE), 'CA.txt')).toThrow('CA.txt not found')
    expect(() => readZipEntry(Buffer.from('not a zip'), 'US.txt')).toThrow('Not a zip archive')
  })
})

describe('ZIP import', () => {
  function fakeDb(existing?: { id: string; sourceDate: Date }, loaded = 0) {
    const tx = {
      referenceDataset: { upsert: vi.fn().mockResolvedValue({}) },
      $executeRaw: vi.fn().mockResolvedValue(1),
      zipReference: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    }
    return {
      tx,
      db: {
        referenceDataset: { findUnique: vi.fn().mockResolvedValue(existing ?? null) },
        zipReference: { count: vi.fn().mockResolvedValue(loaded) },
        $transaction: vi.fn(async (work: (client: typeof tx) => Promise<unknown>) => work(tx)),
      },
    }
  }
  const archive = zipArchive('US.txt', FILE)
  const sourceDate = new Date('2026-11-06T02:57:18Z')

  it('imports valid rows, records the dataset with attribution, and removes ZIPs the source dropped', async () => {
    const { db, tx } = fakeDb()
    const report = await importZipReference(db as never, { archive, sourceDate })
    expect(report).toMatchObject({ imported: 5, removed: 2, unchanged: false, questionable: 1 })
    expect(tx.referenceDataset.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ name: 'us-zip', source: 'geonames', license: 'CC BY 4.0', recordCount: 5, skippedCount: 4, sourceDate, attribution: expect.stringContaining('GeoNames') }),
    }))
    expect(tx.zipReference.deleteMany).toHaveBeenCalledWith({ where: { source: 'geonames', datasetId: { not: report.datasetId } } })
  })

  it('does nothing when the same file is already fully imported', async () => {
    const { db } = fakeDb({ id: 'existing', sourceDate }, 5)
    const report = await importZipReference(db as never, { archive, sourceDate })
    expect(report).toMatchObject({ unchanged: true, imported: 0, datasetId: 'existing' })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('reimports the same file into the same dataset when forced or when a previous run was incomplete', async () => {
    for (const [loaded, force] of [[5, true], [3, false]] as const) {
      const { db, tx } = fakeDb({ id: 'existing', sourceDate }, loaded)
      const report = await importZipReference(db as never, { archive, sourceDate, force })
      expect(report).toMatchObject({ unchanged: false, datasetId: 'existing' })
      expect(tx.referenceDataset.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'existing' } }))
    }
  })
})
