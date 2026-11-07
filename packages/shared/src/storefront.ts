/**
 * Storefront configuration: how a store's public page looks. Shared by the server (which validates and
 * stores it) and the web app (which renders it and edits it), so both read a config the same way.
 *
 * The config holds presentation only: brand, featured content, optional sections and announcements.
 * Inventory, availability, menu structure and business details stay live on the store.
 * `mosaic` remains on the config for older drafts; the page no longer renders it.
 *
 * `normalizeStorefrontConfig` accepts anything and returns a valid config: unknown keys are dropped,
 * missing ones take defaults, and lists are trimmed to their limits. With `refs`, references to items,
 * bundles or media the store no longer has are dropped too.
 */

export const STOREFRONT_CONFIG_VERSION = 1

export type StorefrontAppearance = 'light' | 'dark' | 'system'
export type StorefrontFont = 'modern' | 'editorial' | 'bold'
export type StorefrontPresentation = 'auto' | 'grid' | 'list'

/**
 * Every block of the page, including the menu, in the only order the editor and the public page use.
 * A saved config can hide a block. It cannot change this order.
 */
export const STOREFRONT_SECTIONS = [
  'featured',
  'menu',
  'categories',
  'bundles',
  'announcements',
  'about',
  'gallery',
  'updates',
] as const

export type StorefrontSection = (typeof STOREFRONT_SECTIONS)[number]

export interface SectionSetting<K extends string> {
  readonly key: K
  readonly visible: boolean
}

export type MosaicTile =
  | { readonly type: 'media'; readonly mediaId: string }
  | { readonly type: 'item'; readonly itemId: string }

export type AnnouncementKind = 'text' | 'image' | 'video'

export interface StorefrontAnnouncement {
  readonly id: string
  readonly kind: AnnouncementKind
  readonly title: string
  readonly body: string
  /** Image or video for `image` and `video` panels. */
  readonly mediaUrl: string | null
  /** An item the panel promotes; shoppers can open it from the panel. */
  readonly itemId: string | null
}

export interface StorefrontConfig {
  readonly version: typeof STOREFRONT_CONFIG_VERSION
  readonly brand: {
    readonly tagline: string
    /** A curated palette id, or `custom` to use `primary` and `accent` as given. */
    readonly paletteId: string
    readonly primary: string
    readonly accent: string
    readonly appearance: StorefrontAppearance
    readonly font: StorefrontFont
  }
  readonly mosaic: {
    /** The product that leads the mosaic's product carousel; popular items follow it. */
    readonly featuredItemId: string | null
    /** Media and product tiles beside the carousel, in order. */
    readonly tiles: readonly MosaicTile[]
  }
  readonly featured: {
    /** Pinned items, shown first in this order. */
    readonly itemIds: readonly string[]
    /** Items never featured automatically. */
    readonly excludedItemIds: readonly string[]
    /** Fill the remaining featured slots with the store's most popular items. */
    readonly autoFill: boolean
    readonly bundleIds: readonly string[]
    readonly excludedBundleIds: readonly string[]
  }
  /** Page blocks in display order. The menu is one of them and is always shown. */
  readonly sections: readonly SectionSetting<StorefrontSection>[]
  readonly announcements: readonly StorefrontAnnouncement[]
  readonly presentation: StorefrontPresentation
}

export const STOREFRONT_LIMITS = {
  tagline: 140,
  mosaicTiles: 6,
  featuredItems: 12,
  featuredBundles: 8,
  excluded: 200,
  announcements: 4,
  announcementTitle: 80,
  announcementBody: 400,
  url: 2048,
  id: 64,
} as const

/** How many featured items show when the vendor pins none and auto-fill is on. */
export const FEATURED_DEFAULT_COUNT = 8

export interface StorefrontPalette {
  readonly id: string
  readonly name: string
  readonly primary: string
  readonly accent: string
}

/** Curated pairings: each primary carries white or near-black text, and the accent reads on both modes. */
export const STOREFRONT_PALETTES: readonly StorefrontPalette[] = [
  { id: 'market', name: 'Market', primary: '#145c38', accent: '#e36a2c' },
  { id: 'tomato', name: 'Tomato', primary: '#b3261e', accent: '#b7791f' },
  { id: 'harbor', name: 'Harbor', primary: '#0b4f6c', accent: '#1f9e89' },
  { id: 'espresso', name: 'Espresso', primary: '#4b2e1e', accent: '#c9853f' },
  { id: 'berry', name: 'Berry', primary: '#7b2d5b', accent: '#e05d6f' },
  { id: 'midnight', name: 'Midnight', primary: '#1f2937', accent: '#d97706' },
  { id: 'citrus', name: 'Citrus', primary: '#c2410c', accent: '#15803d' },
  { id: 'iris', name: 'Iris', primary: '#4c3d8f', accent: '#b8752a' },
]

