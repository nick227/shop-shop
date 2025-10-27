/**
 * Memory Pool utilities for performance optimization
 * Provides object pooling to reduce garbage collection pressure
 */

import * as L from 'leaflet'

/**
 * Generic object pool for reusing objects to reduce GC pressure
 * @template T - Type of objects to pool
 */
export class ObjectPool<T> {
  private readonly pool: T[] = []
  private readonly createFn: () => T
  private readonly resetFn: (obj: T) => void
  private readonly maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize = 100
  ) {
    this.createFn = createFn
    this.resetFn = resetFn
    this.maxSize = maxSize
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
}

/**
 * Specialized pool for DOM elements
 */
export class DOMElementPool {
  private readonly pool: HTMLElement[] = []
  private readonly tagName: string
  private readonly maxSize: number

  constructor(tagName = 'div', maxSize = 50) {
    this.tagName = tagName
    this.maxSize = maxSize
  }

  acquire(): HTMLElement {
    if (this.pool.length > 0) {
      const element = this.pool.pop()!
      element.style.display = ''
      return element
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
    element.style.cssText = ''
    delete element.dataset['*']
    
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
 * Specialized pool for Leaflet markers
 */
export class MarkerPool {
  private readonly pool: L.Marker[] = []
  private readonly maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  acquire(): L.Marker {
    if (this.pool.length > 0) {
      const marker = this.pool.pop()!
      marker.off() // Remove all event listeners
      return marker
    }
    return L.marker([0, 0])
  }

  release(marker: L.Marker): void {
    if (this.pool.length >= this.maxSize) {
      return
    }

    // Reset marker
    marker.off()
    marker.remove()
    marker.setLatLng([0, 0])
    
    this.pool.push(marker)
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Specialized pool for Leaflet icons
 */
export class IconPool {
  private readonly pool: L.DivIcon[] = []
  private readonly maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  acquire(): L.DivIcon {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return L.divIcon({
      className: 'custom-marker',
      html: '',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }

  release(icon: L.DivIcon): void {
    if (this.pool.length >= this.maxSize) {
      return
    }

    // Reset icon
    icon.options.html = ''
    icon.options.className = 'custom-marker'
    
    this.pool.push(icon)
  }

  clear(): void {
    this.pool.length = 0
  }

  get size(): number {
    return this.pool.length
  }
}

/**
 * Global pool manager for coordinating multiple pools
 */
export class PoolManager {
  private readonly pools = new Map<string, ObjectPool<unknown>>()

  register<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool as ObjectPool<unknown>)
  }

  get<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined
  }

  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear()
    }
  }

  getStats(): Record<string, { size: number; capacity: number }> {
    const stats: Record<string, { size: number; capacity: number }> = {}
    for (const [name, pool] of this.pools.entries()) {
      stats[name] = {
        size: pool.size,
        capacity: pool.capacity
      }
    }
    return stats
  }
}

// Global pool manager instance
export const globalPoolManager = new PoolManager()
