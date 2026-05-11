import { ExtendedPrismaClient } from '@packages/db'
import { RiverPost, Store, Item, PostSource } from '@prisma/client'

// ========================================
// Content Generation Types
// ========================================

export const CONTENT_TYPES = {
  STORE_SPOTLIGHT: 0.30,    // 30% of content
  ITEM_FEATURE: 0.25,      // 25% of content  
  CATEGORY_COLLECTION: 0.20, // 20% of content
  TRAIT_MATCH: 0.15,        // 15% of content
  NEW_STORE: 0.10           // 10% of content
} as const

export const FRESHNESS_RULES = {
  NEW_SOURCE: {
    maxAge: 6,      // 6 hours
    baseScore: 100,
    decay: 2          // -2 points per hour
  },
  RECENT_SOURCE: {
    maxAge: 24,     // 24 hours
    baseScore: 80,
    decay: 1.5        // -1.5 points/hour
  },
  REPACKAGED: {
    maxAge: 72,     // 3 days
    baseScore: 60,
    decay: 1           // -1 point/hour
  },
  EVERGREEN: {
    maxAge: 168,    // 1 week
    baseScore: 40,
    decay: 0.5         // -0.5 points/hour
  }
} as const

export interface ContentGenerationOptions {
  targetPosts?: number
  storeIds?: string[]
  enableRestock?: boolean
  varietyStrategy?: {
    ensureCategoryBalance?: boolean
    ensureGeographicDiversity?: boolean
    ensurePriceRangeMix?: boolean
  }
}

export interface GenerationLimits {
  totalPosts: number
  hourlyPosts: number
  storeSpotlight: number
  itemFeature: number
  categoryCollection: number
  duplicateWindow: number // hours
}

export const GENERATION_LIMITS: GenerationLimits = {
  totalPosts: 100,
  hourlyPosts: 40,
  storeSpotlight: 30,
  itemFeature: 50,
  categoryCollection: 10,
  duplicateWindow: 168 // 7 days
}

// ========================================
// Store Categorization
// ========================================

export interface StoreCategory {
  primary: 'food' | 'retail' | 'service' | 'entertainment'
  secondary?: string
  tags: string[]
  traits?: Record<string, any>
}

export const categorizeStore = (store: Store): StoreCategory => {
  const primary = inferPrimaryCategory(store)
  const secondary = inferSecondaryCategory(store, primary)
  const tags = extractStoreTags(store)
  const traits = extractStoreTraits(store)

  return { primary, secondary, tags, traits }
}

const inferPrimaryCategory = (store: Store): StoreCategory['primary'] => {
  const name = store.name.toLowerCase()
  const description = store.description?.toLowerCase() || ''
  
  // Food-related keywords
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('bakery') ||
      name.includes('food') || description.includes('cuisine') || description.includes('menu')) {
    return 'food'
  }
  
  // Retail keywords
  if (name.includes('shop') || name.includes('store') || name.includes('market') ||
      name.includes('retail') || description.includes('products')) {
    return 'retail'
  }
  
  // Service keywords
  if (name.includes('service') || name.includes('cleaning') || name.includes('repair') ||
      description.includes('service') || description.includes('professional')) {
    return 'service'
  }
  
  // Default to food for local commerce
  return 'food'
}

const inferSecondaryCategory = (store: Store, primary: StoreCategory['primary']): string | undefined => {
  const name = store.name.toLowerCase()
  
  if (primary === 'food') {
    if (name.includes('restaurant')) return 'restaurant'
    if (name.includes('cafe')) return 'coffee'
    if (name.includes('bakery')) return 'bakery'
    if (name.includes('market')) return 'market'
  }
  
  if (primary === 'retail') {
    if (name.includes('clothing')) return 'clothing'
    if (name.includes('electronics')) return 'electronics'
    if (name.includes('books')) return 'books'
  }
  
  return undefined
}

const extractStoreTags = (store: Store): string[] => {
  const tags: string[] = []
  const text = `${store.name} ${store.description || ''}`.toLowerCase()
  
  // Common local commerce tags
  const tagKeywords = [
    'local', 'organic', 'artisan', 'handmade', 'vintage',
    'family-owned', 'sustainable', 'eco-friendly', 'community'
  ]
  
  tagKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      tags.push(keyword)
    }
  })
  
  return [...new Set(tags)] // Remove duplicates
}

const extractStoreTraits = (store: Store): Record<string, any> => {
  const traits: Record<string, any> = {}
  
  // Price range from existing data
  if (store.priceRange) {
    traits.priceRange = store.priceRange
  }
  
  // Location-based traits
  if (store.addressCity) {
    traits.neighborhood = store.addressCity
  }
  
  // Delivery/pickup options
  if (store.deliveryEnabled || store.pickupEnabled) {
    traits.convenience = true
  }
  
  return traits
}

