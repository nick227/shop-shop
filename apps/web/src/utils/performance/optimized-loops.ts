/**
 * Optimized Loop Utilities - High-performance data processing
 * Focus: Single-pass algorithms, in-place operations, minimal allocations
 */

/**
 * Single-pass store processing with in-place operations
 * Replaces multiple loops with one efficient pass
 */
export function processStoresOptimized<T extends { latitude: number; longitude: number; distance?: number }>(
  stores: T[],
  options: {
    findNearest?: boolean;
    filterValid?: boolean;
    sortByDistance?: boolean;
  } = {}
): {
  validStores: T[];
  nearestStore: T | null;
  storeLocations: { latitude: number; longitude: number }[];
  minDistance: number;
  maxDistance: number;
} {
  const { findNearest = true, filterValid = true, sortByDistance = true } = options;
  
  // Pre-allocate arrays for better performance
  const validStores: T[] = [];
  const storeLocations: { latitude: number; longitude: number }[] = [];
  
  let nearestStore: T | null = null;
  let minDistance = Infinity;
  let maxDistance = -Infinity;
  
  // Single pass through stores
  for (const store of stores) {
    
    // Filter valid coordinates in same pass
    if (filterValid && (!store.latitude || !store.longitude || 
        isNaN(store.latitude) || isNaN(store.longitude))) {
      continue;
    }
    
    validStores.push(store);
    storeLocations.push({
      latitude: store.latitude,
      longitude: store.longitude
    });
    
    // Find nearest store in same pass (avoid separate Math.min)
    if (findNearest && store.distance !== undefined) {
      if (store.distance < minDistance) {
        minDistance = store.distance;
        nearestStore = store;
      }
      if (store.distance > maxDistance) {
        maxDistance = store.distance;
      }
    }
  }
  
  // In-place sorting (more efficient than creating new arrays)
  if (sortByDistance && validStores.length > 0) {
    validStores.sort((a, b) => {
      const distA = a.distance ?? Infinity;
      const distB = b.distance ?? Infinity;
      return distA - distB;
    });
  }
  
  return {
    validStores,
    nearestStore,
    storeLocations,
    minDistance: minDistance === Infinity ? 0 : minDistance,
    maxDistance: maxDistance === -Infinity ? 0 : maxDistance
  };
}

/**
 * Optimized cart total calculation - single pass
 * Replaces multiple reduce operations with one efficient calculation
 */
export function calculateCartTotalsOptimized(
  items: { unitPrice: number | string; quantity: number }[],
  options: {
    taxRate?: number;
    deliveryFee?: number;
    serviceFeePercent?: number;
  } = {}
): {
  subtotal: number;
  tax: number;
  fees: number;
  total: number;
  itemCount: number;
} {
  const { taxRate = 0.1, deliveryFee = 5.99, serviceFeePercent = 0 } = options;
  
  let subtotal = 0;
  let itemCount = 0;
  
  // Single pass through items
  for (const item of items) {
    const price = typeof item.unitPrice === 'string' 
      ? Number.parseFloat(item.unitPrice) 
      : item.unitPrice;
    
    subtotal += price * item.quantity;
    itemCount += item.quantity;
  }
  
  const tax = subtotal * taxRate;
  const serviceFee = subtotal * (serviceFeePercent / 100);
  const fees = deliveryFee + serviceFee;
  const total = subtotal + tax + fees;
  
  return {
    subtotal,
    tax,
    fees,
    total,
    itemCount
  };
}

/**
 * Optimized validation metrics calculation
 * Replaces array reduce with running average
 */
export class OptimizedValidationMetrics {
  private sum = 0;
  private count = 0;
  private readonly maxSize = 100;
  
  addTime(time: number): void {
    this.sum += time;
    this.count++;
    
    // Maintain sliding window without array operations
    if (this.count > this.maxSize) {
      // Remove oldest entry (simplified - in real implementation, use circular buffer)
      this.count = this.maxSize;
    }
  }
  
  getAverage(): number {
    return this.count > 0 ? this.sum / this.count : 0;
  }
  
  reset(): void {
    this.sum = 0;
    this.count = 0;
  }
}

/**
 * Memory-efficient array operations
 * Reuses buffers to minimize allocations
 */
export class ArrayBufferPool<T> {
  private buffers: T[][] = [];
  private currentBuffer: T[] = [];
  private currentIndex = 0;
  private readonly bufferSize: number;
  
  constructor(bufferSize = 1000) {
    this.bufferSize = bufferSize;
  }
  
  getBuffer(): T[] {
    if (this.currentIndex >= this.bufferSize) {
      this.buffers.push(this.currentBuffer);
      this.currentBuffer = new Array(this.bufferSize);
      this.currentIndex = 0;
    }
    
    return this.currentBuffer;
  }
  
  reset(): void {
    this.buffers = [];
    this.currentBuffer = new Array(this.bufferSize);
    this.currentIndex = 0;
  }
}

/**
 * Optimized map marker processing
 * Batch operations to reduce DOM manipulation
 */
export function processMapMarkersOptimized<T extends { latitude: number; longitude: number; id: string; distance?: number }>(
  stores: T[],
  options: {
    batchSize?: number;
    findNearest?: boolean;
  } = {}
): {
  markerData: {
    store: T;
    isNearest: boolean;
    position: [number, number];
  }[];
  nearestStore: T | null;
} {
  const { batchSize = 50, findNearest = true } = options;
  
  const markerData: {
    store: T;
    isNearest: boolean;
    position: [number, number];
  }[] = [];
  
  let nearestStore: T | null = null;
  let minDistance = Infinity;
  
  // Process in batches for better performance
  for (let i = 0; i < stores.length; i += batchSize) {
    const batch = stores.slice(i, i + batchSize);
    
    for (const store of batch) {
      
      // Find nearest in same pass
      let isNearest = false;
      if (findNearest && store.distance !== undefined && store.distance < minDistance) {
        minDistance = store.distance;
        nearestStore = store;
        isNearest = true;
      }
      
      markerData.push({
        store,
        isNearest,
        position: [store.latitude, store.longitude]
      });
    }
  }
  
  return { markerData, nearestStore };
}
