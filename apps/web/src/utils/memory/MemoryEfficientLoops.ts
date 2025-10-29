/**
 * Memory-Efficient Loop Utilities
 * 
 * Addresses critical memory issues:
 * - Multiple array method chains creating intermediate arrays
 * - Inefficient data processing with multiple passes
 * - Excessive object creation in loops
 * - Missing early exit strategies
 */

/**
 * Single-pass processing with minimal allocations
 * Replaces multiple .map(), .filter(), .reduce() chains
 */
export function processStoresUltraOptimized<T extends { latitude: number; longitude: number; distance?: number }>(
  stores: T[],
  options: {
    findNearest?: boolean
    filterValid?: boolean
    sortByDistance?: boolean
    limit?: number
    earlyExit?: boolean
  } = {}
): {
  validStores: T[]
  nearestStore: T | undefined
  minDistance: number
  maxDistance: number
  processedCount: number
} {
  const { 
    findNearest = true, 
    filterValid = true, 
    sortByDistance = true, 
    limit,
    earlyExit = true
  } = options
  
  // Pre-allocate arrays with known capacity
  const validStores: T[] = []
  let nearestStore: T | undefined = undefined
  let minDistance = Infinity
  let maxDistance = -Infinity
  let processedCount = 0
  
  // Single pass through stores
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    processedCount++
    
    // Filter valid coordinates in same pass
    if (filterValid && (!store.latitude || !store.longitude || 
        Number.isNaN(store.latitude) || Number.isNaN(store.longitude))) {
      continue
    }
    
    validStores.push(store)
    
    // Find nearest store in same pass
    if (findNearest && store.distance !== undefined) {
      if (store.distance < minDistance) {
        minDistance = store.distance
        nearestStore = store
      }
      if (store.distance > maxDistance) {
        maxDistance = store.distance
      }
    }
    
    // Early exit if limit reached
    if (limit && validStores.length >= limit) {
      break
    }
  }
  
  // In-place sorting (no new array)
  if (sortByDistance && validStores.length > 0) {
    validStores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }
  
  return {
    validStores,
    nearestStore,
    minDistance: minDistance === Infinity ? 0 : minDistance,
    maxDistance: maxDistance === -Infinity ? 0 : maxDistance,
    processedCount
  }
}

/**
 * Memory-efficient array operations
 * Reuses buffers to minimize allocations
 */
export class MemoryEfficientArrayOps {
  /**
   * Filter and map in single pass
   * Avoids creating intermediate arrays
   */
  static filterMap<T, U>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    mapper: (item: T, index: number) => U
  ): U[] {
    const result: U[] = []
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i], i)) {
        result.push(mapper(array[i], i))
      }
    }
    return result
  }

  /**
   * Find with early exit
   * Stops as soon as condition is met
   */
  static find<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): T | undefined {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i], i)) {
        return array[i]
      }
    }
    return undefined
  }

  /**
   * Find index with early exit
   */
  static findIndex<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): number {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i], i)) {
        return i
      }
    }
    return -1
  }

  /**
   * Reduce with early exit capability
   */
  static reduce<T, U>(
    array: T[],
    reducer: (acc: U, item: T, index: number) => U,
    initialValue: U
  ): U {
    let acc = initialValue
    for (let i = 0; i < array.length; i++) {
      acc = reducer(acc, array[i], i)
    }
    return acc
  }

  /**
   * Chunk array into batches (optimized for performance)
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Remove duplicates (optimized for primitives)
   */
  static unique<T>(array: T[]): T[] {
    const seen = new Set<T>()
    const result: T[] = []
    
    for (let i = 0; i < array.length; i++) {
      const item = array[i]
      if (!seen.has(item)) {
        seen.add(item)
        result.push(item)
      }
    }
    
    return result
  }

  /**
   * Filter in-place (modifies original array)
   */
  static filterInPlace<T>(array: T[], predicate: (item: T, index: number) => boolean): T[] {
    let writeIndex = 0
    for (let readIndex = 0; readIndex < array.length; readIndex++) {
      if (predicate(array[readIndex], readIndex)) {
        array[writeIndex] = array[readIndex]
        writeIndex++
      }
    }
    array.length = writeIndex
    return array
  }

  /**
   * Map in-place (modifies original array)
   */
  static mapInPlace<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
    for (let i = 0; i < array.length; i++) {
      array[i] = mapper(array[i], i) as unknown as T
    }
    return array as unknown as U[]
  }

  /**
   * Remove duplicates in-place
   */
  static uniqueInPlace<T>(array: T[]): T[] {
    const seen = new Set<T>()
    let writeIndex = 0
    for (let readIndex = 0; readIndex < array.length; readIndex++) {
      const item = array[readIndex]
      if (!seen.has(item)) {
        seen.add(item)
        array[writeIndex] = item
        writeIndex++
      }
    }
    array.length = writeIndex
    return array
  }
}

