import { describe, expect, it } from 'vitest'
import {
  STOREFRONT_LIMITS,
  STOREFRONT_PALETTES,
  contrastRatio,
  defaultStorefrontConfig,
  normalizeStorefrontConfig,
  readableTextOn,
  resolveBundleIds,
  resolveFeaturedItemIds,
} from './storefront'

describe('normalizeStorefrontConfig', () => {
  it('turns anything into the defaults', () => {
    expect(normalizeStorefrontConfig(undefined)).toEqual(defaultStorefrontConfig())
    expect(normalizeStorefrontConfig('nonsense')).toEqual(defaultStorefrontConfig())
    expect(normalizeStorefrontConfig({ brand: 42, sections: [] })).toEqual(defaultStorefrontConfig())
  })

  it('takes colors from a curated palette, and custom colors only when both are valid', () => {
    expect(normalizeStorefrontConfig({ brand: { paletteId: 'harbor', primary: '#000000' } }).brand).toMatchObject({
      paletteId: 'harbor',
      primary: '#0b4f6c',
    })
    expect(normalizeStorefrontConfig({ brand: { paletteId: 'custom', primary: '#AA0000', accent: '#00aa00' } }).brand).toMatchObject({
      paletteId: 'custom',
      primary: '#aa0000',
      accent: '#00aa00',
    })
    expect(normalizeStorefrontConfig({ brand: { paletteId: 'custom', primary: 'red', accent: '#00aa00' } }).brand.paletteId).toBe('market')
  })

  it('keeps section order, drops unknown and repeated keys, and appends sections it did not mention', () => {
    const config = normalizeStorefrontConfig({
      sections: {
        beforeMenu: [{ key: 'featured', visible: false }, { key: 'featured' }, { key: 'about' }, { key: 'bundles' }],
        afterMenu: [{ key: 'gallery' }],
      },
    })
    expect(config.sections.beforeMenu.map((s) => `${s.key}:${s.visible}`)).toEqual([
      'featured:false',
      'bundles:true',
      'mosaic:true',
      'announcements:true',
      'categories:true',
    ])
    // Business content cannot move above the menu.
    expect(config.sections.afterMenu.map((s) => s.key)).toEqual(['gallery', 'about', 'updates'])
  })

  it('drops references the store does not have, and repeats', () => {
    const refs = { itemIds: new Set(['i1', 'i2']), bundleIds: new Set(['b1']), mediaIds: new Set(['m1']) }
    const config = normalizeStorefrontConfig(
      {
        mosaic: {
          featuredItemId: 'gone',
          tiles: [
            { type: 'media', mediaId: 'm1' },
            { type: 'media', mediaId: 'm1' },
            { type: 'media', mediaId: 'm9' },
            { type: 'item', itemId: 'i2' },
            { type: 'html', html: '<script>' },
          ],
        },
        featured: { itemIds: ['i2', 'x', 'i2', 'i1'], bundleIds: ['b1', 'b2'] },
      },
      refs,
    )
    expect(config.mosaic.featuredItemId).toBeNull()
    expect(config.mosaic.tiles).toEqual([
      { type: 'media', mediaId: 'm1' },
      { type: 'item', itemId: 'i2' },
    ])
    expect(config.featured.itemIds).toEqual(['i2', 'i1'])
    expect(config.featured.bundleIds).toEqual(['b1'])
  })

  it('cleans announcement panels and refuses unsafe media links', () => {
    const config = normalizeStorefrontConfig({
      announcements: [
        { id: 'a', kind: 'image', title: '  Fall   menu ', body: 'Pumpkin\r\n\n\n\nbread', mediaUrl: 'javascript:alert(1)' },
        { id: 'b', kind: 'video', title: 'Watch', mediaUrl: 'https://cdn.example/v.mp4' },
        { id: 'c', kind: 'text' },
        { id: 'a', kind: 'text', title: 'duplicate id' },
      ],
    })
    expect(config.announcements).toEqual([
      { id: 'a', kind: 'text', title: 'Fall menu', body: 'Pumpkin\n\nbread', mediaUrl: null, itemId: null },
      { id: 'b', kind: 'video', title: 'Watch', body: '', mediaUrl: 'https://cdn.example/v.mp4', itemId: null },
    ])
  })

  it('trims long text and lists to their limits', () => {
    const config = normalizeStorefrontConfig({
      brand: { tagline: 'x'.repeat(500) },
      featured: { itemIds: Array.from({ length: 50 }, (_, i) => `i${i}`) },
    })
    expect(config.brand.tagline).toHaveLength(STOREFRONT_LIMITS.tagline)
    expect(config.featured.itemIds).toHaveLength(STOREFRONT_LIMITS.featuredItems)
  })
})

describe('resolveFeaturedItemIds', () => {
  const featured = { ...defaultStorefrontConfig().featured }
  const available = (id: string) => id !== 'soldout'

  it('puts pinned items first, then popular ones, skipping excluded and unavailable items', () => {
    expect(
      resolveFeaturedItemIds(
        { ...featured, itemIds: ['p1'], excludedItemIds: ['hot2'] },
        ['hot1', 'hot2', 'soldout', 'p1', 'hot3'],
        available,
        3,
      ),
    ).toEqual(['p1', 'hot1', 'hot3'])
  })

  it('shows only pinned items when auto-fill is off', () => {
    expect(resolveFeaturedItemIds({ ...featured, itemIds: ['p1'], autoFill: false }, ['hot1'], available)).toEqual(['p1'])
  })
})

describe('resolveBundleIds', () => {
  it('orders pinned bundles first and leaves out excluded and inactive ones', () => {
    const featured = { ...defaultStorefrontConfig().featured, bundleIds: ['b3', 'gone'], excludedBundleIds: ['b2'] }
    expect(resolveBundleIds(featured, ['b1', 'b2', 'b3'])).toEqual(['b3', 'b1'])
  })
})

describe('color helpers', () => {
  it('picks readable text for every curated primary', () => {
    expect(readableTextOn('#145c38')).toBe('#ffffff')
    expect(readableTextOn('#f5d000')).toBe('#111111')
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21)
  })

  it('keeps every curated primary at AA contrast with its text, and every accent visible on white', () => {
    for (const palette of STOREFRONT_PALETTES) {
      expect(contrastRatio(palette.primary, readableTextOn(palette.primary)), palette.id).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(palette.accent, '#ffffff'), palette.id).toBeGreaterThanOrEqual(3)
    }
  })
})
