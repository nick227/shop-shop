/**
 * Advanced API Cache Manager - Optimized for Performance
 * Features: LRU eviction, cache warming, performance monitoring
 */

export type ApiInstance = Record<string, any>;

export interface CacheStats {
  size: number
  maxSize: number
  configVersion: number
  instanceVersions: Record<string, number>
  staleInstances: string[]
  hitRate: number
  missRate: number
  totalRequests: number
  averageAccessTime: number
  memoryUsage: number
}

export interface CacheEntry<T> {
  instance: T
  version: number
  lastAccessed: number
  accessCount: number
  creationTime: number
}

export class ApiCacheManager {
  private readonly instances = new Map<string, CacheEntry<any>>()
  private accessOrder: string[] = []
  private readonly maxCacheSize: number = 20
  private configVersion = 0
  private isCreatingInstance = false
  
  // Performance monitoring
  private hitCount = 0
  private missCount = 0
  private totalRequests = 0
  private totalAccessTime = 0
  private startTime = Date.now()
  
  // Cache warming
  private warmupQueue: string[] = []
  private isWarmingUp = false

  constructor(maxCacheSize = 20) {
    this.maxCacheSize = maxCacheSize
  }

  /**
   * Get cached instance if valid, otherwise create new one (Type-Safe)
   */
  getOrCreate<T>(
    key: string,
    factory: () => T,
    currentConfigVersion: number
  ): T {
    const startTime = performance.now()
    this.totalRequests++

    // Check if instance exists and is not stale
    const existing = this.instances.get(key)
    if (existing && this.isInstanceValid(existing, currentConfigVersion)) {
      this.updateAccessOrder(key)
      this.hitCount++
      this.totalAccessTime += performance.now() - startTime
      return existing.instance as T
    }

    // Handle concurrent creation with proper synchronization
    if (this.isCreatingInstance) {
      // Wait for current creation to complete with exponential backoff
      return this.waitForInstanceCreation<T>(key, factory, currentConfigVersion)
    }

    this.isCreatingInstance = true

    try {
      // Double-check after acquiring lock
      const existingAfterLock = this.instances.get(key)
      if (existingAfterLock && this.isInstanceValid(existingAfterLock, currentConfigVersion)) {
        this.updateAccessOrder(key)
        this.hitCount++
        this.totalAccessTime += performance.now() - startTime
        return existingAfterLock.instance as T
      }

      // Create new instance
      const instance = factory()
      this.setInstance(key, instance, currentConfigVersion)
      this.missCount++
      this.totalAccessTime += performance.now() - startTime

      return instance
    } finally {
      this.isCreatingInstance = false
    }
  }

  /**
   * Wait for instance creation with exponential backoff (Type-Safe)
   */
  private waitForInstanceCreation<T>(
    key: string,
    factory: () => T,
    currentConfigVersion: number,
    attempt = 0
  ): T {
    const maxAttempts = 10
    const baseDelay = 1
    
    if (attempt >= maxAttempts) {
      throw new Error('Failed to create API instance for ${key} after ' + maxAttempts + ' attempts')
    }

    // Exponential backoff: 1ms, 2ms, 4ms, 8ms, etc.
    const delay = baseDelay * Math.pow(2, attempt)
    
    // Use synchronous wait for immediate return
    const start = Date.now()
    while (Date.now() - start < delay) {
      // Busy wait - this is acceptable for very short delays
    }

    // Check if instance was created by another thread
    const existing = this.instances.get(key)
    if (existing && this.isInstanceValid(existing, currentConfigVersion)) {
      this.updateAccessOrder(key)
      this.hitCount++
      return existing.instance as T
    }

    // If still creating, retry with exponential backoff
    if (this.isCreatingInstance) {
      return this.waitForInstanceCreation(key, factory, currentConfigVersion, attempt + 1)
    }

    // Create instance if no longer being created
    return this.getOrCreate(key, factory, currentConfigVersion)
  }

  /**
   * Check if instance is valid (not stale)
   */
  private isInstanceValid(entry: CacheEntry<any>, currentConfigVersion: number): boolean {
    return entry.version === currentConfigVersion
  }

  /**
   * Set instance with LRU tracking
   */
  private setInstance<T>(key: string, instance: T, version: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      instance,
      version,
      lastAccessed: now,
      accessCount: 1,
      creationTime: now
    }

