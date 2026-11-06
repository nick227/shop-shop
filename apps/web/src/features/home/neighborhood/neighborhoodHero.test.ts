import { describe, expect, it } from 'vitest'
import { homepageTitle, neighborhoodPath, type NeighborhoodCard } from './neighborhoodHero'
import { placeCardFromNeighborhood, placeCardFromStore } from './PlaceCard'
import { defaultAddressZip } from './signedInSelect'

const zilker: NeighborhoodCard = {
  id: 'zilker',
  name: 'Zilker',
  slug: 'austin-tx-zilker',
  headline: 'Park and food trailers',
  about: null,
  coverUrl: null,
}

describe('homepage neighborhood intro', () => {
  it('keeps the city title when one neighborhood shares the zip', () => {
    expect(homepageTitle('Austin', 'TX', [zilker])).toBe('Shops near Austin, TX')
  })

  it('keeps the city title when several neighborhoods share the zip', () => {
    const hyde: NeighborhoodCard = { ...zilker, id: 'hyde', name: 'Hyde Park', slug: 'austin-tx-hyde-park' }
    expect(homepageTitle('Austin', 'TX', [zilker, hyde])).toBe('Shops near Austin, TX')
  })

  it('links a neighborhood to its own profile', () => {
    expect(neighborhoodPath(zilker.slug)).toBe('/neighborhoods/austin-tx-zilker')
  })

  it('builds reusable PlaceCardData for neighborhoods and stores', () => {
    expect(placeCardFromNeighborhood({ ...zilker, postalCodes: ['78704'] })).toEqual({
      id: 'zilker',
      href: '/neighborhoods/austin-tx-zilker',
      name: 'Zilker',
      categoryLabel: 'Neighborhood',
      meta: 'Park and food trailers · 78704',
      imageUrl: null,
      credit: null,
    })

    expect(placeCardFromStore({ id: 's1', name: 'Bouldin Market', typeLabel: 'Grocery', distance: 0.7 })).toEqual({
      id: 's1',
      href: '/kitchen/bouldin-market-s1',
      name: 'Bouldin Market',
      category: 'RETAIL',
      categoryLabel: 'Grocery',
      meta: '0.7 mi',
      imageUrl: null,
    })
  })

  it('recovers default ZIP from saved addresses or order snapshots', () => {
    expect(defaultAddressZip([{ postalCode: '78704-1234', isDefault: true }])).toBe('78704')
    expect(
      defaultAddressZip(
        [],
        [{ id: 'o1', storeId: 's1', addressSnapshot: JSON.stringify({ postalCode: '78702' }) }],
      ),
    ).toBe('78702')
  })
})
