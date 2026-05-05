// @ts-nocheck
import type { StoreWithDistance } from '@api/types'
import type { LocationCoordinates } from '@shared/types'

interface ProcessOptions {
  findNearest?: boolean
  filterValid?: boolean
  sortByDistance?: boolean
}

interface ProcessResult {
  validStores: StoreWithDistance[]
  storeLocations: LocationCoordinates[]
  nearestStore: StoreWithDistance | undefined
  minDistance: number
  maxDistance: number
}

// ========================================
// Helper Functions
// ========================================

function isValidStore(store: StoreWithDistance): boolean {
  if (store.latitude == undefined || store.longitude == undefined) return false
  if (!Number.isFinite(Number(store.latitude)) || !Number.isFinite(Number(store.longitude))) return false
  return true
}

function normalizeStore(store: StoreWithDistance): StoreWithDistance {
  const latitude = Number(store.latitude)
  const longitude = Number(store.longitude)
  return { ...store, latitude, longitude }
}

function updateNearestStore(
  currentNearest: StoreWithDistance | undefined,
  candidateStore: StoreWithDistance,
  currentMinDistance: number
): { store: StoreWithDistance | undefined; minDistance: number } {
  const distance = typeof candidateStore.distance === 'number' ? candidateStore.distance : 0
  
  if (distance < currentMinDistance) {
    return { store: candidateStore, minDistance: distance }
  }
  
  return { store: currentNearest, minDistance: currentMinDistance }
}

function updateMaxDistance(currentMax: number, store: StoreWithDistance): number {
  const distance = typeof store.distance === 'number' ? store.distance : 0
  return distance > currentMax ? distance : currentMax
}

function processStore(
  store: StoreWithDistance,
  options: ProcessOptions,
  nearestStore: StoreWithDistance | undefined,
  minDistance: number,
  maxDistance: number
): {
  normalizedStore: StoreWithDistance
  nearestStore: StoreWithDistance | undefined
  minDistance: number
  maxDistance: number
} {
  // Filter invalid stores if requested
  if (options.filterValid && !isValidStore(store)) {
    return {
      normalizedStore: store,
      nearestStore,
      minDistance,
      maxDistance
    }
  }

  const normalizedStore = normalizeStore(store)
  
  // Update nearest store if requested
  if (options.findNearest) {
    const nearestResult = updateNearestStore(nearestStore, normalizedStore, minDistance)
    nearestStore = nearestResult.store
    minDistance = nearestResult.minDistance
  }

  // Update max distance
  maxDistance = updateMaxDistance(maxDistance, store)

  return {
    normalizedStore,
    nearestStore,
    minDistance,
    maxDistance
  }
}

function sortStoresAndUpdateLocations(validStores: StoreWithDistance[]): LocationCoordinates[] {
  // Sort stores by distance
  validStores.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
  
  // Update store locations to match sorted order
  return validStores.map(store => ({
    latitude: store.latitude,
    longitude: store.longitude
  }))
}

// ========================================
// Main Function
// ========================================

export function processStoresOptimized(
  stores: StoreWithDistance[],
  options: ProcessOptions = {}
): ProcessResult {
  const validStores: StoreWithDistance[] = []
  const storeLocations: LocationCoordinates[] = []
  let nearestStore: StoreWithDistance | undefined
  let minDistance = Number.POSITIVE_INFINITY
  let maxDistance = 0

  // Process each store
  for (const store of stores) {
    const {
      normalizedStore,
      nearestStore: updatedNearest,
      minDistance: updatedMinDistance,
      maxDistance: updatedMaxDistance
    } = processStore(store, options, nearestStore, minDistance, maxDistance)

    validStores.push(normalizedStore)
    nearestStore = updatedNearest
    minDistance = updatedMinDistance
    maxDistance = updatedMaxDistance
  }

  // Sort and update locations if requested
  if (options.sortByDistance) {
    const sortedLocations = sortStoresAndUpdateLocations(validStores)
    storeLocations.push(...sortedLocations)
  } else {
    // Add locations in original order
    for (const store of validStores) {
      storeLocations.push({
        latitude: store.latitude,
        longitude: store.longitude
      })
    }
  }

  // Ensure minDistance is finite
  if (!Number.isFinite(minDistance)) {
    minDistance = 0
  }

  return {
    validStores,
    storeLocations,
    nearestStore,
    minDistance,
    maxDistance
  }
}
