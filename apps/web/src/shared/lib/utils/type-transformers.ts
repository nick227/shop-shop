/**
 * Type Transformers - Utility functions for data transformations
 * 
 * These functions transform base SDK types into enhanced types
 * with computed fields for frontend use.
 */

import type {
  StoreResponse,
  UserResponse,
  OrderResponse,
  ItemResponse,
  AddressResponse,
  PostResponse,
  CommentResponse
} from '../api/types'

import type {
  StoreWithLocation,
  StoreWithFees,
  StoreWithRating,
  UserWithName,
  UserWithRole,
  OrderWithDetails,
  OrderWithDelivery,
  ItemWithStore,
  ItemWithPricing,
  AddressWithCoordinates,
  PostWithEngagement,
  PostWithMedia,
  CommentWithUser
} from '../types/extensions'

// ============================================
// Store Transformers
// ============================================

/**
 * Add distance to store from user's location
 */
export function addDistanceToStore(
  store: StoreResponse,
  userLat?: number,
  userLng?: number
): StoreWithLocation {
  const storeLat = Number.parseFloat(store.latitude || '0')
  const storeLng = Number.parseFloat(store.longitude || '0')
  
  let distance: number | undefined
  if (userLat && userLng && storeLat && storeLng) {
    distance = calculateDistance(userLat, userLng, storeLat, storeLng)
  }

  return {
    ...store,
    distance,
    fullAddress: formatStoreAddress(store),
    coordinates: storeLat && storeLng ? { lat: storeLat, lng: storeLng } : undefined
  }
}

/**
 * Add fee information to store
 */
export function addFeesToStore(store: StoreResponse): StoreWithFees {
  const deliveryFee = Number.parseFloat(store.deliveryCharge || '0')
  const serviceFee = 0.1 // 10% service fee (example)
  const taxRate = 0.08 // 8% tax rate (example)
  
  const feesBreakdown = {
    delivery: deliveryFee,
    service: serviceFee,
    tax: taxRate,
    total: deliveryFee + serviceFee + taxRate
  }

  return {
    ...store,
    deliveryFee,
    serviceFee,
    taxRate,
    feesBreakdown
  }
}

/**
 * Add rating information to store
 */
export function addRatingToStore(store: StoreResponse): StoreWithRating {
  // Mock rating data - in real app, this would come from reviews
  const averageRating = 4.2
  const reviewCount = 127
  const ratingDistribution = {
    5: 45,
    4: 38,
    3: 25,
    2: 12,
    1: 7
  }

  return {
    ...store,
    averageRating,
    reviewCount,
    ratingDistribution
  }
}

// ============================================
// User Transformers
// ============================================

/**
 * Add display name to user
 */
export function addNameToUser(user: UserResponse): UserWithName {
  const displayName = user.name || user.email
  const initials = getInitials(displayName)
  const avatarUrl = undefined // Would come from user profile

  return {
    ...user,
    displayName,
    initials,
    avatarUrl
  }
}

/**
 * Add role information to user
 */
export function addRoleToUser(user: UserResponse): UserWithRole {
  const roleDisplayName = getUserRoleDisplayName(user.role)
  const permissions = getUserPermissions(user.role)
  const isAdmin = user.role === 'ADMIN'
  const isVendor = user.role === 'VENDOR'

  return {
    ...user,
    roleDisplayName,
    permissions,
    isAdmin,
    isVendor
  }
}

// ============================================
// Order Transformers
// ============================================

/**
 * Add details to order
 */
export function addDetailsToOrder(order: OrderResponse): OrderWithDetails {
  const orderNumber = `#${order.id.slice(-8).toUpperCase()}`
  const statusDisplayName = getOrderStatusDisplayName(order.status)
  const estimatedDelivery = getEstimatedDeliveryTime(order.createdAt)
  const totalValue = calculateOrderTotal(order)

  return {
    ...order,
    orderNumber,
    statusDisplayName,
    estimatedDelivery,
    totalValue,
    itemsWithDetails: [], // Would be populated from order items
    timeline: [] // Would be populated from order events
  }
}

/**
 * Add delivery information to order
 */
export function addDeliveryToOrder(order: OrderResponse): OrderWithDelivery {
  return {
    ...order,
    deliveryAddress: undefined, // Would come from order data
    deliveryInstructions: undefined,
    deliveryStatus: 'pending',
    trackingInfo: undefined
  }
}

// ============================================
// Item Transformers
// ============================================

/**
 * Add store information to item
 */
export function addStoreToItem(item: ItemResponse, store?: StoreResponse): ItemWithStore {
  return {
    ...item,
    store,
    storeName: store?.name,
    storeImage: store?.media?.[0]?.url, // Get first media URL
    storeRating: 4.2 // Would come from store rating
  }
}

