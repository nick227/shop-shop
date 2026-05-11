import { ExtendedPrismaClient } from '@packages/db'
import type { RiverPost, RiverPostSeen } from '@prisma/client'

// ========================================
// Scoring & Ranking System
// ========================================

export interface UserContext {
  userId?: string
  preferences?: {
    categories?: string[]
    priceRanges?: string[]
    traits?: string[]
  }
  location?: {
    latitude?: number
    longitude?: number
    city?: string
  }
  activeHours?: {
    start?: number // Hour (0-23)
    end?: number   // Hour (0-23)
  }
}

export interface PostScore {
  freshness: number        // 0-100 based on age and type
  typeBoost: number        // Content type priority bonus
  categoryRelevance: number // User category preference match
  mediaQuality: number     // Image/video quality assessment
  seenPenalty: number     // Penalty for previously seen content
  randomness: number       // Controlled randomness within buckets
  total: number          // Final score for ranking
}

export interface ScoringOptions {
  enableSeenPenalty?: boolean
  enableCategoryBoost?: boolean
  enableMediaQualityBoost?: boolean
  randomnessFactor?: number // 0-1, lower = more random
}

// ========================================
// Core Scoring Algorithm
// ========================================

export const calculatePostScore = async (
  db: ExtendedPrismaClient,
  post: RiverPost,
  userContext: UserContext,
  options: ScoringOptions = {}
): Promise<PostScore> => {
  
  // 1. Freshness score
  const freshnessScore = calculateFreshnessScore(post)
  
  // 2. Type-based boost
  const typeBoost = calculateTypeBoost(post.contentType)
  
  // 3. Category relevance (if user has preferences)
  const categoryRelevance = await calculateCategoryRelevance(
    db, 
    post, 
    userContext, 
    options
  )
  
  // 4. Media quality assessment
  const mediaQuality = await assessMediaQuality(post.mediaUrls as any[])
  
  // 5. Seen content penalty
  const seenPenalty = options.enableSeenPenalty 
    ? await getSeenPenalty(db, userContext.userId, post.id)
    : 0
  
  // 6. Controlled randomness (within type buckets only)
  const randomness = calculateRandomness(post.contentType, options.randomnessFactor || 0.3)
  
  return {
    freshness: freshnessScore,
    typeBoost,
    categoryRelevance,
    mediaQuality,
    seenPenalty,
    randomness,
    total: freshnessScore + typeBoost + categoryRelevance + 
           mediaQuality - seenPenalty + randomness
  }
}

// ========================================
// Individual Scoring Components
// ========================================

const calculateFreshnessScore = (post: RiverPost): number => {
  const age = Date.now() - new Date(post.createdAt).getTime()
  const ageHours = age / (1000 * 60 * 60)
  
  // Freshness kind rules
  const rules = {
    NEW_SOURCE: { baseScore: 100, decay: 2, maxAge: 6 },
    RECENT_SOURCE: { baseScore: 80, decay: 1.5, maxAge: 24 },
    REPACKAGED: { baseScore: 60, decay: 1, maxAge: 72 },
    EVERGREEN: { baseScore: 40, decay: 0.5, maxAge: 168 }
  }
  
  const freshnessKind = post.freshnessKind || 'NEW_SOURCE'
  const rule = rules[freshnessKind as keyof typeof rules]
  
  if (!rule) return 50 // Default fallback
  
  const decayedScore = Math.max(0, rule.baseScore - (ageHours * rule.decay))
  return Math.min(decayedScore, rule.baseScore)
}

const calculateTypeBoost = (contentType: string | null): number => {
  const boosts = {
    STORE_SPOTLIGHT: 20,
    ITEM_FEATURE: 15,
    CATEGORY_COLLECTION: 10,
    TRAIT_MATCH: 8,
    NEW_STORE: 25
  }
  
  return boosts[contentType as keyof typeof boosts] || 0
}

const calculateCategoryRelevance = async (
  db: ExtendedPrismaClient,
  post: RiverPost,
  userContext: UserContext,
  options: ScoringOptions
): Promise<number> => {
  if (!options.enableCategoryBoost || !userContext.preferences?.categories) {
    return 0
  }
  
  const postCategory = post.storeCategory as any
  const userCategories = userContext.preferences.categories || []
  
  // Check if post's primary category matches user preferences
  const primaryMatch = userCategories.includes(postCategory?.primary)
  if (primaryMatch) return 15
  
  // Check if post's secondary category matches
  if (postCategory?.secondary && userCategories.includes(postCategory.secondary)) {
    return 10
  }
  
  // Check if any tags match
  if (postCategory?.tags) {
    const tagMatch = postCategory.tags.some(tag => userCategories.includes(tag))
    if (tagMatch) return 5
  }
  
  return 0
}

