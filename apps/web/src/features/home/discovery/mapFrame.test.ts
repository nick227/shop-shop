import { describe, expect, it } from 'vitest'
import { DEFAULT_CENTER, mapFrame, validCoordinate } from './mapFrame'

const pin = (id: string, latitude: number, longitude: number) => ({ id, latitude, longitude })

describe('map framing', () => {
  it('rejects missing, out-of-range, and 0,0 coordinates', () => {
    expect(validCoordinate({ latitude: 30.25, longitude: -97.75 })).toBe(true)
    expect(validCoordinate({ latitude: 0, longitude: 0 })).toBe(false)
    expect(validCoordinate({ latitude: Number.NaN, longitude: -97 })).toBe(false)
    expect(validCoordinate({ latitude: 95, longitude: -97 })).toBe(false)
    expect(validCoordinate({ latitude: undefined, longitude: -97 })).toBe(false)
    expect(validCoordinate(undefined)).toBe(false)
  })

  it('frames only pins near the place, so a stray result never zooms out to the country', () => {
    const frame = mapFrame({
      points: [pin('near', 30.25, -97.75), pin('also-near', 30.27, -97.74), pin('nyc', 40.71, -74.0), pin('broken', 0, 0)],
      center: { latitude: 30.26, longitude: -97.75 },
      radiusMiles: 10,
    })
    expect(frame.pins.map((point) => point.id)).toEqual(['near', 'also-near'])
    expect(frame.view.kind).toBe('fit')
  })

  it('falls back to the default market only when the page has no place', () => {
    const none = mapFrame({ points: [pin('nyc', 40.71, -74.0)], center: { latitude: Number.NaN, longitude: undefined } })
    expect(none.hasPlace).toBe(false)
    expect(none.pins).toEqual([])
    expect(none.view).toEqual({ kind: 'center', at: DEFAULT_CENTER, zoom: 11 })

    const empty = mapFrame({ points: [], center: { latitude: 30.3, longitude: -97.7 } })
    expect(empty.view).toEqual({ kind: 'center', at: { latitude: 30.3, longitude: -97.7 }, zoom: 13 })
  })
})
