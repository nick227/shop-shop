import { describe, expect, it } from 'vitest'
import { UNCATEGORIZED, canonicalCategory, inCategory, storeCategories } from './menuCategories'

const item = (category: unknown, sortIndex = 0) => ({ optionsJson: category === undefined ? {} : { category }, sortIndex })

describe('storeCategories', () => {
  it('is empty for a new store: no platform defaults', () => {
    expect(storeCategories([])).toEqual([])
  })

  it('uses only the labels the store gave its items, in menu order, merging case and spacing', () => {
    const items = [item('Drinks', 3), item(' tacos ', 1), item('Tacos', 2), item(undefined, 0), item('', 4)]
    expect(storeCategories(items)).toEqual([
      { name: 'tacos', count: 2 },
      { name: 'Drinks', count: 1 },
    ])
  })
})

describe('inCategory', () => {
  it('matches case-insensitively and puts unlabeled items in Uncategorized', () => {
    expect(inCategory(item('TACOS'), 'Tacos')).toBe(true)
    expect(inCategory(item(undefined), UNCATEGORIZED)).toBe(true)
    expect(inCategory(item('Tacos'), UNCATEGORIZED)).toBe(false)
  })
})

describe('canonicalCategory', () => {
  it('joins an existing category instead of forking it, and keeps new names', () => {
    const existing = [{ name: 'Tacos', count: 3 }]
    expect(canonicalCategory('  tacos', existing)).toBe('Tacos')
    expect(canonicalCategory('Cha Cha Specials', existing)).toBe('Cha Cha Specials')
  })
})
