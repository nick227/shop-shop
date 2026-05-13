/**
 * MarketplaceSearchService - MVP Implementation
 * Customer-facing search service with grouped results
 */
import {
  type ExtendedPrismaClient,
  type Prisma,
  haversineMiles,
  prisma,
  PUBLIC_STORE_DISCOVERY_SLUG_EXCLUSION,
} from '@packages/db'

// MVP DTOs
export interface UnifiedSearchRequest {
  q?: string // Raw search query
  city?: string // Explicit city filter
  state?: string // Explicit state filter
  zip?: string // Explicit ZIP filter
  latitude?: number // Explicit location
  longitude?: number // Explicit location
  radiusMiles?: number // Search radius (default: 25)
  storeType?: string // Category filter (MEAL_PREP | BAKERY | COFFEE | SPECIALTY | GENERAL)
  tags?: string[] // Tag slugs — OR within a group, AND across groups (future)
  priceRange?: string // BUDGET | MODERATE | PREMIUM
}

export interface TagResult {
  slug: string
  label: string
  category: string
}

export interface UnifiedSearchResponse {
  query: string
  interpreted: {
    locationSuggestion?: {
      label: string
      city: string
      state: string
    }
  }
  sections: {
    stores: {
      total: number
      results: StoreSearchResult[]
    }
    products: {
      total: number
      results: ProductSearchResult[]
    }
  }
}

export interface StoreSearchResult {
  id: string
  name: string
  description?: string
  imageUrl?: string
  distance?: number
  rating?: number
  prepTimeMin: number
  isOpen: boolean
  category: string
  priceRange?: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  latitude?: number
  longitude?: number
  createdAt: string
  tags: TagResult[]
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export interface ProductSearchResult {
  id: string
  title: string
  description?: string
  imageUrl?: string
  price: number
  storeId: string
  storeName: string
  category: string
  available: boolean
  isSoldOut: boolean
  tags: TagResult[]
}

interface LocationFilter {
  readonly city?: string
  readonly state?: string
  readonly zip?: string
  readonly latitude?: number
  readonly longitude?: number
  readonly radiusMiles: number
}

// Builds a Prisma WHERE clause for tag filtering.
// mode ANY: store/item must match at least one slug (OR semantics).
// mode ALL: store/item must match every slug (AND semantics — each requires its own sub-clause).
function buildStoreTagWhere(slugs: string[], mode: 'ANY' | 'ALL' = 'ANY'): Prisma.StoreWhereInput | undefined {
  if (!slugs.length) return undefined
  if (mode === 'ANY') {
    return { tags: { some: { tag: { slug: { in: slugs } } } } }
  }
  return { AND: slugs.map((slug) => ({ tags: { some: { tag: { slug } } } })) }
}

function buildItemTagWhere(slugs: string[], mode: 'ANY' | 'ALL' = 'ANY'): Prisma.ItemWhereInput | undefined {
  if (!slugs.length) return undefined
  if (mode === 'ANY') {
    return { tags: { some: { tag: { slug: { in: slugs } } } } }
  }
  return { AND: slugs.map((slug) => ({ tags: { some: { tag: { slug } } } })) }
}

export class MarketplaceSearchService {
  constructor(private db: ExtendedPrismaClient = prisma) {}