export const STOREFRONT_FONTS: readonly { readonly id: StorefrontFont; readonly name: string; readonly heading: string }[] = [
  { id: 'modern', name: 'Modern', heading: 'Figtree, system-ui, sans-serif' },
  { id: 'editorial', name: 'Editorial', heading: 'Georgia, "Iowan Old Style", "Times New Roman", serif' },
  { id: 'bold', name: 'Bold', heading: '"Bricolage Grotesque", Figtree, system-ui, sans-serif' },
]

export const STOREFRONT_SECTION_LABELS: Record<StorefrontSection, string> = {
  about: 'About & hours',
  announcements: 'Announcements',
  bundles: 'Bundles',
  featured: 'Featured products',
  categories: 'Category tiles',
  menu: 'Menu',
  gallery: 'Photos',
  updates: 'Updates',
}

const DEFAULT_PALETTE = STOREFRONT_PALETTES[0]

export function defaultStorefrontConfig(): StorefrontConfig {
  return {
    version: STOREFRONT_CONFIG_VERSION,
    brand: {
      tagline: '',
      paletteId: DEFAULT_PALETTE.id,
      primary: DEFAULT_PALETTE.primary,
      accent: DEFAULT_PALETTE.accent,
      appearance: 'light',
      font: 'modern',
    },
    mosaic: { featuredItemId: null, tiles: [] },
    featured: { itemIds: [], excludedItemIds: [], autoFill: true, bundleIds: [], excludedBundleIds: [] },
    sections: STOREFRONT_SECTIONS.map((key) => ({ key, visible: true })),
    announcements: [],
    presentation: 'auto',
  }
}

/** Ids the store actually has; references to anything else are dropped. */
export interface StorefrontRefs {
  readonly itemIds: ReadonlySet<string>
  readonly bundleIds: ReadonlySet<string>
  readonly mediaIds: ReadonlySet<string>
}

const HEX = /^#[\da-f]{6}$/i

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replaceAll(/\s+/g, ' ').trim().slice(0, max) : ''

/** Multi-line text: keeps line breaks, trims each line's trailing spaces and the whole. */
const paragraph = (value: unknown, max: number): string =>
  typeof value === 'string'
    ? value
        .replaceAll('\r\n', '\n')
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
        .replaceAll(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, max)
    : ''

const id = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 && value.length <= STOREFRONT_LIMITS.id ? value : null

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

function ids(value: unknown, max: number, known?: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const raw of value) {
    const next = id(raw)
    if (next && !out.includes(next) && (!known || known.has(next))) out.push(next)
    if (out.length >= max) break
  }
  return out
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > STOREFRONT_LIMITS.url) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

/** Saved visibility only. Order always comes from `STOREFRONT_SECTIONS`. */
function storefrontSections(raw: unknown): SectionSetting<StorefrontSection>[] {
  const legacy = isRecord(raw) ? raw : null
  const saved = Array.isArray(raw)
    ? raw
    : legacy
      ? [
          ...(Array.isArray(legacy.beforeMenu) ? legacy.beforeMenu : []),
          ...(Array.isArray(legacy.afterMenu) ? legacy.afterMenu : []),
        ]
      : []
  const visible = new Map<string, boolean>()
  for (const item of saved) {
    if (!isRecord(item) || typeof item.key !== 'string' || visible.has(item.key)) continue
    visible.set(item.key, item.visible !== false)
  }
  return STOREFRONT_SECTIONS.map((key) => ({
    key,
    visible: key === 'menu' ? true : visible.get(key) ?? true,
  }))
}

