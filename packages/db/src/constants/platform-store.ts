import type { Prisma } from '../generated/client/index.js'

/** Editorial platform identity in River — normal Store row; posts use this storeId. */
export const OFFICIAL_PLATFORM_STORE_SLUG = 'official' as const

/** Exclude from customer-facing store discovery (listings, search, nearby). River feed is separate. */
export const PUBLIC_STORE_DISCOVERY_SLUG_EXCLUSION: Pick<
  Prisma.StoreWhereInput,
  'slug'
> = {
  slug: { not: OFFICIAL_PLATFORM_STORE_SLUG },
}