const assessMediaQuality = async (mediaUrls: any[]): Promise<number> => {
  if (!mediaUrls || mediaUrls.length === 0) return 0
  
  let qualityScore = 0
  
  for (const media of mediaUrls) {
    // Boost for having multiple media items
    qualityScore += Math.min(10, mediaUrls.length * 2)
    
    // Boost for high-quality media types
    if (media.type === 'video') qualityScore += 5
    if (media.type === 'image' && media.width && media.height) {
      const resolution = media.width * media.height
      if (resolution >= 800 * 600) qualityScore += 3
    }
    
    // Boost for thumbnails
    if (media.thumbnail) qualityScore += 2
  }
  
  return Math.min(20, qualityScore)
}

const getSeenPenalty = async (
  db: ExtendedPrismaClient,
  userId: string | undefined,
  postId: string
): Promise<number> => {
  if (!userId) return 0
  
  const seen = await db.riverPostSeen.findUnique({
    where: { userId_postId: { userId, postId } }
  })
  
  return seen ? 30 : 0 // 30 point penalty for seen content
}

const calculateRandomness = (contentType: string | null, factor: number): number => {
  // Generate random score 0-5, weighted by factor
  return Math.random() * 5 * factor
}

// ========================================
// Ranking Algorithm
// ========================================

export const rankRiverFeed = async (
  db: ExtendedPrismaClient,
  posts: RiverPost[],
  userContext: UserContext,
  options: ScoringOptions = {}
): Promise<RiverPost[]> => {
  
  // 1. Score all posts
  const scoredPosts = await Promise.all(
    posts.map(post => ({
      post,
      score: await calculatePostScore(db, post, userContext, options)
    }))
  )
  
  // 2. Sort by total score (descending)
  scoredPosts.sort((a, b) => b.score.total - a.score.total)
  
  // 3. Apply controlled randomness within type buckets
  const bucketedPosts = applyBucketRandomization(scoredPosts)
  
  // 4. Return sorted posts
  return bucketedPosts.map(item => item.post)
}

// ========================================
// Bucket Randomization
// ========================================

interface ScoredPost {
  post: RiverPost
  score: PostScore
}

const applyBucketRandomization = (scoredPosts: ScoredPost[]): ScoredPost[] => {
  // Group by content type
  const buckets = scoredPosts.reduce((acc, item) => {
    const type = item.post.contentType || 'unknown'
    if (!acc[type]) acc[type] = []
    acc[type].push(item)
    return acc
  }, {} as Record<string, ScoredPost[]>)
  
  // Apply randomness within each bucket
  Object.keys(buckets).forEach(type => {
    const bucket = buckets[type]
    if (bucket.length > 1) {
      // Shuffle within bucket but keep high-scoring items toward front
      bucket.sort((a, b) => {
        const scoreDiff = Math.abs(a.score.total - b.score.total)
        
        if (scoreDiff < 5) {
          // Small score difference - add randomness
          return Math.random() - 0.5
        } else {
          // Large score difference - keep order
          return b.score.total - a.score.total
        }
      })
    }
  })
  
  // Flatten back to single array
  return Object.values(buckets).flat()
}

// ========================================
// Seen Content Tracking
// ========================================

export const markContentAsSeen = async (
  db: ExtendedPrismaClient,
  userId: string,
  postId: string
): Promise<void> => {
  await db.riverPostSeen.upsert({
    where: { userId_postId: { userId, postId } },
    update: { seenAt: new Date() },
    create: { userId, postId, seenAt: new Date() }
  })
}

export const getSeenPosts = async (
  db: ExtendedPrismaClient,
  userId: string,
  limit: number = 100
): Promise<string[]> => {
  const seen = await db.riverPostSeen.findMany({
    where: { userId },
    orderBy: { seenAt: 'desc' },
    take: limit
  })
  
  return seen.map(s => s.postId)
}

export const cleanupOldSeenContent = async (
  db: ExtendedPrismaClient,
  daysOld: number = 30
): Promise<{ deleted: number }> => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
  
  const result = await db.riverPostSeen.deleteMany({
    where: {
      seenAt: { lt: cutoffDate }
    }
  })
  
  return { deleted: result.count }
}
