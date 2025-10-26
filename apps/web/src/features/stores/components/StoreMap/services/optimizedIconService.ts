/**
 * OptimizedIconService - High-performance icon management with memory optimization
 * Features: LRU cache, memory limits, batch operations, singleton pattern
 */
import L from 'leaflet'

export interface IconOptions {
  className?: string
  html?: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  popupAnchor?: [number, number]
}

interface CacheEntry {
  icon: L.DivIcon
  lastUsed: number
  accessCount: number
}

export class OptimizedIconService {
  private static readonly MAX_CACHE_SIZE = 50
  private static readonly CACHE_CLEANUP_INTERVAL = 300_000 // 5 minutes
  private static readonly iconCache = new Map<string, CacheEntry>()
  private static cleanupTimer: NodeJS.Timeout | null = null
  private static accessCounter = 0

  // Singleton pattern for global cache management
  private static initializeCleanup(): void {
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupCache()
      }, this.CACHE_CLEANUP_INTERVAL)
    }
  }

  private static cleanupCache(): void {
    if (this.iconCache.size <= this.MAX_CACHE_SIZE) return

    // Convert to array and sort by last used (LRU)
    const entries = [...this.iconCache.entries()]
      .sort(([, a], [, b]) => a.lastUsed - b.lastUsed)

    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25)
    for (let i = 0; i < toRemove; i++) {
      if (entries[i]) {
        this.iconCache.delete(entries[i][0])
      }
    }
  }

  static getIcon(key: string, options: IconOptions): L.DivIcon {
    this.initializeCleanup()
    this.accessCounter++

    const existing = this.iconCache.get(key)
    if (existing) {
      existing.lastUsed = this.accessCounter
      existing.accessCount++
      return existing.icon
    }

    // Create new icon
    const icon = L.divIcon({
      className: options.className || 'custom-marker',
      html: options.html || '<div>📍</div>',
      iconSize: options.iconSize || [40, 40],
      iconAnchor: options.iconAnchor || [20, 40],
      popupAnchor: options.popupAnchor || [0, -40]
    })

    // Cache with metadata
    this.iconCache.set(key, {
      icon,
      lastUsed: this.accessCounter,
      accessCount: 1
    })

    return icon
  }

  // Batch icon creation for multiple stores
  static getStoreIcons(storeCount: number, styles?: Record<string, string>): {
    regular: L.DivIcon
    nearest: L.DivIcon
  } {
    const regular = this.getStoreIcon(false, styles)
    const nearest = this.getStoreIcon(true, styles)
    return { regular, nearest }
  }

  static getStoreIcon(isNearest: boolean, styles?: Record<string, string>): L.DivIcon {
    const key = 'store-' + isNearest ? 'nearest' : 'regular' + ''
    const markerClass = styles?.['marker'] || 'w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white cursor-pointer'
    const nearestClass = isNearest ? (styles?.['nearestMarker'] || 'bg-green-600 ring-4 ring-green-200') : ''
    const iconClass = styles?.['markerIcon'] || 'text-xl'
    
    return this.getIcon(key, {
      className: 'custom-store-marker',
      html: '<div class="' + markerClass + ' ' + nearestClass + '"><div class="' + iconClass + '">🍽️</div></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  }

  static getUserIcon(styles?: Record<string, string>): L.DivIcon {
    const userClass = styles?.userMarker || 'w-4 h-4 bg-red-600 rounded-full ring-4 ring-red-200'
    
    return this.getIcon('user', {
      className: 'custom-user-marker',
      html: '<div class="' + userClass + '">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }

  // Memory management
  static clearCache(): void {
    this.iconCache.clear()
  }

  static getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    const totalAccesses = [...this.iconCache.values()]
      .reduce((sum, entry) => sum + entry.accessCount, 0)
    const cacheHits = totalAccesses - this.iconCache.size
    const hitRate = totalAccesses > 0 ? cacheHits / totalAccesses : 0

    return {
      size: this.iconCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      hitRate
    }
  }

  // Cleanup on unmount
  static destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clearCache()
  }
}
