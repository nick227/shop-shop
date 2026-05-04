/**
 * Frontend Extensions - Computed Fields
 * 
 * These types extend base SDK types with computed fields
 * that are commonly needed by frontend components.
 */

import type {
  StoreResponse,
  UserResponse,
  OrderResponse,
  ItemResponse,
  AddressResponse,
  PostResponse,
  CommentResponse
} from '@api/types'

// ============================================
// Store Extensions
// ============================================

/** Store with computed location data */
export interface StoreWithLocation extends StoreResponse {
  /** Computed distance from user's location */
  distance?: number
  /** Formatted address string */
  fullAddress?: string
  /** Coordinates for mapping */
  coordinates?: {
    lat: number
    lng: number
  }
}

/** Store with computed fee information */
export interface StoreWithFees extends Omit<StoreResponse, 'deliveryFee'> {
  /** Computed delivery fee */
  deliveryFee?: number
  /** Computed service fee */
  serviceFee?: number
  /** Computed tax rate */
  taxRate?: number
  /** Total fees breakdown */
  feesBreakdown?: {
    delivery: number
    service: number
    tax: number
    total: number
  }
}

/** Store with computed rating and review data */
export interface StoreWithRating extends StoreResponse {
  /** Average rating */
  averageRating?: number
  /** Total number of reviews */
  reviewCount?: number
  /** Rating distribution */
  ratingDistribution?: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

// ============================================
// User Extensions
// ============================================

/** User with computed display name */
export interface UserWithName extends UserResponse {
  /** Computed display name (name or email) */
  displayName?: string
  /** User's initials for avatar */
  initials?: string
  /** Avatar URL if available */
  avatarUrl?: string
}

/** User with computed role information */
export interface UserWithRole extends UserResponse {
  /** Human-readable role name */
  roleDisplayName?: string
  /** Role permissions */
  permissions?: string[]
  /** Is admin user */
  isAdmin?: boolean
  /** Is vendor user */
  isVendor?: boolean
}

// ============================================
// Order Extensions
// ============================================

/** Order with computed details */
export interface OrderWithDetails extends OrderResponse {
  /** Formatted order number */
  orderNumber?: string
  /** Order status display name */
  statusDisplayName?: string
  /** Estimated delivery time */
  estimatedDelivery?: string
  /** Order items with details */
  itemsWithDetails?: {
    id: string
    name: string
    quantity: number
    price: number
    total: number
    imageUrl?: string
  }[]
  /** Total order value */
  totalValue?: number
  /** Order timeline */
  timeline?: {
    status: string
    timestamp: string
    description: string
  }[]
}

/** Order with computed delivery information */
export interface OrderWithDelivery extends OrderResponse {
  /** Delivery address details */
  deliveryAddress?: AddressResponse
  /** Delivery instructions */
  deliveryInstructions?: string
  /** Delivery status */
  deliveryStatus?: 'pending' | 'in_transit' | 'delivered' | 'failed'
  /** Delivery tracking information */
  trackingInfo?: {
    trackingNumber?: string
    carrier?: string
    estimatedDelivery?: string
    currentLocation?: string
  }
}

// ============================================
// Item Extensions
// ============================================

/** Item with store information */
export interface ItemWithStore extends Omit<ItemResponse, 'store'> {
  /** Store details */
  store?: StoreResponse
  /** Store name */
  storeName?: string
  /** Store image */
  storeImage?: string
  /** Store rating */
  storeRating?: number
}

/** Item with computed pricing */
export interface ItemWithPricing extends ItemResponse {
  /** Formatted price */
  formattedPrice?: string
  /** Original price if on sale */
  originalPrice?: number
  /** Discount amount */
  discountAmount?: number
  /** Discount percentage */
  discountPercentage?: number
  /** Is on sale */
  isOnSale?: boolean
}

// ============================================
// Address Extensions
// ============================================

/** Address with computed coordinates */
export interface AddressWithCoordinates extends AddressResponse {
  /** Latitude */
  latitude?: number
  /** Longitude */
  longitude?: number
  /** Formatted address */
  formattedAddress?: string
  /** Address components */
  components?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

// ============================================
// Post Extensions
// ============================================

/** Post with computed engagement data */
export interface PostWithEngagement extends PostResponse {
  /** Is liked by current user */
  isLiked?: boolean
  /** Is bookmarked by current user */
  isBookmarked?: boolean
  /** Engagement rate */
  engagementRate?: number
  /** Time since posted */
  timeAgo?: string
  /** Post author information */
  author?: {
    id: string
    name: string
    avatar?: string
    isVerified?: boolean
  }
}

/** Post with computed media data */
export interface PostWithMedia extends PostResponse {
  /** Processed media items */
  mediaItems?: {
    id: string
    url: string
    type: 'image' | 'video' | 'youtube' | 'link'
    thumbnail?: string
    duration?: number
    dimensions?: {
      width: number
      height: number
    }
  }[]
  /** Has media */
  hasMedia?: boolean
  /** Media count */
  mediaCount?: number
}

// ============================================
// Comment Extensions
// ============================================

/** Comment with computed user data */
export interface CommentWithUser extends CommentResponse {
  /** Comment author information */
  author?: {
    id: string
    name: string
    avatar?: string
    isVerified?: boolean
  }
  /** Time since commented */
  timeAgo?: string
  /** Is edited */
  isEdited?: boolean
  /** Reply count */
  replyCount?: number
}

// ============================================
// Utility Types
// ============================================

/** Generic entity with computed fields */
export type EntityWithComputed<T, K extends keyof any> = T & Record<K, any>

/** Paginated response with computed fields */
export interface PaginatedWithComputed<T> {
  data: T[]
  total: number
  page: number
  limit: number
  /** Computed pagination info */
  pagination?: {
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage?: number
    prevPage?: number
  }
}

/** Search result with computed relevance */
export interface SearchResultWithRelevance<T> {
  item: T
  /** Relevance score */
  relevanceScore?: number
  /** Matched fields */
  matchedFields?: string[]
  /** Highlighted text */
  highlightedText?: string
}