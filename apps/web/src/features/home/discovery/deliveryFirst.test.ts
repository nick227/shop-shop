import { describe, expect, it } from 'vitest'
import type { StoreWithDistance } from '@api/types'
import { discoveryResults } from './discoveryResults'
import type { DiscoveryItem } from './tiles'

const shop = (id: string, distance: number, delivery: 'available' | 'temporarily_unavailable' | 'not_offered') =>
  ({
    id,
    name: `Shop ${id}`,
    description: 'Neighborhood shop',
    latitude: 30.26,
    longitude: -97.74,
    distance,
    storeType: 'RESTAURANT',
    fulfillment: { delivery, pickup: 'available' },
  }) as unknown as StoreWithDistance

const stores = [shop('pickup', 0.5, 'not_offered'), shop('paused', 1, 'temporarily_unavailable'), shop('delivers', 3, 'available')]
const products = [
  { id: 'p-pickup', title: 'Taco', price: 3, storeId: 'pickup' },
  { id: 'p-delivers', title: 'Soup', price: 6, storeId: 'delivers' },
] as unknown as DiscoveryItem[]
const listing = { id: 'park', name: 'Zilker Park', categoryLabel: 'Park', group: 'out', latitude: 30.26, longitude: -97.77 }

const run = (deliveryFirst: boolean) =>
  discoveryResults({ stores, products, stories: [], directory: [listing] as never, curated: [], browse: '', query: '', deliveryFirst })

describe('Delivery first', () => {
  it('keeps every shop, product, listing, and map pin', () => {
    const off = run(false)
    const on = run(true)
    expect(on.composed.places.map((store) => store.id).sort()).toEqual(off.composed.places.map((store) => store.id).sort())
    expect(on.points.length).toBe(off.points.length)
    expect(on.visibleListings).toHaveLength(1)
    expect(on.composed.tiles.filter((tile) => tile.kind === 'product')).toHaveLength(2)
  })

  it('puts the delivering shop and its products ahead, then keeps distance order', () => {
    const on = run(true)
    // Delivers now, then temporarily unavailable, then not offered.
    expect(on.composed.storeTiles.map((tile) => tile.id)).toEqual(['delivers', 'paused', 'pickup'])
    const productIds = on.composed.tiles.filter((tile) => tile.kind === 'product').map((tile) => tile.id)
    expect(productIds[0]).toBe('p-delivers')
  })

  it('leaves the normal order alone when it is off', () => {
    expect(run(false).composed.storeTiles.map((tile) => tile.id)).toEqual(['pickup', 'paused', 'delivers'])
  })
})
