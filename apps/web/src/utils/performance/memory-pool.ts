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
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void
  private maxSize: number

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 100
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
  private pool: HTMLElement[] = []
  private tagName: string
  private maxSize: number

  constructor(tagName: string = 'div', maxSize: number = 50) {
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
 * Specialized pool for Leaflet markers
 */
export class MarkerPool {
  private pool: L.Marker[] = []
  private maxSize: number

  constructor(maxSize: number = 50) {
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
  private pool: L.DivIcon[] = []
  private maxSize: number

  constructor(maxSize: number = 50) {
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
  private pools: Map<string, ObjectPool<any>> = new Map()

  register<T>(name: string, pool: ObjectPool<T>): void {
    this.pools.set(name, pool)
  }

  get<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name)
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
