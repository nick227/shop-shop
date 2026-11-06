import { describe, expect, it } from 'vitest'
import { recordStoreCoordinates } from './store-coordinates.js'

describe('recordStoreCoordinates', () => {
  it('records valid coordinates for the publish check', () => {
    expect(recordStoreCoordinates({ latitude: '30.2672', longitude: '-97.7431' })).toMatchObject({ geocodedAt: expect.any(String), geocodeSource: 'manual' })
  })
  it.each([
    { latitude: '0', longitude: '0' }, { latitude: '', longitude: '' },
    { latitude: null, longitude: null }, { latitude: '91', longitude: '20' },
    { latitude: '30' }, { latitude: 'NaN', longitude: '20' },
  ])('does not mark invalid or incomplete coordinates as located (%j)', (data) => {
    expect(recordStoreCoordinates(data)).not.toHaveProperty('geocodedAt')
  })
  it('allows locations on the equator or prime meridian', () => {
    expect(recordStoreCoordinates({ latitude: '0', longitude: '20' })).toHaveProperty('geocodedAt')
  })
})
