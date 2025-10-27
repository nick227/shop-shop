/**
 * Type Transformers - Utility functions for data transformation
 * Provides common data transformation and formatting functions
 */

// ============================================
// Price Transformation Functions
// ============================================

/**
 * Parse price from string or number to number
 */
export function parsePrice(price: string | number | undefined): number {
  if (price === undefined) return 0
  
  if (typeof price === 'number') return price
  
  if (typeof price === 'string') {
    // Remove currency symbols and parse
    const cleaned = price.replaceAll(/[^\d.-]/g, '')
    const parsed = Number.parseFloat(cleaned)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

/**
 * Format price as currency string
 */
export function formatPrice(price: number | string | undefined, currency = 'USD'): string {
  const numericPrice = parsePrice(price)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericPrice)
}

// ============================================
// Distance Calculation Functions
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'miles' = 'miles'
): number {
  const R = unit === 'km' ? 6371 : 3959 // Earth's radius in km or miles
  
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// ============================================
// Order Transformation Functions
// ============================================

/**
 * Add details to order object
 */
export function addDetailsToOrder<T extends Record<string, unknown>>(
  order: T,
  details: Partial<T>
): T {
  return {
    ...order,
    ...details,
    updatedAt: new Date().toISOString()
  }
}

// ============================================
// Store Transformation Functions
// ============================================

/**
 * Add store information to item
 */
export function addStoreToItem<T extends Record<string, unknown>>(
  item: T,
  store: { id: string; name: string; slug: string }
): T & { store: { id: string; name: string; slug: string } } {
  return {
    ...item,
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug
    }
  }
}

// ============================================
// Address Transformation Functions
// ============================================

/**
 * Add coordinates to address object
 */
export function addCoordinatesToAddress<T extends Record<string, unknown>>(
  address: T,
  coordinates: { latitude: number; longitude: number }
): T & { latitude: number; longitude: number } {
  return {
    ...address,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude
  }
}

/**
 * Add distance to store object
 */
export function addDistanceToStore<T extends Record<string, unknown>>(
  store: T,
  distance: number
): T & { distance: number } {
  return {
    ...store,
    distance: roundToDecimals(distance, 2)
  }
}

/**
 * Flatten store address object
 */
export function flattenStoreAddress<T extends Record<string, unknown>>(
  store: T
): T & { 
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressZip?: string
  addressCountry?: string
} {
  const address = store.addressJson
  if (!address || typeof address !== 'object') {
    return store
  }

  const addressObj = address as Record<string, unknown>
  
  return {
    ...store,
    addressStreet: (addressObj.street as string) ?? (addressObj.addressStreet as string),
    addressCity: (addressObj.city as string) ?? (addressObj.addressCity as string),
    addressState: (addressObj.state as string) ?? (addressObj.addressState as string),
    addressZip: (addressObj.zip as string) ?? (addressObj.addressZip as string),
    addressCountry: (addressObj.country as string) ?? (addressObj.addressCountry as string) ?? 'US'
  }
}

/**
 * Add fees to store object
 */
export function addFeesToStore<T extends Record<string, unknown>>(
  store: T,
  fees: { deliveryFee?: number; serviceFee?: number; taxRate?: number }
): T & { 
  deliveryFee?: number
  serviceFee?: number
  taxRate?: number
} {
  return {
    ...store,
    deliveryFee: fees.deliveryFee,
    serviceFee: fees.serviceFee,
    taxRate: fees.taxRate
  }
}

/**
 * Add name to user object
 */
export function addNameToUser<T extends Record<string, unknown>>(
  user: T,
  name: string
): T & { name: string } {
  return {
    ...user,
    name: toTitleCase(name.trim())
  }
}

// ============================================
// String Transformation Functions
// ============================================

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  return str.replaceAll(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  )
}

/**
 * Convert string to slug
 */
export function toSlug(str: string): string {
  let result = str
    .toLowerCase()
    .trim()
    .replaceAll(/[^\s\w-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+/, '')
  
  // Remove trailing dashes more efficiently
  while (result.endsWith('-')) {
    result = result.slice(0, -1)
  }
  
  return result
}

/**
 * Truncate string to specified length
 */
export function truncateString(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str
  return str.slice(0, Math.max(0, length - suffix.length)) + suffix
}

// ============================================
// Number Transformation Functions
// ============================================

/**
 * Format number with commas
 */
export function formatNumber(num: number | string): string {
  const numeric = typeof num === 'string' ? Number.parseFloat(num) : num
  if (Number.isNaN(numeric)) return '0'
  
  return new Intl.NumberFormat('en-US').format(numeric)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return '' + (value * 100).toFixed(decimals) + '%'
}

/**
 * Round to specified decimal places
 */
export function roundToDecimals(num: number, decimals = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

// ============================================
// Date Transformation Functions
// ============================================

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return '' + Math.floor(diffInSeconds / 60) + ' minutes ago'
  if (diffInSeconds < 86_400) return '' + Math.floor(diffInSeconds / 3600) + ' hours ago'
  if (diffInSeconds < 2_592_000) return '' + Math.floor(diffInSeconds / 86_400) + ' days ago'
  
  return formatDate(dateObj)
}

// ============================================
// Array Transformation Functions
// ============================================

/**
 * Transform array items with mapping function
 */
export function transformArray<T, U>(
  array: T[],
  transformer: (item: T, index: number) => U
): U[] {
  return array.map((item, index) => transformer(item, index))
}

/**
 * Group array items by key
 */
export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by key
 */
export function sortBy<T, K extends keyof T>(
  array: T[],
  key: K,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// ============================================
// Object Transformation Functions
// ============================================

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  return result
}

/**
 * Omit specific keys from object
 */
export function omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) {
    delete result[key]
  }
  return result
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    result[key] = source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) ? deepMerge(result[key] || {}, source[key]) as T[Extract<keyof T, string>] : source[key] as T[Extract<keyof T, string>];
  }
  
  return result
}
