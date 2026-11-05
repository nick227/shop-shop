import { describe, expect, it } from 'vitest'
import { discoveryLocated, radiusLabel, shopsNearLabel } from './discoveryLocated'

describe('discovery location', () => {
  it('does not load shops until a ZIP resolves', () => {
    expect(discoveryLocated(false)).toBe(false)
    expect(discoveryLocated(true)).toBe(true)
  })

  it('names the city and the 25-mile ZIP radius', () => {
    expect(shopsNearLabel('Austin', 'TX')).toBe('Shops near Austin, TX')
    expect(radiusLabel(25, '78705')).toBe('Within 25 miles of 78705')
  })
})