/**
 * Add pricing information to item
 */
export function addPricingToItem(item: ItemResponse): ItemWithPricing {
  const price = Number.parseFloat(item.price.toString())
  const formattedPrice = formatPrice(price)
  const isOnSale = false // Would come from item data
  const originalPrice = isOnSale ? price * 1.2 : undefined
  const discountAmount = originalPrice ? originalPrice - price : 0
  const discountPercentage = originalPrice ? (discountAmount / originalPrice) * 100 : 0

  return {
    ...item,
    formattedPrice,
    originalPrice,
    discountAmount,
    discountPercentage,
    isOnSale
  }
}

// ============================================
// Address Transformers
// ============================================

/**
 * Add coordinates to address
 */
export function addCoordinatesToAddress(address: AddressResponse): AddressWithCoordinates {
  // Extract coordinates from geo field if available
  const geo = address.geo as { latitude?: number; longitude?: number } | null
  const latitude = geo?.latitude || 0
  const longitude = geo?.longitude || 0
  const formattedAddress = formatAddress(address)
  
  const components = {
    street: address.line1,
    city: address.city,
    state: address.state,
    zip: address.postalCode,
    country: address.country
  }

  return {
    ...address,
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    formattedAddress,
    components
  }
}

// ============================================
// Post Transformers
// ============================================

/**
 * Add engagement data to post
 */
export function addEngagementToPost(post: PostResponse): PostWithEngagement {
  const isLiked = false // Would come from user data
  const isBookmarked = false // Would come from user data
  const engagementRate = calculateEngagementRate(post)
  const timeAgo = getTimeAgo(post.createdAt)

  return {
    ...post,
    isLiked,
    isBookmarked,
    engagementRate,
    timeAgo,
    author: undefined // Would come from user data
  }
}

/**
 * Add media data to post
 */
export function addMediaToPost(post: PostResponse): PostWithMedia {
  const mediaItems = processMediaUrls(post.mediaUrls)
  const hasMedia = mediaItems.length > 0
  const mediaCount = mediaItems.length

  return {
    ...post,
    mediaItems,
    hasMedia,
    mediaCount
  }
}

// ============================================
// Comment Transformers
// ============================================

/**
 * Add user data to comment
 */
export function addUserToComment(comment: CommentResponse): CommentWithUser {
  const timeAgo = getTimeAgo(comment.createdAt)
  const isEdited = comment.updatedAt !== comment.createdAt
  const replyCount = 0 // Would come from comment data

  return {
    ...comment,
    timeAgo,
    isEdited,
    replyCount,
    author: undefined // Would come from user data
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Format store address
 */
export function formatStoreAddress(store: StoreResponse): string {
  const parts = [
    store.addressStreet,
    store.addressCity,
    store.addressState,
    store.addressZip
  ].filter(Boolean)
  
  return parts.join(', ')
}

/**
 * Format address
 */
export function formatAddress(address: AddressResponse): string {
  const parts = [
    address.line1,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean)
  
  return parts.join(', ')
}

/**
 * Format price
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

/**
 * Get user initials
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get user role display name
 */
export function getUserRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'USER': 'Customer',
    'VENDOR': 'Vendor',
    'ADMIN': 'Administrator'
  }
  return roleMap[role] || role
}

/**
 * Get user permissions
 */
export function getUserPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'USER': ['read:profile', 'read:orders', 'create:orders'],
    'VENDOR': ['read:profile', 'read:orders', 'create:orders', 'manage:store', 'manage:items'],
    'ADMIN': ['*']
  }
  return permissionMap[role] || []
}

/**
 * Get order status display name
 */
export function getOrderStatusDisplayName(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing',
    'READY': 'Ready for Pickup',
    'OUT_FOR_DELIVERY': 'Out for Delivery',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled'
  }
  return statusMap[status] || status
}

/**
 * Get estimated delivery time
 */
export function getEstimatedDeliveryTime(createdAt: string): string {
  const created = new Date(createdAt)
  const estimated = new Date(created.getTime() + 30 * 60 * 1000) // 30 minutes
  return estimated.toLocaleString()
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(order: OrderResponse): number {
  // This would calculate from order items
  return 0
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(post: PostResponse): number {
  const total = (post.likesCount || 0) + (post.commentsCount || 0) + (post.sharesCount || 0)
  return total / 100 // Mock calculation
}

/**
 * Get time ago string
 */
export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86_400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86_400)}d ago`
}

/**
 * Process media URLs
 */
export function processMediaUrls(mediaUrls: Record<string, unknown>): {
  id: string
  url: string
  type: 'image' | 'video' | 'youtube' | 'link'
  thumbnail?: string
  duration?: number
  dimensions?: { width: number; height: number }
}[] {
  // This would process the mediaUrls object into structured media items
  return []
}