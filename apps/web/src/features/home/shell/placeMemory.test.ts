import { beforeEach, describe, expect, it } from 'vitest'
import { placeTarget, placeZip, rememberedPlace, rememberPlace, rememberZip } from './placeMemory'
import { isShoppingPath } from './shoppingPaths'

describe('placeMemory', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('persists last used ZIP in localStorage so it survives new tabs where sessionStorage is empty', () => {
    rememberPlace('?zip=78704&radius=25&q=tacos')
    sessionStorage.clear()

    expect(rememberedPlace()).toBe('zip=78704&radius=25')
    expect(placeZip('')).toBe('78704')
  })

  it('remembers a 5-digit ZIP directly via rememberZip', () => {
    rememberZip('78702')
    sessionStorage.clear()

    expect(placeZip('')).toBe('78702')
    expect(placeTarget('/explore', '')).toEqual({
      pathname: '/explore',
      search: 'zip=78702&radius=25',
    })
  })

  it('falls back to legacy current_location in localStorage when home place is unset', () => {
    localStorage.setItem('current_location', JSON.stringify({ zip: '78701', city: 'Austin', state: 'TX' }))

    expect(placeZip('')).toBe('78701')
    expect(rememberedPlace()).toBe('zip=78701&radius=25')
  })

  it('keeps shopping shell active across river, explore, neighborhoods, and directory paths', () => {
    expect(isShoppingPath('/river')).toBe(true)
    expect(isShoppingPath('/explore')).toBe(true)
    expect(isShoppingPath('/neighborhoods')).toBe(true)
    expect(isShoppingPath('/neighborhoods/austin-tx-zilker')).toBe(true)
    expect(isShoppingPath('/directory/bouldin-creek-cafe')).toBe(true)
    expect(isShoppingPath('/vendor/stores')).toBe(false)
    expect(isShoppingPath('/admin/Businesses')).toBe(false)
  })
})


describe('forgetZip', () => {
  it('drops the remembered ZIP only when it is the one that failed', async () => {
    const { forgetZip, rememberZip, placeZip } = await import('./placeMemory')
    rememberZip('75758')
    forgetZip('78758')
    expect(placeZip('')).toBe('75758')
    forgetZip('75758')
    expect(placeZip('')).toBe('')
  })
})
