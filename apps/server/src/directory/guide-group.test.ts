import { describe, expect, it } from 'vitest'
import { guideGroup } from './guide-group.js'

describe('neighborhood guide groups', () => {
  it('sorts places by what they are, not by a guessed neighborhood', () => {
    expect(guideGroup('RESTAURANT', 'Restaurant')).toBe('food')
    expect(guideGroup('RESTAURANT', 'Bar')).toBe('food')
    expect(guideGroup('RETAIL', 'Shop')).toBe('shopping')
    expect(guideGroup('ENTERTAINMENT', 'Entertainment')).toBe('arts')
    expect(guideGroup('ATTRACTION', 'Park')).toBe('parks')
    expect(guideGroup('ATTRACTION', 'Library')).toBe('parks')
    expect(guideGroup('OTHER', 'Place')).toBeNull()
  })
})
