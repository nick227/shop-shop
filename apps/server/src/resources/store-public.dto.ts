import { z } from 'zod'

/**
 * What anyone, signed in or not, may see about a store from `GET /api/stores` and
 * `GET /api/stores/:id`. Built field by field from an allowlist, so a column added to `Store`
 * stays private until someone adds it here on purpose.
 *
 * Kept: discovery and storefront fields, the business's published contact details (phone, email,
 * website, social links), its location, media, tags, and the derived fulfillment state.
 * Left out: payment-account and tax identifiers, onboarding and commission data, admin status and
 * notes, pause reasons, owner and affiliate links, geocoding metadata, and order-handling settings.
 *
 * The owner and store administrators still get the full record (`canSeeFullStore` in store.resource).
 */

const decimal = z.union([z.string(), z.number()]).nullable()
const availability = z.enum(['available', 'temporarily_unavailable', 'not_offered'])

export const PublicStoreMediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  kind: z.string(),
  altText: z.string().nullable(),
  sortIndex: z.number().nullable(),
}).strict()

export const PublicStoreTagSchema = z.object({
  slug: z.string(),
  label: z.string(),
  category: z.string(),
}).strict()

export const PublicStoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  storeType: z.string().nullable(),
  priceRange: z.string().nullable(),
  imageUrl: z.string().nullable(),
  brandColor: z.string().nullable(),
  accentColor: z.string().nullable(),
  isPublished: z.boolean(),
  createdAt: z.string(),

  // Published business contact, shown on the storefront.
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  customDomain: z.string().nullable(),
  socialLinksJson: z.unknown().nullable(),

  addressStreet: z.string().nullable(),
  addressCity: z.string().nullable(),
  addressState: z.string().nullable(),
  addressZip: z.string().nullable(),
  addressCountry: z.string().nullable(),
  latitude: decimal,
  longitude: decimal,
  /** Miles from the searched point, on coordinate searches only. */
  distance: z.number().optional(),

  // What a shopper can order and roughly what it costs. Checkout has the final word.
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  acceptingOrders: z.boolean(),
  prepTimeMin: z.number().nullable(),
  deliveryCharge: decimal,
  deliveryDistance: decimal,
  deliveryMinimum: decimal,
  fulfillment: z.object({ delivery: availability, pickup: availability }).strict().optional(),

  mediaAssets: z.array(PublicStoreMediaSchema).optional(),
  tags: z.array(PublicStoreTagSchema).optional(),
}).strict()

export type PublicStore = z.infer<typeof PublicStoreSchema>

type Row = Record<string, unknown>

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null)
const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null)
/** Prisma Decimals serialize as strings; keep that shape without exposing the Decimal object. */
const dec = (value: unknown): string | number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const shown = String(value)
  return shown === '' ? null : shown
}
const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : typeof value === 'string' ? value : '')

function publicMedia(value: unknown): PublicStore['mediaAssets'] {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((asset: Row) => {
    const url = text(asset?.url)
    const kind = text(asset?.kind)
    if (!url || !kind) return []
    return [{ id: String(asset.id ?? ''), url, kind, altText: text(asset.altText), sortIndex: num(asset.sortIndex) }]
  })
}

function publicTags(value: unknown): PublicStore['tags'] {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((tag: Row) => {
    const slug = text(tag?.slug)
    const label = text(tag?.label)
    const category = text(tag?.category)
    return slug && label && category ? [{ slug, label, category }] : []
  })
}

function publicFulfillment(value: unknown): PublicStore['fulfillment'] {
  const f = value as { delivery?: unknown; pickup?: unknown } | null | undefined
  const ok = (v: unknown): v is 'available' | 'temporarily_unavailable' | 'not_offered' =>
    v === 'available' || v === 'temporarily_unavailable' || v === 'not_offered'
  return f && ok(f.delivery) && ok(f.pickup) ? { delivery: f.delivery, pickup: f.pickup } : undefined
}

export function toPublicStore(row: Row): PublicStore {
  const store: PublicStore = {
    id: String(row.id),
    name: text(row.name) ?? '',
    slug: text(row.slug) ?? '',
    description: text(row.description),
    storeType: text(row.storeType),
    priceRange: text(row.priceRange),
    imageUrl: text(row.imageUrl),
    brandColor: text(row.brandColor),
    accentColor: text(row.accentColor),
    isPublished: row.isPublished === true,
    createdAt: iso(row.createdAt),
    phone: text(row.phone),
    email: text(row.email),
    website: text(row.website),
    customDomain: text(row.customDomain),
    socialLinksJson: row.socialLinksJson ?? null,
    addressStreet: text(row.addressStreet),
    addressCity: text(row.addressCity),
    addressState: text(row.addressState),
    addressZip: text(row.addressZip),
    addressCountry: text(row.addressCountry),
    latitude: dec(row.latitude),
    longitude: dec(row.longitude),
    deliveryEnabled: row.deliveryEnabled === true,
    pickupEnabled: row.pickupEnabled === true,
    acceptingOrders: row.acceptingOrders !== false,
    prepTimeMin: num(row.prepTimeMin),
    deliveryCharge: dec(row.deliveryCharge),
    deliveryDistance: dec(row.deliveryDistance),
    deliveryMinimum: dec(row.deliveryMinimum),
  }
  const distance = num(row.distance)
  if (distance !== null) store.distance = distance
  const fulfillment = publicFulfillment(row.fulfillment)
  if (fulfillment) store.fulfillment = fulfillment
  const media = publicMedia(row.mediaAssets)
  if (media) store.mediaAssets = media
  const tags = publicTags(row.tags)
  if (tags) store.tags = tags
  return store
}

export interface StoreViewer {
  readonly userId?: string
  readonly userRole?: string
}

export function ownsStore(viewer: StoreViewer | undefined, ownerUserId: unknown): boolean {
  return Boolean(viewer?.userId) && typeof ownerUserId === 'string' && ownerUserId === viewer?.userId
}
