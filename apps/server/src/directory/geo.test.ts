import { describe, expect, it } from 'vitest'
import { placeForZip, pointInRing, ringCentroid, zipAt } from './geo.js'

const SQUARE = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] as const

describe('austin geography', () => {
  it('centers a ring on its interior', () => {
    const center = ringCentroid(SQUARE)
    expect(center.longitude).toBeCloseTo(0.5)
    expect(center.latitude).toBeCloseTo(0.5)
  })

  it('matches a point to the ZIP polygon that contains it', () => {
    expect(pointInRing(0.5, 0.5, SQUARE)).toBe(true)
    expect(pointInRing(2, 2, SQUARE)).toBe(false)
    const areas = [{ code: '78702', rings: [SQUARE] }]
    expect(zipAt(0.2, 0.2, areas)).toBe('78702')
    expect(zipAt(3, 3, areas)).toBeNull()
  })

  it('uses a neighborhood only when the ZIP has exactly one', () => {
    const links = new Map<string, readonly string[]>([['78705', ['west-campus']], ['78704', ['zilker', 'bouldin']]])
    expect(placeForZip('78705', links, 'austin')).toBe('west-campus')
    expect(placeForZip('78704', links, 'austin')).toBe('austin')
    expect(placeForZip(null, links, 'austin')).toBe('austin')
  })
})
