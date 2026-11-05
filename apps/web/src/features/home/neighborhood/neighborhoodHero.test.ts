import { describe, expect, it } from 'vitest'
import { homepageTitle, neighborhoodPath, type NeighborhoodCard } from './neighborhoodHero'

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
})