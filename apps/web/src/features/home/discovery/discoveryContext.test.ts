import { describe, expect, it } from 'vitest'
import { applyDiscoveryPatch, canonicalDiscoverySearch, readDiscoveryContext } from './discoveryContext'

describe('discovery context', () => {
  it('reads an explicit neighborhood ahead of a remembered place', () => {
    const context = readDiscoveryContext('/neighborhoods/austin-tx-zilker', '?category=food&q=coffee')
    expect(context.neighborhood).toBe('austin-tx-zilker')
    expect(context.category).toBe('food')
    expect(context.q).toBe('coffee')
    expect(context.zip).toBeUndefined()
    expect(context.hasExplicitPlace).toBe(true)
  })

  it('keeps category and search when the neighborhood changes and drops a competing zip', () => {
    expect(applyDiscoveryPatch('/explore', 'zip=78704&category=food&q=coffee', { neighborhood: 'austin-tx-south-congress' })).toEqual({
      pathname: '/neighborhoods/austin-tx-south-congress',
      search: 'category=food&q=coffee',
    })
  })

  it('turns a legacy browse param into category on the explore route', () => {
    expect(canonicalDiscoverySearch('?browse=grocery&zip=78704')).toBe('zip=78704&category=grocery')
    expect(applyDiscoveryPatch('/river', 'browse=retail', { q: 'bread' })).toEqual({
      pathname: '/explore',
      search: 'category=retail&q=bread',
    })
  })

  it('keeps delivery-only across place changes until it is switched off', () => {
    const on = applyDiscoveryPatch('/explore', 'zip=78704&radius=25', { deliveryFirst: true })
    expect(readDiscoveryContext(on.pathname, on.search).deliveryFirst).toBe(true)
    const moved = applyDiscoveryPatch(on.pathname, on.search, { neighborhood: 'austin-tx-zilker', category: 'food' })
    expect(moved).toEqual({ pathname: '/neighborhoods/austin-tx-zilker', search: 'radius=25&category=food&delivery=1' })
    const off = applyDiscoveryPatch(moved.pathname, moved.search, { deliveryFirst: null })
    expect(readDiscoveryContext(off.pathname, off.search).deliveryFirst).toBe(false)
    expect(off.search).toBe('radius=25&category=food')
  })
})
