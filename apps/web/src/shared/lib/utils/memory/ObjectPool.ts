/**
 * Object Pool - Memory-Efficient Object Reuse
 * 
 * Addresses critical memory issues:
 * - Excessive object creation in loops
 * - Missing object reuse patterns
 * - High GC pressure from frequent allocations
 * - Memory leaks from object recreation
 */

export class ObjectPool<T> {
  private readonly pool: T[] = []
  private readonly createFn: () => T
  private readonly resetFn: (obj: T) => void
  private readonly maxSize: number
  private readonly name: string

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100,
    name = 'ObjectPool'
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
    this.name = name
  }

  /**
   * Acquire an object from the pool
   * Creates a new one if pool is empty
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  /**
   * Release an object back to the pool
   * Resets the object before adding to pool
   */
  release(obj: T): void {
    if (this.pool.length >= this.maxSize) {
      return // Pool is full, let GC handle it
    }
    
    this.resetFn(obj)
    this.pool.push(obj)
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    this.pool.length = 0
  }

  /**
   * Get current pool size
   */
  get size(): number {
    return this.pool.length
  }

  /**
   * Get pool capacity
   */
  get capacity(): number {
    return this.maxSize
  }

  /**
   * Get pool utilization percentage
   */
  get utilization(): number {
    return (this.pool.length / this.maxSize) * 100
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      name: this.name,
      size: this.size,
      capacity: this.capacity,
      utilization: this.utilization,
      available: this.maxSize - this.pool.length
    }
  }
}

/**
 * Specialized pool for DOM elements
 */
export class DOMElementPool {
  private readonly pool: HTMLElement[] = []
  private readonly maxSize: number
  private readonly tagName: string

  constructor(tagName = 'div', maxSize = 50) {
    this.tagName = tagName
    this.maxSize = maxSize
  }

  acquire(): HTMLElement {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return document.createElement(this.tagName)
  }

  release(element: HTMLElement): void {
    if (this.pool.length >= this.maxSize) {
      return
    }
    
    // Reset element
    element.innerHTML = ''
    element.className = ''
    element.removeAttribute('style')
    element.removeAttribute('data-*')
    
    this.pool.push(element)
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Specialized pool for coordinate objects
 */
export class CoordinatePool {
  private readonly pool: Array<{ latitude: number; longitude: number }> = []
  private readonly maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  acquire(): { latitude: number; longitude: number } {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return { latitude: 0, longitude: 0 }
  }

  release(coord: { latitude: number; longitude: number }): void {
    if (this.pool.length >= this.maxSize) {
      return
    }
    
    coord.latitude = 0
    coord.longitude = 0
    this.pool.push(coord)
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Specialized pool for form data objects
 */
export class FormDataPool {
  private readonly pool: Array<Record<string, any>> = []
  private readonly maxSize: number

  constructor(maxSize = 200) {
    this.maxSize = maxSize
  }

  acquire(): Record<string, any> {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return {}
  }

  release(data: Record<string, any>): void {
    if (this.pool.length >= this.maxSize) {
      return
    }
    
    // Clear all properties
    Object.keys(data).forEach(key => delete data[key])
    this.pool.push(data)
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Pool manager for centralized pool management
 */
export class PoolManager {
  private pools = new Map<string, ObjectPool<any>>()

  registerPool<T>(
    name: string,
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFn, resetFn, maxSize, name)
    this.pools.set(name, pool)
    return pool
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name)
  }

  clearAll(): void {
    this.pools.forEach(pool => pool.clear())
  }

  getStats() {
    const stats: Record<string, any> = {}
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStats()
    })
    return stats
  }

  getTotalUtilization(): number {
    let totalSize = 0
    let totalCapacity = 0
    
    this.pools.forEach(pool => {
      totalSize += pool.size
      totalCapacity += pool.capacity
    })
    
    return totalCapacity > 0 ? (totalSize / totalCapacity) * 100 : 0
  }
}

// Global pool manager instance
export const poolManager = new PoolManager()

// Pre-configured pools for common use cases
export const coordinatePool = poolManager.registerPool(
  'coordinate',
  () => ({ latitude: 0, longitude: 0 }),
  (coord) => { coord.latitude = 0; coord.longitude = 0 },
  100
)

export const formDataPool = poolManager.registerPool(
  'formData',
  () => ({}),
  (data) => Object.keys(data).forEach(key => delete data[key]),
  200
)

export const domElementPool = new DOMElementPool('div', 50)

// Export individual pools for direct access
export { ObjectPool, DOMElementPool, CoordinatePool, FormDataPool, PoolManager }
