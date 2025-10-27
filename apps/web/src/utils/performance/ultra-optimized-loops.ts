/**
 * Ultra-optimized loop utilities for maximum performance;
 * Focus: Single-pass processing, early exit patterns, minimal allocations;
 */
import type { StoreWithDistance } from '../../api/types'

/**
 * Performance monitoring utility for tracking execution time;
 */
export class UltraOptimizedPerformanceMonitor {
  private static readonly timers = new Map<string, number>()

  static track<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    const duration = end - start;
    this.timers.set(name, duration)
    
    if (duration > 16) { // Warn if operation takes longer than one frame;
      console.warn(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    }
    
    return result;
  }

  static getTiming(name: string): number | undefined {
    return this.timers.get(name)
  }

  static clearTimings(): void {
    this.timers.clear()
  }

  static getAllTimings(): Record<string, number> {
    return Object.fromEntries(this.timers.entries())
  }
}

/**
 * Ultra-optimized store processor for single-pass operations;
 */
export class UltraOptimizedStoreProcessor {
  private processedStores: StoreWithDistance[] = []
  private nearestStore: StoreWithDistance | undefined = undefined;
  private nearestDistance = Infinity;
  /**
   * Process stores in a single pass with early exit optimizations;
   */
  processStores(stores: StoreWithDistance[]): {
    markerData: { store: StoreWithDistance; isNearest: boolean }[]
    nearestStore: StoreWithDistance | undefined;
    validStoresCount: number;
  } {
    // Reset state;
    this.processedStores = []
    this.nearestStore = undefined;
    this.nearestDistance = Infinity;
    const markerData: { store: StoreWithDistance; isNearest: boolean }[] = []
    let validStoresCount = 0;
    // Single-pass processing with early exit patterns;
    for (const store of stores) {
      
      // Early exit: Skip invalid stores immediately;
      if (!store || typeof store.latitude !== 'number' || typeof store.longitude !== 'number') {
        continue;
      }

      // Early exit: Skip stores with invalid coordinates;
      if (Number.isNaN(store.latitude) || Number.isNaN(store.longitude)) {
        continue;
      }

      // Early exit: Skip stores outside reasonable bounds;
      if (store.latitude < -90 || store.latitude > 90 || 
          store.longitude < -180 || store.longitude > 180) {
        continue;
      }

      validStoresCount++

      // Track nearest store in single pass;
      if (store.distance !== undefined && store.distance < this.nearestDistance) {
        this.nearestDistance = store.distance;
        this.nearestStore = store;
      }

      // Prepare marker data;
      markerData.push({
        store,
        isNearest: false // Will be updated after processing all stores;
      })
    }

    // Mark nearest store;
    if (this.nearestStore) {
      for (const data of markerData) {
        if (data.store.id === this.nearestStore.id) {
          data.isNearest = true;
          break;
        }
      }
    }

    return {
      markerData,
      nearestStore: this.nearestStore,
      validStoresCount
    }
  }

  /**
   * Get processed stores (cached)
   */
  getProcessedStores(): StoreWithDistance[] {
    return this.processedStores;
  }

  /**
   * Get nearest store;
   */
  getNearestStore(): StoreWithDistance | undefined {
    return this.nearestStore;
  }
}

/**
 * Ultra-optimized array operations;
 */
export class UltraOptimizedArrayOps {
  /**
   * Filter and map in single pass;
   */
  static filterMap<T, U>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    mapper: (item: T, index: number) => U
  ): U[] {
    const result: U[] = []
    for (const [i, element] of array.entries()) {
      if (predicate(element, i)) {
        result.push(mapper(element, i))
      }
    }
    return result;
  }

  /**
   * Find with early exit;
   */
  static find<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): T | undefined {
    for (const [i, element] of array.entries()) {
      if (predicate(element, i)) {
        return element
      }
    }
    return undefined;
  }

  /**
   * Find index with early exit;
   */
  static findIndex<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): number {
    for (const [i, element] of array.entries()) {
      if (predicate(element, i)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Reduce with early exit capability;
   */
  static reduce<T, U>(
    array: T[],
    reducer: (acc: U, item: T, index: number) => U,
    initialValue: U
  ): U {
    let acc = initialValue;
    for (const [i, element] of array.entries()) {
      acc = reducer(acc, element, i)
    }
    return acc;
  }

  /**
   * Chunk array into batches (optimized for performance)
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks;
  }

  /**
   * Remove duplicates (optimized for primitives)
   */
  static unique<T>(array: T[]): T[] {
    const seen = new Set<T>()
    const result: T[] = []
    
    for (const item of array) {
      if (!seen.has(item)) {
        seen.add(item)
        result.push(item)
      }
    }
    
    return result;
  }
}

/**
 * Ultra-optimized coordinate operations;
 */
export class UltraOptimizedCoordinateOps {
  /**
   * Calculate distance between two points (Haversine formula)
   * Optimized version with minimal allocations;
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers;
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c;
  }

  /**
   * Convert degrees to radians (optimized)
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Check if coordinates are within bounds;
   */
  static isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Check if point is within radius of center;
   */
  static isWithinRadius(
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon)
    return distance <= radiusKm;
  }
}

/**
 * Ultra-optimized batch operations;
 */
export class UltraOptimizedBatchOps {
  /**
   * Process items in batches with performance monitoring;
   */
  static processBatches<T, U>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => U[]
  ): U[] {
    const results: U[] = []
    const batches = UltraOptimizedArrayOps.chunk(items, batchSize)
    
    for (const batch of batches) {
      const batchResults = UltraOptimizedPerformanceMonitor.track(
        'batch-' + batch.length + '',
        () => processor(batch)
      )
      results.push(...batchResults)
    }
    
    return results;
  }

  /**
   * Debounced batch processing;
   */
  static createDebouncedBatchProcessor<T>(
    processor: (items: T[]) => void,
    delay = 16
  ): (item: T) => void {
    let timeoutId: number | undefined = undefined;
    let batch: T[] = []

    return (item: T) => {
      batch.push(item)
      
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = window.setTimeout(() => {
        processor(batch)
        batch = []
        timeoutId = undefined;
      }, delay)
    }
  }
}