// ========================================
// Content Type Generators
// ========================================

export interface SpotlightCriteria {
  reason: 'new_store' | 'high_engagement' | 'category_leader' | 'local_favorite'
  storeId: string
  metadata?: Record<string, any>
}

export const generateStoreSpotlight = async (
  db: ExtendedPrismaClient,
  criteria: SpotlightCriteria
): Promise<Partial<RiverPost>> => {
  const store = await db.store.findUnique({
    where: { id: criteria.storeId },
    include: { 
      media: { where: { kind: { in: ['IMAGE', 'VIDEO'] } }, orderBy: { sortIndex: 'asc' } },
      items: { where: { isActive: true }, take: 5 }
    }
  })
  
  if (!store) {
    throw new Error(`Store not found: ${criteria.storeId}`)
  }
  
  const category = categorizeStore(store)
  const templates = {
    new_store: `Welcome to ${store.name}! ${store.description?.slice(0, 100) || ''}`,
    high_engagement: `${store.name} is trending with growing customer engagement`,
    category_leader: `Leading ${category.primary} in ${store.addressCity || 'town'}: ${store.name}`,
    local_favorite: `${store.addressCity || 'Local'} favorite: ${store.name}`
  }
  
  const media = store.media.slice(0, 3).map(m => ({
    type: m.kind.toLowerCase(),
    url: m.url,
    thumbnail: m.url,
    title: store.name,
    provider: 'local',
    width: 800,
    height: 600
  }))
  
  return {
    storeId: store.id,
    content: templates[criteria.reason],
    mediaUrls: media,
    source: 'SPOTLIGHT' as PostSource,
    contentType: 'STORE_SPOTLIGHT',
    freshnessKind: 'NEW_SOURCE',
    priority: calculateSpotlightPriority(criteria.reason),
    duplicateKey: `spotlight_${store.id}_${criteria.reason}`,
    storeCategory: category,
    automationKey: `spotlight_${store.id}_${criteria.reason}`
  }
}

export const generateItemFeature = async (
  db: ExtendedPrismaClient,
  item: Item,
  store: Store
): Promise<Partial<RiverPost>> => {
  const itemMedia = await db.mediaAsset.findMany({
    where: { 
      itemId: item.id,
      kind: { in: ['IMAGE', 'VIDEO'] }
    },
    orderBy: { sortIndex: 'asc' },
    take: 5
  })
  
  const media = itemMedia.map(m => ({
    type: m.kind.toLowerCase(),
    url: m.url,
    thumbnail: m.url,
    title: item.title,
    provider: 'local',
    width: 800,
    height: 600
  }))
  
  const featureType = inferItemFeatureType(item, store)
  const templates = {
    new_arrival: `Just in: ${item.title} - ${item.description?.slice(0, 80) || ''}`,
    popular_choice: `${item.title} - ${store.name}'s customer favorite`,
    seasonal_special: `Perfect for ${getCurrentSeason()}: ${item.title}`,
    trending_item: `Popular choice: ${item.title} from ${store.name}`
  }
  
  const storeCategory = categorizeStore(store)
  
  return {
    storeId: store.id,
    linkedItemId: item.id,
    content: templates[featureType],
    mediaUrls: media,
    source: 'AUTO_PRODUCT' as PostSource,
    contentType: 'ITEM_FEATURE',
    freshnessKind: 'NEW_SOURCE',
    priority: calculateItemPriority(item),
    duplicateKey: `item_${item.id}_${featureType}`,
    storeCategory,
    automationKey: `item_${item.id}_${featureType}`
  }
}

export const generateCategoryCollection = async (
  db: ExtendedPrismaClient,
  category: StoreCategory['primary'],
  stores: Store[]
): Promise<Partial<RiverPost>> => {
  const categoryStores = stores.filter(s => 
    categorizeStore(s).primary === category
  ).slice(0, 5) // Limit to 5 stores per collection
  
  const templates = {
    food: `Discover ${categoryStores.length} amazing food spots near you`,
    retail: `Shop the best ${categoryStores.length} retail stores in town`,
    service: `Top-rated ${categoryStores.length} services you need`,
    entertainment: `Exciting ${categoryStores.length} entertainment destinations this weekend`
  }
  
  // Collect media from all stores in collection
  const media = await Promise.all(
    categoryStores.map(async store => {
      const storeMedia = await db.mediaAsset.findMany({
        where: { 
          storeId: store.id,
          kind: { in: ['IMAGE', 'VIDEO'] }
        },
        orderBy: { sortIndex: 'asc' },
        take: 2
      })
      
      return storeMedia.map(m => ({
        type: m.kind.toLowerCase(),
        url: m.url,
        thumbnail: m.url,
        title: store.name,
        provider: 'local',
        width: 800,
        height: 600
      }))
    })
  )
  
  const flatMedia = media.flat()
  
  return {
    storeId: 'system', // System-generated content
    content: templates[category] || `Explore ${category} options`,
    mediaUrls: flatMedia.slice(0, 8), // Max 8 media items
    source: 'SPOTLIGHT' as PostSource,
    contentType: 'CATEGORY_COLLECTION',
    freshnessKind: 'REPACKAGED',
    priority: calculateCategoryPriority(category, categoryStores.length),
    duplicateKey: `category_${category}_${Math.floor(Date.now() / (24 * 60 * 60 * 1000))}`, // Daily
    storeCategory: { primary: category, tags: [category], traits: {} },
    automationKey: `category_${category}_${Date.now()}`
  }
}