    this.instances.set(key, entry)
    this.updateAccessOrder(key)

    // LRU eviction if needed
    this.evictIfNeeded()
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    // Add to end (most recently used)
    this.accessOrder.push(key)

    // Update access count
    const entry = this.instances.get(key)
    if (entry) {
      entry.lastAccessed = Date.now()
      entry.accessCount++
    }
  }

  /**
   * LRU eviction - remove least recently used items
   */
  private evictIfNeeded(): void {
    while (this.instances.size >= this.maxCacheSize) {
      if (this.accessOrder.length === 0) break

      // Remove least recently used (first in access order)
      const lruKey = this.accessOrder.shift()!
      this.instances.delete(lruKey)
    }
  }

  /**
   * Update configuration version (invalidates all instances)
   */
  updateConfigVersion(newVersion: number): void {
    this.configVersion = newVersion
    this.instances.clear()
    this.accessOrder = []
  }

  /**
   * Get enhanced cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now()
    const uptime = now - this.startTime
    const hitRate = this.totalRequests > 0 ? (this.hitCount / this.totalRequests) * 100 : 0
    const missRate = this.totalRequests > 0 ? (this.missCount / this.totalRequests) * 100 : 0
    const averageAccessTime = this.totalRequests > 0 ? this.totalAccessTime / this.totalRequests : 0

    // Calculate memory usage (approximate)
    const memoryUsage = this.instances.size * 1024 // Rough estimate: 1KB per instance

    // Find stale instances
    const staleInstances: string[] = []
    const instanceVersions: Record<string, number> = {}
    
    for (const [key, entry] of this.instances.entries()) {
      instanceVersions[key] = entry.version
      if (entry.version !== this.configVersion) {
        staleInstances.push(key)
      }
    }

    return {
      size: this.instances.size,
      maxSize: this.maxCacheSize,
      configVersion: this.configVersion,
      instanceVersions,
      staleInstances,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      totalRequests: this.totalRequests,
      averageAccessTime: Math.round(averageAccessTime * 100) / 100,
      memoryUsage
    }
  }

  /**
   * Clear all cached instances
   */
  clear(): void {
    this.instances.clear()
    this.accessOrder = []
    this.resetStats()
  }

  /**
   * Clear only stale instances
   */
  clearStale(): void {
    const staleKeys: string[] = []
    
    for (const [key, entry] of this.instances.entries()) {
      if (entry.version !== this.configVersion) {
        staleKeys.push(key)
      }
    }

    for (const key of staleKeys) {
      this.instances.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }
  }

  /**
   * Reset performance statistics
   */
  private resetStats(): void {
    this.hitCount = 0
    this.missCount = 0
    this.totalRequests = 0
    this.totalAccessTime = 0
    this.startTime = Date.now()
  }

  /**
   * Warm up cache with frequently used APIs
   */
  async warmup(apiTypes: string[], factory: (type: string) => any): Promise<void> {
    if (this.isWarmingUp) return
    
    this.isWarmingUp = true
    this.warmupQueue = [...apiTypes]

    try {
      for (const apiType of apiTypes) {
        if (!this.instances.has(apiType)) {
          const instance = factory(apiType)
          this.setInstance(apiType, instance, this.configVersion)
        }
      }
    } finally {
      this.isWarmingUp = false
      this.warmupQueue = []
    }
  }

  /**
   * Get cache health metrics
   */
  getHealthMetrics(): {
    isHealthy: boolean
    efficiency: number
    recommendations: string[]
  } {
    const stats = this.getStats()
    const efficiency = stats.hitRate
    const recommendations: string[] = []

    if (efficiency < 50) {
      recommendations.push('Consider increasing cache size or implementing cache warming')
    }

    if (stats.memoryUsage > 1024 * 1024) { // 1MB
      recommendations.push('High memory usage detected, consider reducing cache size')
    }

    if (stats.averageAccessTime > 10) { // 10ms
      recommendations.push('Slow cache access detected, consider optimizing factory functions')
    }

    return {
      isHealthy: efficiency > 70 && stats.memoryUsage < 1024 * 1024,
      efficiency,
      recommendations
    }
  }
}
