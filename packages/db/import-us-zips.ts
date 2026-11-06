/**
 * Import national US ZIP reference data (GeoNames postal codes) into ZipReference.
 *
 *   pnpm --filter @packages/db import-zips                      # download the current file
 *   pnpm --filter @packages/db import-zips --file ./US.zip --source-date 2026-11-06
 *   pnpm --filter @packages/db import-zips --force              # reimport an unchanged file
 *
 * Safe to rerun. Does not touch PostalCode, Place, or neighborhoods: imported cities are not served.
 * Attribution required by the license: "ZIP code data © GeoNames (www.geonames.org), CC BY 4.0".
 */
import { readFileSync, statSync } from 'fs'
import { prisma } from './src/client.js'
import { importZipReference, ZIP_DATASET } from './src/geo/zip-reference.js'

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function loadArchive(): Promise<{ archive: Buffer; sourceDate: Date; sourceUrl: string }> {
  const file = argument('--file')
  const dateArg = argument('--source-date')
  if (file) {
    const sourceDate = dateArg ? new Date(dateArg) : statSync(file).mtime
    if (Number.isNaN(sourceDate.getTime())) throw new Error('--source-date must be a date, for example 2026-11-06')
    return { archive: readFileSync(file), sourceDate, sourceUrl: ZIP_DATASET.url }
  }
  console.log(`Downloading ${ZIP_DATASET.url}`)
  const response = await fetch(ZIP_DATASET.url, { signal: AbortSignal.timeout(120_000) })
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`)
  const archive = Buffer.from(await response.arrayBuffer())
  // GeoNames publishes no version number; the file's Last-Modified date is its version.
  const modified = response.headers.get('last-modified')
  const sourceDate = dateArg ? new Date(dateArg) : modified ? new Date(modified) : new Date()
  return { archive, sourceDate, sourceUrl: ZIP_DATASET.url }
}

async function main() {
  const { archive, sourceDate, sourceUrl } = await loadArchive()
  const started = Date.now()
  const report = await importZipReference(prisma, { archive, sourceDate, sourceUrl, force: process.argv.includes('--force') })
  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(report.unchanged ? 'This file is already imported; nothing changed.' : `Imported ${report.imported} ZIPs in ${seconds}s`)
  console.log(JSON.stringify({
    dataset: report.datasetId,
    sourceDate: report.sourceDate.toISOString(),
    checksum: report.checksum,
    imported: report.imported,
    removedStale: report.removed,
    questionable: report.questionable,
    skipped: report.skipped,
    totalInTable: await prisma.zipReference.count(),
    attribution: ZIP_DATASET.attribution,
  }, null, 2))
}

main()
  .catch((error: unknown) => {
    console.error('ZIP import failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