export function normalizeStorefrontConfig(raw: unknown, refs?: StorefrontRefs): StorefrontConfig {
  const base = defaultStorefrontConfig()
  const input = isRecord(raw) ? raw : {}
  const brand = isRecord(input.brand) ? input.brand : {}
  const mosaic = isRecord(input.mosaic) ? input.mosaic : {}
  const featured = isRecord(input.featured) ? input.featured : {}

  const palette = STOREFRONT_PALETTES.find((p) => p.id === brand.paletteId)
  const custom = brand.paletteId === 'custom' && HEX.test(String(brand.primary)) && HEX.test(String(brand.accent))
  const colors = palette
    ? { paletteId: palette.id, primary: palette.primary, accent: palette.accent }
    : custom
      ? { paletteId: 'custom', primary: String(brand.primary).toLowerCase(), accent: String(brand.accent).toLowerCase() }
      : { paletteId: base.brand.paletteId, primary: base.brand.primary, accent: base.brand.accent }

  const tiles: MosaicTile[] = []
  if (Array.isArray(mosaic.tiles)) {
    for (const tile of mosaic.tiles) {
      if (!isRecord(tile) || tiles.length >= STOREFRONT_LIMITS.mosaicTiles) continue
      if (tile.type === 'media') {
        const mediaId = id(tile.mediaId)
        if (mediaId && (!refs || refs.mediaIds.has(mediaId)) && !tiles.some((t) => t.type === 'media' && t.mediaId === mediaId)) {
          tiles.push({ type: 'media', mediaId })
        }
      } else if (tile.type === 'item') {
        const itemId = id(tile.itemId)
        if (itemId && (!refs || refs.itemIds.has(itemId)) && !tiles.some((t) => t.type === 'item' && t.itemId === itemId)) {
          tiles.push({ type: 'item', itemId })
        }
      }
    }
  }
  const leadId = id(mosaic.featuredItemId)

  const announcements: StorefrontAnnouncement[] = []
  if (Array.isArray(input.announcements)) {
    for (const rawPanel of input.announcements) {
      if (!isRecord(rawPanel) || announcements.length >= STOREFRONT_LIMITS.announcements) continue
      const panelId = id(rawPanel.id)
      const kind = oneOf<AnnouncementKind>(rawPanel.kind, ['text', 'image', 'video'], 'text')
      const title = text(rawPanel.title, STOREFRONT_LIMITS.announcementTitle)
      const body = paragraph(rawPanel.body, STOREFRONT_LIMITS.announcementBody)
      const mediaUrl = kind === 'text' ? null : safeUrl(rawPanel.mediaUrl)
      const itemId = id(rawPanel.itemId)
      if (!panelId || announcements.some((a) => a.id === panelId)) continue
      // A panel needs something to show.
      if (!title && !body && !mediaUrl) continue
      announcements.push({
        id: panelId,
        // A media panel without usable media shows as text.
        kind: kind !== 'text' && !mediaUrl ? 'text' : kind,
        title,
        body,
        mediaUrl,
        itemId: itemId && (!refs || refs.itemIds.has(itemId)) ? itemId : null,
      })
    }
  }

  return {
    version: STOREFRONT_CONFIG_VERSION,
    brand: {
      tagline: text(brand.tagline, STOREFRONT_LIMITS.tagline),
      ...colors,
      appearance: oneOf(brand.appearance, ['light', 'dark', 'system'], base.brand.appearance),
      font: oneOf(
        brand.font,
        STOREFRONT_FONTS.map((f) => f.id),
        base.brand.font,
      ),
    },
    mosaic: {
      featuredItemId: leadId && (!refs || refs.itemIds.has(leadId)) ? leadId : null,
      tiles,
    },
    featured: {
      itemIds: ids(featured.itemIds, STOREFRONT_LIMITS.featuredItems, refs?.itemIds),
      excludedItemIds: ids(featured.excludedItemIds, STOREFRONT_LIMITS.excluded, refs?.itemIds),
      autoFill: featured.autoFill !== false,
      bundleIds: ids(featured.bundleIds, STOREFRONT_LIMITS.featuredBundles, refs?.bundleIds),
      excludedBundleIds: ids(featured.excludedBundleIds, STOREFRONT_LIMITS.excluded, refs?.bundleIds),
    },
    sections: storefrontSections(input.sections),
    announcements,
    presentation: oneOf(input.presentation, ['auto', 'grid', 'list'], base.presentation),
  }
}

/** Whether two configs say the same thing (both normalized). */
export function sameStorefrontConfig(a: StorefrontConfig, b: StorefrontConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ---------------------------------------------------------------------------
// Featured content: pinned first, then popular, never excluded
// ---------------------------------------------------------------------------

/**
 * The featured item ids in display order: pinned items first, then (with auto-fill) the most popular
 * items, skipping excluded and unavailable ones, up to `limit`.
 */
export function resolveFeaturedItemIds(
  featured: StorefrontConfig['featured'],
  popularItemIds: readonly string[],
  isAvailable: (itemId: string) => boolean,
  limit = FEATURED_DEFAULT_COUNT,
): string[] {
  const excluded = new Set(featured.excludedItemIds)
  const out: string[] = []
  const add = (itemId: string) => {
    if (out.length < Math.max(limit, featured.itemIds.length) && !out.includes(itemId) && isAvailable(itemId)) out.push(itemId)
  }
  for (const itemId of featured.itemIds) add(itemId)
  if (featured.autoFill) {
    for (const itemId of popularItemIds) if (!excluded.has(itemId)) add(itemId)
  }
  return out
}

/** Bundles in display order: pinned first, then the rest of the store's active bundles, minus excluded. */
export function resolveBundleIds(featured: StorefrontConfig['featured'], activeBundleIds: readonly string[]): string[] {
  const active = new Set(activeBundleIds)
  const excluded = new Set(featured.excludedBundleIds)
  const pinned = featured.bundleIds.filter((bundleId) => active.has(bundleId))
  return [...pinned, ...activeBundleIds.filter((bundleId) => !pinned.includes(bundleId) && !excluded.has(bundleId))]
}

// ---------------------------------------------------------------------------
// Color: readable text on a brand color, and contrast checks for the editor
// ---------------------------------------------------------------------------

function channel(hex: string, index: number): number {
  const value = Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255
  return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2)
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** White or near-black, whichever reads better on `background`. */
export function readableTextOn(background: string): '#ffffff' | '#111111' {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#111111') ? '#ffffff' : '#111111'
}

export function isHexColor(value: string): boolean {
  return HEX.test(value)
}
