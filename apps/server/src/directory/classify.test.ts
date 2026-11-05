import { describe, expect, it } from 'vitest'
import { classifyName } from './classify.js'
import type { ListingCandidate } from './types.js'

function place(name: string, sourceId: string, street: string | null = '900 East 11th Street'): ListingCandidate {
  return {
    source: 'osm',
    sourceId,
    name,
    category: 'RESTAURANT',
    categoryLabel: 'Restaurant',
    street,
    city: 'Austin',
    state: 'TX',
    zip: '78702',
    latitude: 30.2701,
    longitude: -97.7312,
    phone: null,
    website: null,
    description: null,
    evidence: ['exact name', 'coordinates', street ? 'street address' : 'no street address'].filter((item) => item !== 'no street address'),
  }
}

describe('directory import confidence', () => {
  it('marks one exact address match ready to publish', () => {
    expect(classifyName('Franklin Barbecue', [place('Franklin Barbecue', 'way/1')], [], []).status).toBe('READY')
  })

  it('sends several locations to review', () => {
    const decision = classifyName("Torchy's Tacos", [place("Torchy's Tacos", 'way/2'), place("Torchy's Tacos", 'way/3', '100 South Lamar')], [], [])
    expect(decision.status).toBe('REVIEW')
    expect(decision.candidates).toHaveLength(2)
  })

  it('does not invent a match', () => {
    expect(classifyName('Missing Cafe', [], [], []).status).toBe('NOT_FOUND')
  })

  it('skips a source already imported', () => {
    const decision = classifyName('Franklin Barbecue', [place('Franklin Barbecue', 'way/1')], [{ sourceId: 'way/1', name: 'Franklin Barbecue', latitude: 30.27, longitude: -97.73 }], [])
    expect(decision.status).toBe('EXISTING')
  })

  it('skips a name that is already a merchant at the same place', () => {
    const decision = classifyName('Franklin Barbecue', [place('Franklin Barbecue', 'way/9')], [], [{ id: 'store-1', name: 'Franklin Barbecue', latitude: 30.2702, longitude: -97.7313 }])
    expect(decision.status).toBe('EXISTING')
    expect(decision.storeId).toBe('store-1')
  })
})
