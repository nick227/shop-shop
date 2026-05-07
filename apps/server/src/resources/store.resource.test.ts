import { describe, expect, it } from 'vitest'
import { filterStoresForCoordinateSearch } from './store.resource'

describe('filterStoresForCoordinateSearch', () => {
  const austin = { latitude: 30.2672, longitude: -97.7431 }

  it('filters by valid coordinates, search radius, and store delivery distance before pagination', () => {
    const stores = [
      { id: 'far', latitude: 30.7, longitude: -97.7431, deliveryDistance: 100 },
      { id: 'missing-coordinates', deliveryDistance: 25 },
      { id: 'outside-delivery-radius', latitude: 30.36, longitude: -97.7431, deliveryDistance: 2 },
      { id: 'nearest', latitude: 30.268, longitude: -97.7431, deliveryDistance: 25 },
      { id: 'nearby', latitude: 30.29, longitude: -97.7431, deliveryDistance: 25 },
    ]

    const filtered = filterStoresForCoordinateSearch(stores, austin.latitude, austin.longitude, 25)

    expect(filtered.map(store => store.id)).toEqual(['nearest', 'nearby'])
  })

  it('keeps total independent from the requested page slice', () => {
    const stores = [
      { id: 'third', latitude: 30.30, longitude: -97.7431 },
      { id: 'first', latitude: 30.268, longitude: -97.7431 },
      { id: 'second', latitude: 30.28, longitude: -97.7431 },
    ]

    const filtered = filterStoresForCoordinateSearch(stores, austin.latitude, austin.longitude, 25)
    const pageTwo = filtered.slice(2, 4)

    expect(filtered).toHaveLength(3)
    expect(pageTwo.map(store => store.id)).toEqual(['third'])
  })

  it('sorts the full filtered set before page 2 is sliced', () => {
    const stores = [
      { id: 'page-2-second', latitude: 30.31, longitude: -97.7431 },
      { id: 'page-1-first', latitude: 30.268, longitude: -97.7431 },
      { id: 'page-2-first', latitude: 30.30, longitude: -97.7431 },
      { id: 'page-1-second', latitude: 30.27, longitude: -97.7431 },
    ]

    const filtered = filterStoresForCoordinateSearch(stores, austin.latitude, austin.longitude, 25)
    const pageTwo = filtered.slice(2, 4)

    expect(pageTwo.map(store => store.id)).toEqual(['page-2-first', 'page-2-second'])
  })

  it('allows null deliveryDistance while still enforcing requested radius', () => {
    const stores = [
      { id: 'allowed-null-delivery-distance', latitude: 30.29, longitude: -97.7431, deliveryDistance: null },
      { id: 'outside-requested-radius', latitude: 30.7, longitude: -97.7431, deliveryDistance: null },
    ]

    const filtered = filterStoresForCoordinateSearch(stores, austin.latitude, austin.longitude, 25)

    expect(filtered.map(store => store.id)).toEqual(['allowed-null-delivery-distance'])
  })

  it('excludes stores without valid coordinates', () => {
    const stores = [
      { id: 'no-latitude', longitude: -97.7431, deliveryDistance: null },
      { id: 'zero-zero', latitude: 0, longitude: 0, deliveryDistance: null },
      { id: 'valid', latitude: 30.268, longitude: -97.7431, deliveryDistance: null },
    ]

    const filtered = filterStoresForCoordinateSearch(stores, austin.latitude, austin.longitude, 25)

    expect(filtered.map(store => store.id)).toEqual(['valid'])
  })
})
