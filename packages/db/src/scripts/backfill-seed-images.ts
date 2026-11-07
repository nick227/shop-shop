/**
 * Replace picsum/placehold stock URLs (and missing covers) with local licensed editorial copies
 * under /uploads/seed so marketplace activation and discovery treat them as real photos.
 *
 *   pnpm --filter @packages/db exec tsx src/scripts/backfill-seed-images.ts
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { prisma } from '../client.js'

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../.env') })

const STOCK =
  /picsum\.photos|placehold\.co|unsplash\.com|images\.unsplash|loremflickr|placeholder\.com|via\.placeholder/i

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
const EDITORIAL_DIR = path.join(ROOT, 'apps/web/public/editorial')
const uploadRoot = process.env.UPLOAD_DIR && path.isAbsolute(process.env.UPLOAD_DIR)
  ? process.env.UPLOAD_DIR
  : path.join(ROOT, 'apps/server', process.env.UPLOAD_DIR || 'uploads')
const UPLOAD_SEED = path.join(uploadRoot, 'seed')

const FILES = [
  'tacos-pastor.jpg',
  'tacos-migas.jpg',
  'burrito.jpg',
  'brisket.jpg',
  'coffee-latte.jpg',
  'iced-coffee.jpg',
  'bakery-pastry.jpg',
  'fresh-bread.jpg',
  'wood-pizza.jpg',
  'farmers-produce.jpg',
  'fresh-peaches.jpg',
  'guacamole.jpg',
  'ramen-bowl.jpg',
  'zilker.jpg',
  'south-congress.jpg',
  'south-lamar.jpg',
  'east-austin.jpg',
] as const

type SeedFile = (typeof FILES)[number]

function publicUrl(file: SeedFile): string {
  return `/uploads/seed/${file}`
}

function isStock(url: string | null | undefined): boolean {
  return Boolean(url && STOCK.test(url))
}

function needsPhoto(urls: readonly (string | null | undefined)[]): boolean {
  const present = urls.filter((url): url is string => Boolean(url?.trim()))
  return present.length === 0 || present.every(isStock)
}

function pick(files: readonly SeedFile[], seed: string): SeedFile {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return files[hash % files.length]!
}

function storeFile(name: string, storeType: string | null, description: string | null): SeedFile {
  const text = `${name} ${storeType ?? ''} ${description ?? ''}`.toLowerCase()
  if (/taco|migas|burrito|mexican|quesadilla/.test(text)) return pick(['tacos-pastor.jpg', 'tacos-migas.jpg', 'burrito.jpg', 'guacamole.jpg'], name)
  if (/bbq|smoke|brisket|barbecue/.test(text)) return 'brisket.jpg'
  if (/coffee|grind|roast|espresso|cafe|latte/.test(text)) return pick(['coffee-latte.jpg', 'iced-coffee.jpg'], name)
  if (/bakery|sweet|pastry|dough|bread|cake/.test(text)) return pick(['bakery-pastry.jpg', 'fresh-bread.jpg'], name)
  if (/pizza|slice|oven/.test(text)) return 'wood-pizza.jpg'
  if (/sushi|tokyo|ramen|thai|bangkok|noodle/.test(text)) return 'ramen-bowl.jpg'
  if (/burger|grill|patty/.test(text)) return pick(['brisket.jpg', 'wood-pizza.jpg'], name)
  if (/grocery|market|produce|fruit/.test(text)) return pick(['farmers-produce.jpg', 'fresh-peaches.jpg'], name)
  if (/coffee/.test(storeType ?? '')) return 'coffee-latte.jpg'
  return pick(['farmers-produce.jpg', 'wood-pizza.jpg', 'coffee-latte.jpg', 'brisket.jpg', 'tacos-pastor.jpg', 'bakery-pastry.jpg'], name)
}

function itemFile(title: string, description: string | null): SeedFile {
  return storeFile(title, null, description)
}

function listingFile(category: string, categoryLabel: string, name: string): SeedFile {
  const text = `${category} ${categoryLabel} ${name}`.toLowerCase()
  if (/park|outdoors|attraction/.test(text)) return pick(['zilker.jpg', 'south-lamar.jpg', 'south-congress.jpg'], name)
  if (/coffee|cafe/.test(text)) return 'coffee-latte.jpg'
  if (/grocery|market/.test(text)) return 'farmers-produce.jpg'
  if (/bakery|pastry/.test(text)) return 'bakery-pastry.jpg'
  if (/bbq|smoke/.test(text)) return 'brisket.jpg'
  if (/taco|mexican/.test(text)) return 'tacos-pastor.jpg'
  if (/pizza/.test(text)) return 'wood-pizza.jpg'
  if (/restaurant|food|bar/.test(text)) return pick(['tacos-pastor.jpg', 'wood-pizza.jpg', 'brisket.jpg', 'ramen-bowl.jpg'], name)
  return pick(['south-congress.jpg', 'east-austin.jpg', 'farmers-produce.jpg'], name)
}

function ensureSeedFiles() {
  mkdirSync(UPLOAD_SEED, { recursive: true })
  const available = new Set(readdirSync(EDITORIAL_DIR))
  for (const file of FILES) {
    if (!available.has(file)) throw new Error(`Missing editorial source: ${file}`)
    const dest = path.join(UPLOAD_SEED, file)
    if (!existsSync(dest)) copyFileSync(path.join(EDITORIAL_DIR, file), dest)
  }
}

async function backfillStores() {
  const stores = await prisma.store.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      name: true,
      storeType: true,
      description: true,
      imageUrl: true,
      media: { where: { kind: 'IMAGE' }, select: { id: true, url: true }, orderBy: { sortIndex: 'asc' } },
    },
  })
  let updated = 0
  for (const store of stores) {
    if (!needsPhoto([store.imageUrl, ...store.media.map((row) => row.url)])) continue
    const file = storeFile(store.name, store.storeType, store.description)
    const url = publicUrl(file)
    await prisma.store.update({ where: { id: store.id }, data: { imageUrl: url } })
    const stockMedia = store.media.filter((row) => isStock(row.url))
    if (stockMedia.length > 0) {
      await prisma.mediaAsset.updateMany({
        where: { id: { in: stockMedia.map((row) => row.id) } },
        data: { url },
      })
    } else if (store.media.length === 0) {
      await prisma.mediaAsset.create({
        data: { storeId: store.id, kind: 'IMAGE', url, sortIndex: 0, altText: store.name },
      })
    } else {
      await prisma.mediaAsset.update({ where: { id: store.media[0]!.id }, data: { url } })
    }
    updated += 1
  }
  return updated
}

async function backfillItems() {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      media: { where: { kind: 'IMAGE' }, select: { id: true, url: true }, orderBy: { sortIndex: 'asc' } },
    },
  })
  let updated = 0
  for (const item of items) {
    if (!needsPhoto([item.imageUrl, ...item.media.map((row) => row.url)])) continue
    const file = itemFile(item.title, item.description)
    const url = publicUrl(file)
    await prisma.item.update({ where: { id: item.id }, data: { imageUrl: url } })
    const stockMedia = item.media.filter((row) => isStock(row.url))
    if (stockMedia.length > 0) {
      await prisma.mediaAsset.updateMany({
        where: { id: { in: stockMedia.map((row) => row.id) } },
        data: { url },
      })
    } else if (item.media.length === 0) {
      await prisma.mediaAsset.create({
        data: { itemId: item.id, kind: 'IMAGE', url, sortIndex: 0, altText: item.title },
      })
    } else {
      await prisma.mediaAsset.update({ where: { id: item.media[0]!.id }, data: { url } })
    }
    updated += 1
  }
  return updated
}

async function backfillListings() {
  const listings = await prisma.businessListing.findMany({
    where: { published: true },
    select: {
      id: true,
      name: true,
      category: true,
      categoryLabel: true,
      media: { where: { kind: 'IMAGE' }, select: { id: true, url: true }, orderBy: { sortIndex: 'asc' } },
    },
  })
  let updated = 0
  for (const listing of listings) {
    if (!needsPhoto(listing.media.map((row) => row.url))) continue
    const url = publicUrl(listingFile(listing.category, listing.categoryLabel, listing.name))
    if (listing.media.length === 0) {
      await prisma.mediaAsset.create({
        data: { listingId: listing.id, kind: 'IMAGE', url, sortIndex: 0, altText: listing.name },
      })
    } else {
      await prisma.mediaAsset.updateMany({
        where: { id: { in: listing.media.map((row) => row.id) } },
        data: { url },
      })
    }
    updated += 1
  }
  return updated
}

async function main() {
  ensureSeedFiles()
  const stores = await backfillStores()
  const items = await backfillItems()
  const listings = await backfillListings()
  console.log(JSON.stringify({ seedDir: UPLOAD_SEED, stores, items, listings }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
