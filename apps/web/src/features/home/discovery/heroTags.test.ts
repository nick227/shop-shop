import { describe, expect, it } from 'vitest'
import { heroTagCandidates, isActiveTag, pickHeroTags, tagFilterKey, type NeighborhoodTag } from './heroTags'

const tag = (overrides: Partial<NeighborhoodTag>): NeighborhoodTag => ({
  id: overrides.label ?? 'tag',
  label: 'Tag',
  kind: 'DISCOVERY',
  categoryId: null,
  searchQuery: null,
  sortIndex: 0,
  visible: true,
  ...overrides,
})

describe('hero tags', () => {
  it('puts pinned tags first in admin order and lets hidden ones switch suggestions off', () => {
    const candidates = heroTagCandidates([
      tag({ label: 'Historic', kind: 'EDITORIAL', sortIndex: 2 }),
      tag({ label: 'Coffee shops', categoryId: 'food', searchQuery: 'coffee', sortIndex: 1 }),
      tag({ label: 'Groceries', categoryId: 'grocery', visible: false, sortIndex: 3 }),
    ])
    expect(candidates.slice(0, 2).map((entry) => entry.label)).toEqual(['Coffee shops', 'Historic'])
    const labels = candidates.map((entry) => entry.label)
    // The pinned rename replaces the "Coffee" suggestion; the hidden grocery tag removes "Groceries".
    expect(labels).not.toContain('Coffee')
    expect(labels).not.toContain('Groceries')
    expect(labels).toContain('Food')
  })

  it('drops filters with no results, ranks suggestions by count, and caps the row', () => {
    const candidates = heroTagCandidates([
      tag({ label: 'Walkable', kind: 'EDITORIAL' }),
      tag({ label: 'Nightlife', kind: 'EDITORIAL', categoryId: 'food', searchQuery: 'bar', sortIndex: 1 }),
    ])
    const counts = new Map([
      [tagFilterKey('food', 'bar'), 0],
      [tagFilterKey('food', ''), 23],
      [tagFilterKey('food', 'coffee'), 12],
      [tagFilterKey('retail', ''), 4],
      [tagFilterKey('grocery', ''), 2],
      [tagFilterKey('arts', ''), 6],
      [tagFilterKey('outdoors', ''), 6],
      [tagFilterKey('convenience', ''), 1],
    ])
    const picked = pickHeroTags(candidates, counts)
    expect(picked.map((entry) => entry.label)).toEqual(['Walkable', 'Food', 'Coffee', 'Arts', 'Outdoors', 'Shops'])
    expect(picked.find((entry) => entry.label === 'Walkable')?.filterable).toBe(false)
    expect(picked.find((entry) => entry.label === 'Coffee')?.count).toBe(12)
  })

  it('matches the active filter case-insensitively', () => {
    const [coffee] = heroTagCandidates([tag({ label: 'Coffee', categoryId: 'food', searchQuery: 'Coffee' })])
    expect(coffee && isActiveTag(coffee, 'food', ' coffee ')).toBe(true)
    expect(coffee && isActiveTag(coffee, 'food', '')).toBe(false)
  })
})
