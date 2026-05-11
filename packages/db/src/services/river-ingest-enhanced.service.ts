import { ExtendedPrismaClient } from '@packages/db'
import { 
  generateStoreSpotlight, 
  generateItemFeature, 
  generateCategoryCollection, 
  generateTraitMatch,
  CONTENT_TYPES,
  FRESHNESS_RULES,
  GENERATION_LIMITS,
  type ContentGenerationOptions,
  type StoreCategory,
  type SpotlightCriteria
} from './river-content-generation.service'
import type { RiverPost, PostSource } from '@prisma/client'

// ========================================
// Enhanced River Ingestion Service
// ========================================

export interface EnhancedRiverIngestResult {
  created: number
  skipped: {
    existing: number
    noMedia: number
    cooldown: number
    limits: number
    duplicates: number
  }
  errors: number
  content: {
    storeSpotlights: number
    itemFeatures: number
    categoryCollections: number
    traitMatches: number
    newStores: number
  }
}

export const emptyEnhancedResult = (): EnhancedRiverIngestResult => ({
  created: 0,
  skipped: { existing: 0, noMedia: 0, cooldown: 0, limits: 0, duplicates: 0 },
  errors: 0,
  content: { storeSpotlights: 0, itemFeatures: 0, categoryCollections: 0, traitMatches: 0, newStores: 0 }
})

export const mergeEnhancedResult = (
  result: EnhancedRiverIngestResult, 
  updates: Partial<EnhancedRiverIngestResult>
): EnhancedRiverIngestResult => ({
  created: result.created + (updates.created || 0),
  skipped: {
    existing: result.skipped.existing + (updates.skipped?.existing || 0),
    noMedia: result.skipped.noMedia + (updates.skipped?.noMedia || 0),
    cooldown: result.skipped.cooldown + (updates.skipped?.cooldown || 0),
    limits: result.skipped.limits + (updates.skipped?.limits || 0),
    duplicates: result.skipped.duplicates + (updates.skipped?.duplicates || 0)
  },
  errors: result.errors + (updates.errors || 0),
  content: {
    storeSpotlights: result.content.storeSpotlights + (updates.content?.storeSpotlights || 0),
    itemFeatures: result.content.itemFeatures + (updates.content?.itemFeatures || 0),
    categoryCollections: result.content.categoryCollections + (updates.content?.categoryCollections || 0),
    traitMatches: result.content.traitMatches + (updates.content?.traitMatches || 0),
    newStores: result.content.newStores + (updates.content?.newStores || 0)
  }
})

// ========================================
// Main Enhanced Ingestion Function
// ========================================