export const generateTraitMatch = async (
  db: ExtendedPrismaClient,
  trait: string,
  stores: Store[]
): Promise<Partial<RiverPost>> => {
  const matchingStores = stores.filter(store => {
    const category = categorizeStore(store)
    const traits = category.traits || {}
    
    return Object.values(traits).some(value => 
      typeof value === 'string' ? value.toLowerCase().includes(trait.toLowerCase()) : false
    )
  }).slice(0, 3) // Limit to 3 stores
  
  if (matchingStores.length === 0) {
    return null
  }
  
  const templates = {
    organic: `Organic and sustainable: ${trait} options near you`,
    local: `Supporting local ${trait} businesses in your community`,
    handmade: `Handmade ${trait} treasures from local artisans`,
    family: `Family-owned ${trait} businesses with personal touch`
  }
  
  const template = templates[Object.keys(templates)[Math.floor(Math.random() * Object.keys(templates).length)]]
  
  const media = await Promise.all(
    matchingStores.map(async store => {
      const storeMedia = await db.mediaAsset.findMany({
        where: { 
          storeId: store.id,
          kind: { in: ['IMAGE', 'VIDEO'] }
        },
        orderBy: { sortIndex: 'asc' },
        take: 2
      })
      
      return storeMedia.map(m => ({
        type: m.kind.toLowerCase(),
        url: m.url,
        thumbnail: m.url,
        title: store.name,
        provider: 'local',
        width: 800,
        height: 600
      }))
    })
  )
  
  const flatMedia = media.flat()
  
  return {
    storeId: 'system',
    content: template,
    mediaUrls: flatMedia.slice(0, 6),
    source: 'SPOTLIGHT' as PostSource,
    contentType: 'TRAIT_MATCH',
    freshnessKind: 'REPACKAGED',
    priority: calculateTraitPriority(trait, matchingStores.length),
    duplicateKey: `trait_${trait}_${Date.now()}`,
    storeCategory: { primary: 'food', tags: [trait], traits: { [trait]: true } },
    automationKey: `trait_${trait}_${Date.now()}`
  }
}

// ========================================
// Priority Calculations
// ========================================

const calculateSpotlightPriority = (reason: SpotlightCriteria['reason']): number => {
  const priorities = {
    new_store: 100,
    high_engagement: 90,
    category_leader: 80,
    local_favorite: 70
  }
  return priorities[reason] || 50
}

const calculateItemPriority = (item: Item): number => {
  let priority = 50
  
  // Boost for items with images
  if (item.imageUrl) priority += 10
  
  // Boost for lower-priced items (perceived value)
  if (item.price && item.price < 20) priority += 5
  
  // Boost for items with descriptions
  if (item.description && item.description.length > 50) priority += 5
  
  return priority
}

const calculateCategoryPriority = (category: string, storeCount: number): number => {
  let priority = 40
  
  // Boost for categories with more stores
  if (storeCount > 10) priority += 10
  
  // Boost for food category (core to local commerce)
  if (category === 'food') priority += 15
  
  return priority
}

const calculateTraitPriority = (trait: string, storeCount: number): number => {
  let priority = 30
  
  // Boost for popular traits
  if (['organic', 'local', 'handmade'].includes(trait)) priority += 10
  
  // Boost if multiple stores match
  if (storeCount > 1) priority += 5
  
  return priority
}

// ========================================
// Helper Functions
// ========================================

const inferItemFeatureType = (item: Item, store: Store): string => {
  const title = item.title.toLowerCase()
  
  if (title.includes('new') || title.includes('arrival')) return 'new_arrival'
  if (title.includes('popular') || title.includes('favorite')) return 'popular_choice'
  if (title.includes('seasonal') || title.includes('special')) return 'seasonal_special'
  if (title.includes('trending') || title.includes('viral')) return 'trending_item'
  
  return 'new_arrival' // Default
}

const getCurrentSeason = (): string => {
  const month = new Date().getMonth()
  const seasons = {
    [11, 0, 1]: 'winter',
    [2, 3, 4]: 'spring',
    [5, 6, 7]: 'summer',
    [8, 9, 10]: 'fall'
  }
  return seasons[month as keyof typeof seasons] || 'all-season'
}
