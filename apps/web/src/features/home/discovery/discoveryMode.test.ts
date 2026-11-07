import { describe, expect, it } from 'vitest'
import { applyDiscoveryPatch } from './discoveryContext'
import { discoveryBands, discoveryEmphasis, heroIdentity, placeKind } from './discoveryMode'
import { composeDiscovery } from './tiles'

const zilker = {
  id: 'z',
  name: 'Zilker',
  slug: 'austin-tx-zilker',
  headline: 'Park and food trailers',
  about: 'Spring-fed swimming and trailers.',
  coverUrl: null,
}

describe('discovery emphasis', () => {
  it('lets search lead inside a neighborhood without leaving that place', () => {
    const context = {
      neighborhood: 'austin-tx-zilker',
      category: 'food',
      q: 'coffee',
      zip: undefined,
      city: undefined,
      view: 'feed' as const,
      hasExplicitPlace: true,
    }
    expect(placeKind(context, '/neighborhoods/austin-tx-zilker')).toBe('neighborhood')
    expect(discoveryEmphasis(context, 'neighborhood')).toBe('search')
    expect(discoveryBands('search')).toEqual(discoveryBands('neighborhood'))
    expect(discoveryBands('search')[0]).toBe('hero')
    expect(heroIdentity({
      kind: 'neighborhood',
      emphasis: 'search',
      city: 'Austin',
      state: 'TX',
      focus: zilker,
      shopCount: 3,
      areaNames: '',
      category: 'food',
      query: 'coffee',
    }).title).toBe('Zilker')
  })

  it('returns to the city instead of a remembered ZIP', () => {
    expect(applyDiscoveryPatch('/neighborhoods/austin-tx-zilker', 'category=food&q=coffee', {
      neighborhood: null,
      city: 'austin-tx',
      zip: null,
    })).toEqual({
      pathname: '/explore',
      search: 'city=austin-tx&category=food&q=coffee',
    })
  })

  it('keeps a ZIP view distinct from the city', () => {
    const context = {
      zip: '78704',
      category: '',
      q: '',
      view: 'feed' as const,
      hasExplicitPlace: true,
    }
    expect(placeKind(context, '/explore')).toBe('zip')
    expect(heroIdentity({
      kind: 'zip',
      emphasis: 'zip',
      city: 'Austin',
      state: 'TX',
      zip: '78704',
      shopCount: 4,
      areaNames: 'Zilker',
      category: '',
      query: '',
    })).toMatchObject({ kicker: 'ZIP 78704', title: 'Shops near Austin, TX' })
  })
})

describe('unified discovery results', () => {
  const stores = [
    { id: 'taco', name: 'Taco Heaven', description: 'Salsas', storeType: 'RESTAURANT', latitude: 30.25, longitude: -97.75, imageUrl: 'https://cdn.example.test/taco.jpg' },
    { id: 'market', name: 'Bouldin Market', description: 'Produce', storeType: 'GROCERY', latitude: 30.24, longitude: -97.76, imageUrl: 'https://cdn.example.test/market.jpg' },
  ]
  const products = [
    { id: 'coffee', title: 'Iced coffee', price: '4.00', storeId: 'taco', description: 'Cold brew' },
    { id: 'beans', title: 'Black beans', price: '3.00', storeId: 'taco', description: 'Side' },
  ]
  const stories = [
    { id: 'post-1', storeId: 'taco', storeName: 'Taco Heaven', content: 'The coffee trailer is open early.' },
    { id: 'post-2', storeId: 'market', storeName: 'Bouldin Market', content: 'Saturday produce.' },
  ]

  it('applies a query to the matching product, its shop, and its story', () => {
    const result = composeDiscovery({ stores, products, stories, browse: 'food', query: 'coffee' })
    expect(result.places.map((store) => store.id)).toEqual(['taco'])
    expect(result.tiles.filter((tile) => tile.kind === 'product').map((tile) => tile.id)).toEqual(['coffee'])
    expect(result.stories.map((story) => story.storeId)).toEqual(['taco'])
  })

  it('drops merchant results for an outdoors category', () => {
    const result = composeDiscovery({ stores, products, stories, browse: 'outdoors', query: '' })
    expect(result.places).toEqual([])
    expect(result.tiles).toEqual([])
  })

  it('drops stores that only have stock placeholder photos', () => {
    const result = composeDiscovery({
      stores: [
        { id: 'stock', name: 'Morning Grind', description: 'Coffee', storeType: 'COFFEE', imageUrl: 'https://picsum.photos/seed/grind/800/400.jpg' },
        { id: 'real', name: 'Roast House', description: 'Coffee', storeType: 'COFFEE', imageUrl: 'https://cdn.example.test/roast.jpg' },
      ],
      products: [
        { id: 'latte', title: 'Latte', price: '4.00', storeId: 'stock' },
        { id: 'drip', title: 'Drip', price: '3.00', storeId: 'real' },
      ],
      stories: [],
      browse: 'food',
      query: '',
    })
    expect(result.places.map((store) => store.id)).toEqual(['real'])
    expect(result.storeTiles.every((tile) => tile.image)).toBe(true)
    expect(result.tiles.filter((tile) => tile.kind === 'product').map((tile) => tile.id)).toEqual(['drip'])
  })
})
