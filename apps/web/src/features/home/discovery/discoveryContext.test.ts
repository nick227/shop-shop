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
})