export async function runEnhancedRiverIngestion(
  db: ExtendedPrismaClient,
  options?: ContentGenerationOptions
): Promise<EnhancedRiverIngestResult> {
  const result = emptyEnhancedResult()
  
  try {
    // 1. Get base data
    const stores = await db.store.findMany({
      where: { isPublished: true },
      include: { 
        items: { where: { isActive: true } },
        media: { where: { kind: { in: ['IMAGE', 'VIDEO'] } }
      }
    })
    
    // 2. Categorize all stores
    const categorizedStores = stores.map(store => ({
      store,
      category: categorizeStore(store)
    }))
    
    // 3. Calculate content generation targets
    const targetPosts = options?.targetPosts || GENERATION_LIMITS.totalPosts
    const storeCount = stores.length
    const hourlyTarget = Math.min(GENERATION_LIMITS.hourlyPosts, Math.max(10, Math.floor(storeCount * 0.1)))
    
    // 4. Generate content by type
    const content = await generateContentByType(db, categorizedStores, targetPosts, hourlyTarget)
    
    // 5. Create posts with duplicate checking
    for (const post of content) {
      try {
        await createEnhancedPost(db, post)
        result.created++
        updateContentCount(result, post.contentType)
      } catch (error) {
        if (error.code === 'P2002') {
          result.skipped.duplicates++
        } else if (error.message?.includes('cooldown')) {
          result.skipped.cooldown++
        } else if (error.message?.includes('media')) {
          result.skipped.noMedia++
        } else {
          result.errors++
        }
      }
    }
    
    console.log(`Enhanced river ingestion completed: ${result.created} created, ${JSON.stringify(result.skipped)} skipped, ${result.errors} errors`)
    console.log(`Content breakdown: ${JSON.stringify(result.content)}`)
    
  } catch (error) {
    console.error('Enhanced river ingestion failed:', error)
    result.errors++
  }
  
  return result
}

// ========================================
// Content Generation by Type
// ========================================

async function generateContentByType(
  db: ExtendedPrismaClient,
  categorizedStores: Array<{ store: any; category: StoreCategory }>,
  targetPosts: number,
  hourlyTarget: number
): Promise<Array<Partial<RiverPost>>> {
  const content: Array<Partial<RiverPost>> = []
  const stores = categorizedStores.map(cs => cs.store)
  
  // 1. Generate Store Spotlights (30%)
  const spotlightCount = Math.floor(targetPosts * CONTENT_TYPES.STORE_SPOTLIGHT)
  const newStores = stores.filter(s => isRecentlyPublished(s, 7))
  const spotlightCriteria: SpotlightCriteria[] = newStores.slice(0, spotlightCount).map(store => ({
    reason: 'new_store',
    storeId: store.id
  }))
  
  for (const criteria of spotlightCriteria) {
    const spotlight = await generateStoreSpotlight(db, criteria)
    if (spotlight) content.push(spotlight)
  }
  
  // 2. Generate Item Features (25%)
  const itemCount = Math.floor(targetPosts * CONTENT_TYPES.ITEM_FEATURE)
  const allItems = stores.flatMap(s => s.items || [])
  const popularItems = getTopItemsByEngagement(allItems, itemCount)
  
  for (const item of popularItems) {
    const store = stores.find(s => s.id === item.storeId)
    if (store) {
      const feature = await generateItemFeature(db, item, store)
      if (feature) content.push(feature)
    }
  }
  
  // 3. Generate Category Collections (20%)
  const categoryCount = Math.floor(targetPosts * CONTENT_TYPES.CATEGORY_COLLECTION)
  const categories = ['food', 'retail', 'service', 'entertainment'] as const
  
  for (const category of categories) {
    const collection = await generateCategoryCollection(db, category, stores)
    if (collection) content.push(collection)
  }
  
  // 4. Generate Trait Matches (15%)
  const traitCount = Math.floor(targetPosts * CONTENT_TYPES.TRAIT_MATCH)
  const traits = ['organic', 'local', 'handmade', 'family-owned']
  
  for (const trait of traits) {
    const match = await generateTraitMatch(db, trait, stores)
    if (match) content.push(match)
  }
  
  // 5. Generate New Store announcements (10%)
  const newStoreCount = Math.floor(targetPosts * CONTENT_TYPES.NEW_STORE)
  const remainingNewStores = newStores.slice(spotlightCount, spotlightCount + newStoreCount)
  
  for (const store of remainingNewStores) {
    const newStorePost = {
      storeId: store.id,
      content: `Welcome to ${store.name}! ${store.description?.slice(0, 100) || ''}`,
      mediaUrls: await getStoreMedia(db, store.id),
      source: 'AUTO_STORE' as PostSource,
      freshnessKind: 'NEW_SOURCE',
      priority: 100,
      duplicateKey: `new_store_${store.id}`,
      storeCategory: categorizeStore(store),
      automationKey: `new_store_${store.id}`
    }
    content.push(newStorePost)
  }
  
  console.log(`Generated ${content.length} posts: ${spotlightCount} spotlights, ${itemCount} features, ${categoryCount} collections, ${traitCount} trait matches, ${newStoreCount} new stores`)
  
  return content
}

// ========================================
// Post Creation with Validation
// ========================================

async function createEnhancedPost(
  db: ExtendedPrismaClient,
  post: Partial<RiverPost>
): Promise<RiverPost> {
  // Check duplicate limits
  if (post.duplicateKey) {
    const duplicateAllowed = await checkDuplicateAllowed(db, post.duplicateKey, post.contentType || '')
    if (!duplicateAllowed) {
      throw new Error(`Duplicate post not allowed: ${post.duplicateKey}`)
    }
  }
  
  // Check generation limits
  if (post.storeId && post.contentType) {
    const limitAllowed = await checkGenerationLimits(db, post.storeId, post.contentType)
    if (!limitAllowed) {
      throw new Error(`Generation limit exceeded for ${post.contentType}`)
    }
  }
  
  // Validate media requirement
  if (!post.mediaUrls || post.mediaUrls.length === 0) {
    throw new Error('Post must have at least one media item')
  }
  
  // Create post with freshness scoring
  const freshnessScore = calculateInitialFreshness(post)
  
  return await db.post.create({
    data: {
      ...post,
      freshnessScore,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      priority: post.priority || 50,
      layout: 'default_layout',
      publishAt: null, // Publish immediately
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
}

// ========================================
// Validation Functions
// ========================================

async function checkDuplicateAllowed(
  db: ExtendedPrismaClient,
  duplicateKey: string,
  contentType: string
): Promise<boolean> {
  const existing = await db.post.findFirst({
    where: {
      duplicateKey,
      createdAt: {
        gte: new Date(Date.now() - GENERATION_LIMITS.duplicateWindow * 24 * 60 * 60 * 1000)
      }
    }
  })
  
  return !existing
}

async function checkGenerationLimits(
  db: ExtendedPrismaClient,
  storeId: string,
  contentType: string
): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000) // Last hour
  
  const existingCount = await db.post.count({
    where: {
      storeId,
      contentType,
      createdAt: { gte: windowStart }
    }
  })
  
  const maxAllowed = Math.floor(GENERATION_LIMITS.hourlyPosts / 5) // Distribute across content types
  return existingCount < maxAllowed
}

// ========================================
// Helper Functions
// ========================================

function updateContentCount(result: EnhancedRiverIngestResult, contentType: string): void {
  switch (contentType) {
    case 'STORE_SPOTLIGHT':
      result.content.storeSpotlights++
      break
    case 'ITEM_FEATURE':
      result.content.itemFeatures++
      break
    case 'CATEGORY_COLLECTION':
      result.content.categoryCollections++
      break
    case 'TRAIT_MATCH':
      result.content.traitMatches++
      break
    case 'NEW_STORE':
      result.content.newStores++
      break
  }
}

function isRecentlyPublished(store: any, days: number): boolean {
  if (!store.createdAt) return false
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return new Date(store.createdAt) > cutoffDate
}

function getTopItemsByEngagement(items: any[], count: number): any[] {
  // Sort by a simple engagement proxy (price + description length + has image)
  return items
    .filter(item => item.isActive)
    .sort((a, b) => {
      const scoreA = calculateItemEngagementScore(a)
      const scoreB = calculateItemEngagementScore(b)
      return scoreB - scoreA
    })
    .slice(0, count)
}

function calculateItemEngagementScore(item: any): number {
  let score = 0
  
  // Has image
  if (item.imageUrl) score += 20
  
  // Has description
  if (item.description && item.description.length > 20) score += 10
  
  // Lower price (perceived value)
  if (item.price && item.price < 25) score += 5
  
  // Title length
  if (item.title && item.title.length > 10) score += 3
  
  return score
}

async function getStoreMedia(db: ExtendedPrismaClient, storeId: string): Promise<any[]> {
  const media = await db.mediaAsset.findMany({
    where: { 
      storeId,
      kind: { in: ['IMAGE', 'VIDEO'] }
    },
    orderBy: { sortIndex: 'asc' },
    take: 5
  })
  
  return media.map(m => ({
    type: m.kind.toLowerCase(),
    url: m.url,
    thumbnail: m.url,
    title: 'Store image',
    provider: 'local',
    width: 800,
    height: 600
  }))
}

function calculateInitialFreshness(post: Partial<RiverPost>): number {
  const freshnessKind = post.freshnessKind || 'NEW_SOURCE'
  const rules = FRESHNESS_RULES[freshnessKind as keyof typeof FRESHNESS_RULES]
  return rules ? rules.baseScore : 100
}
