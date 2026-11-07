import { afterEach, describe, expect, it, vi } from 'vitest'
import { locationError } from './locationError'
afterEach(() => vi.unstubAllGlobals())
describe('location error diagnosis', () => {
  it('identifies stored permission denial', async () => {
    vi.stubGlobal('navigator', { permissions: { query: vi.fn().mockResolvedValue({ state: 'denied' }) } })
    expect(await locationError({ code: 2 })).toMatchObject({ message: 'Location blocked. Allow Location in site settings, then retry.', details: 'Permission: denied · Code: 2' })
  })
  it('identifies page policy restrictions', async () => {
    vi.stubGlobal('document', { permissionsPolicy: { allowsFeature: () => false } })
    expect(await locationError({ code: 1 })).toMatchObject({ message: 'Location blocked by this page. Open in a browser tab.' })
  })
  it('handles browsers without permission queries', async () => {
    vi.stubGlobal('navigator', {})
    expect(await locationError({ code: 3 })).toMatchObject({ message: 'Location timed out. Retry or use address.' })
  })
})