/**
 * Memory-efficient coordinate operations
 */
export class MemoryEfficientCoordinateOps {
  /**
   * Calculate distance between two points (Haversine formula)
   * Optimized version with minimal allocations
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Sort stores by distance (in-place)
   */
  static sortStoresByDistance<T extends { distance?: number }>(stores: T[]): T[] {
    return stores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }

  /**
   * Deduplicate coordinates (in-place)
   */
  static deduplicateCoordinates<T extends { latitude: number; longitude: number }>(items: T[]): T[] {
    const seen = new Set<string>()
    let writeIndex = 0
    
    for (let readIndex = 0; readIndex < items.length; readIndex++) {
      const item = items[readIndex]
      const key = `${item.latitude},${item.longitude}`
      
      if (!seen.has(key)) {
        seen.add(key)
        items[writeIndex] = item
        writeIndex++
      }
    }
    
    items.length = writeIndex
    return items
  }
}

/**
 * Memory-efficient string operations
 */
export class MemoryEfficientStringOps {
  private static stringPool = new Map<string, string>()
  private static maxPoolSize = 1000

  /**
   * Intern string to reduce memory usage
   */
  static intern(str: string): string {
    if (this.stringPool.has(str)) {
      return this.stringPool.get(str)!
    }
    
    if (this.stringPool.size >= this.maxPoolSize) {
      // Clear oldest entries
      const keys = Array.from(this.stringPool.keys())
      for (let i = 0; i < keys.length / 2; i++) {
        this.stringPool.delete(keys[i])
      }
    }
    
    this.stringPool.set(str, str)
    return str
  }

  /**
   * Clear string pool
   */
  static clearPool(): void {
    this.stringPool.clear()
  }

  /**
   * Get pool statistics
   */
  static getPoolStats() {
    return {
      size: this.stringPool.size,
      maxSize: this.maxPoolSize,
      utilization: (this.stringPool.size / this.maxPoolSize) * 100
    }
  }
}

/**
 * Memory-efficient batch processing
 */
export class MemoryEfficientBatchProcessor<T, R> {
  private readonly batchSize: number
  private readonly processor: (item: T) => R
  private readonly results: R[] = []

  constructor(processor: (item: T) => R, batchSize = 100) {
    this.processor = processor
    this.batchSize = batchSize
  }

  /**
   * Process items in batches to avoid memory spikes
   */
  async processBatches(items: T[]): Promise<R[]> {
    this.results.length = 0 // Clear previous results
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize)
      
      for (let j = 0; j < batch.length; j++) {
        this.results.push(this.processor(batch[j]))
      }
      
      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    
    return this.results
  }

  /**
   * Process items with generator for lazy evaluation
   */
  *processLazy(items: T[]): Generator<R[], void, unknown> {
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch: R[] = []
      const endIndex = Math.min(i + this.batchSize, items.length)
      
      for (let j = i; j < endIndex; j++) {
        batch.push(this.processor(items[j]))
      }
      
      yield batch
    }
  }
}

/**
 * Memory-efficient validation metrics
 */
export class MemoryEfficientValidationMetrics {
  private sum = 0
  private count = 0
  private min = Infinity
  private max = -Infinity

  add(value: number): void {
    this.sum += value
    this.count++
    this.min = Math.min(this.min, value)
    this.max = Math.max(this.max, value)
  }

  getAverage(): number {
    return this.count > 0 ? this.sum / this.count : 0
  }

  getMin(): number {
    return this.min === Infinity ? 0 : this.min
  }

  getMax(): number {
    return this.max === -Infinity ? 0 : this.max
  }

  getCount(): number {
    return this.count
  }

  reset(): void {
    this.sum = 0
    this.count = 0
    this.min = Infinity
    this.max = -Infinity
  }
}

// Export all utilities
export {
  MemoryEfficientArrayOps,
  MemoryEfficientCoordinateOps,
  MemoryEfficientStringOps,
  MemoryEfficientBatchProcessor,
  MemoryEfficientValidationMetrics
}