  async search(request: UnifiedSearchRequest): Promise<UnifiedSearchResponse> {
    const query = request.q || ''

    // Use explicit location params only — no guessing if "q" is a location
    // The frontend sends city/state/zip/lat/lng explicitly when it has location context
    const locationFilter = this.buildLocationFilter(request)

    // Handle "City, ST" queries: if q matches the location, clear keywordQuery
    let keywordQuery = query
    if (locationFilter.city && locationFilter.state) {
      const normalizedQuery = query.trim().toLowerCase()
      const normalizedCity = locationFilter.city.toLowerCase()
      const normalizedState = locationFilter.state.toLowerCase()

      if (
        normalizedQuery === normalizedCity ||
        normalizedQuery === `${normalizedCity}, ${normalizedState}` ||
        normalizedQuery === `${normalizedCity} ${normalizedState}`
      ) {
        keywordQuery = ''
      }
    }

    const tags = request.tags?.length ? request.tags : undefined
    const priceRange = request.priceRange

    // Parallel search for stores and products (tolerate partial failures)
    const [storesResult, productsResult] = await Promise.allSettled([
      this.searchStores(keywordQuery, locationFilter, request.storeType, tags, priceRange),
      this.searchProducts(keywordQuery, locationFilter, tags),
    ])

    const stores = storesResult.status === 'fulfilled' ? storesResult.value : []
    const products = productsResult.status === 'fulfilled' ? productsResult.value : []

    if (storesResult.status === 'rejected') console.error('searchStores failed:', storesResult.reason)
    if (productsResult.status === 'rejected') console.error('searchProducts failed:', productsResult.reason)

    return {
      query,
      interpreted: {
        locationSuggestion: locationFilter.city && locationFilter.state
          ? { label: `${locationFilter.city}, ${locationFilter.state}`, city: locationFilter.city, state: locationFilter.state }
          : undefined,
      },
      sections: {
        stores: {
          total: stores.length,
          results: stores,
        },
        products: {
          total: products.length,
          results: products,
        },
      },
    }
  }

  private buildLocationFilter(request: UnifiedSearchRequest) {
    const radiusMiles = request.radiusMiles || 25
    return {
      city: request.city,
      state: request.state,
      zip: request.zip,
      latitude: request.latitude,
      longitude: request.longitude,
      radiusMiles,
    } satisfies LocationFilter
  }

