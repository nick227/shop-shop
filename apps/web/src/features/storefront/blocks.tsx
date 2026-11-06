/**
 * What each configured block renders.
 * Add or swap a block here. `Storefront.tsx` decides where it sits.
 * A block returns null when it has nothing to show; the slot still occupies the page order.
 */
import type { ReactNode } from 'react'
import type { StorefrontSection } from '@packages/shared/storefront'
import { Announcements, BundlesRow, CategoryTiles, FeaturedRow } from './components/Merchandising'
import { MediaMosaic } from './components/MediaMosaic'
import { AboutSection, GallerySection, UpdatesSection } from './components/BusinessContent'
import { LARGE_CATALOG_ITEMS, MenuSections } from './components/StorefrontMenu'
import type { StorefrontPage } from './useStorefrontPage'

/** Category tiles help find a department in a big store. A short menu has the section links. */
const CATEGORY_TILES_MIN_SECTIONS = 8

export type StorefrontBlock = (page: StorefrontPage) => ReactNode

export const storefrontBlocks: Record<StorefrontSection, StorefrontBlock> = {
  about: (page) => <AboutSection store={page.props.store} hours={page.props.data.hours} showMap={page.props.mode === 'live'} />,
  mosaic: (page) => <MediaMosaic products={page.catalog.carousel} tiles={page.catalog.tiles} storeName={page.props.store.name} />,
  announcements: (page) => <Announcements panels={page.config.announcements} itemsById={page.catalog.itemsById} />,
  bundles: (page) => <BundlesRow bundles={page.catalog.bundles} />,
  featured: (page) => <FeaturedRow items={page.catalog.featuredRow} />,
  categories: (page) =>
    page.catalog.groups.length >= CATEGORY_TILES_MIN_SECTIONS
      ? <CategoryTiles groups={page.catalog.groups} onJump={page.jump} />
      : null,
  menu: (page) =>
    page.catalog.groups.length > 0 ? (
      <MenuSections
        groups={page.shownGroups}
        presentation={page.config.presentation}
        jumpOffset={page.jumpOffset}
        large={!page.searching && page.totalItems > LARGE_CATALOG_ITEMS}
      />
    ) : (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing on the menu right now. Check back soon.
      </p>
    ),
  gallery: (page) => <GallerySection media={page.props.data.media} storeName={page.props.store.name} />,
  updates: (page) => (page.props.updates ? <UpdatesSection>{page.props.updates}</UpdatesSection> : null),
}