  private async searchStores(
    query: string,
    locationFilter: LocationFilter,
    storeType?: string,
    tags?: string[],
    priceRange?: string,
  ): Promise<StoreSearchResult[]> {
    try {
      const where: Prisma.StoreWhereInput = {
        isPublished: true,
        ...PUBLIC_STORE_DISCOVERY_SLUG_EXCLUSION,
        OR: [
          { media: { some: { kind: 'IMAGE', url: { not: '' } } } },
          { imageUrl: { not: null } },
        ],
      }
      if (storeType) where.storeType = storeType as any
      if (priceRange) where.priceRange = priceRange as any

      if (locationFilter.latitude && locationFilter.longitude) {
        where.latitude = { gte: locationFilter.latitude - 0.5, lte: locationFilter.latitude + 0.5 }
        where.longitude = { gte: locationFilter.longitude - 0.5, lte: locationFilter.longitude + 0.5 }
      } else if (locationFilter.city) {
        where.addressCity = { contains: locationFilter.city }
      } else if (locationFilter.state) {
        where.addressState = locationFilter.state
      } else if (locationFilter.zip) {
        where.addressZip = locationFilter.zip
      }

      if (query) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { addressCity: { contains: query } },
              { addressState: { contains: query } },
              { addressZip: { contains: query } },
            ],
          },
        ]
      }

      const tagWhere = buildStoreTagWhere(tags ?? [], 'ANY')
      if (tagWhere) Object.assign(where, tagWhere)

      const candidateStores = await this.db.store.findMany({
        where,
        include: {
          media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1 },
          tags: { select: { tag: { select: { slug: true, label: true, category: true } } } },
        },
        take: 100,
      })

      const hasUserCoords = !!(locationFilter.latitude && locationFilter.longitude)
      const maxDistance = locationFilter.radiusMiles

      const results: StoreSearchResult[] = []
      for (const store of candidateStores) {
        if (results.length >= 50) break
        const imageUrl = store.media?.[0]?.url || store.imageUrl || undefined
        if (!imageUrl?.trim()) continue

        let distance: number | undefined
        if (hasUserCoords && store.latitude && store.longitude) {
          distance = haversineMiles(
            { latitude: locationFilter.latitude!, longitude: locationFilter.longitude! },
            { latitude: Number(store.latitude), longitude: Number(store.longitude) },
          )
          if (distance > maxDistance) continue
        }

        results.push({
          id: store.id,
          name: store.name,
          description: store.description || undefined,
          imageUrl,
          prepTimeMin: store.prepTimeMin || 30,
          isOpen: true,
          category: store.storeType ?? 'GENERAL',
          priceRange: store.priceRange ?? undefined,
          deliveryEnabled: store.deliveryEnabled,
          pickupEnabled: store.pickupEnabled,
          latitude: store.latitude ? Number(store.latitude) : undefined,
          longitude: store.longitude ? Number(store.longitude) : undefined,
          createdAt: store.createdAt.toISOString(),
          distance,
          tags: store.tags.map(({ tag }) => ({ slug: tag.slug, label: tag.label, category: tag.category })),
          address: {
            street: store.addressStreet || '',
            city: store.addressCity || '',
            state: store.addressState || '',
            zip: store.addressZip || '',
          },
        })
      }

      if (hasUserCoords) {
        results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      }

      return results
    } catch (error) {
      console.error('Error in searchStores:', error)
      return []
    }
  }

  private async searchProducts(
    query: string,
    locationFilter: LocationFilter,
    tags?: string[],
  ): Promise<ProductSearchResult[]> {
    try {
      const storeWhere: Prisma.StoreWhereInput = {
        isPublished: true,
        ...PUBLIC_STORE_DISCOVERY_SLUG_EXCLUSION,
      }
      if (locationFilter.city) storeWhere.addressCity = { contains: locationFilter.city }
      else if (locationFilter.state) storeWhere.addressState = locationFilter.state
      else if (locationFilter.zip) storeWhere.addressZip = locationFilter.zip

      const where: Prisma.ItemWhereInput = { isActive: true, store: storeWhere }

      if (query) {
        where.OR = [
          { title: { contains: query } },
          { description: { contains: query } },
          { store: { name: { contains: query } } },
          { store: { addressCity: { contains: query } } },
          { store: { addressState: { contains: query } } },
          { store: { addressZip: { contains: query } } },
        ]
      }

      const tagWhere = buildItemTagWhere(tags ?? [], 'ANY')
      if (tagWhere) Object.assign(where, tagWhere)

      const items = await this.db.item.findMany({
        where,
        include: {
          store: { select: { name: true, latitude: true, longitude: true } },
          media: { where: { kind: 'IMAGE' }, orderBy: { sortIndex: 'asc' }, take: 1 },
          tags: { select: { tag: { select: { slug: true, label: true, category: true } } } },
        },
        take: 50,
      })

      const hasUserCoords = !!(locationFilter.latitude && locationFilter.longitude)
      const maxDistance = locationFilter.radiusMiles

      const results: ProductSearchResult[] = []
      for (const item of items) {
        if (results.length >= 20) break

        if (hasUserCoords && item.store.latitude && item.store.longitude) {
          const distance = haversineMiles(
            { latitude: locationFilter.latitude!, longitude: locationFilter.longitude! },
            { latitude: Number(item.store.latitude), longitude: Number(item.store.longitude) },
          )
          if (distance > maxDistance) continue
        }

        results.push({
          id: item.id,
          title: item.title,
          description: item.description || undefined,
          imageUrl: item.media?.[0]?.url || undefined,
          price: Number(item.price),
          storeId: item.storeId,
          storeName: item.store.name,
          category: 'General',
          available: item.isActive && !item.isSoldOut,
          isSoldOut: item.isSoldOut || false,
          tags: item.tags.map(({ tag }) => ({ slug: tag.slug, label: tag.label, category: tag.category })),
        })
      }

      return results
    } catch (error) {
      console.error('Error in searchProducts:', error)
      return []
    }
  }
}
