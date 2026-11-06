/**
 * Storefront — the only public business page. Live shop, vendor preview, and directory profile.
 *
 * This file is the page order. Change a slot here.
 * What a configured block renders: `blocks.tsx` (`storefrontBlocks`, or the `blocks` prop).
 * Which products fill those blocks: `resolveCatalog.ts`.
 * Shopper actions and search: `useStorefrontPage.ts`.
 * Edit / Hide chrome: `parts.tsx`.
 *
 * Fixed, top to bottom: navigation, header, ordering, menu bar, configured blocks, cart.
 * Configured blocks follow `STOREFRONT_SECTIONS`. A config can hide one. It cannot reorder them.
 * Search keeps the menu and unmounts every other configured block.
 */
import { STOREFRONT_SECTIONS, type StorefrontSection } from '@packages/shared/storefront'
import { BusinessNavigation } from '@features/discovery-navigation/BusinessNavigation'
import { BusinessHeader } from './components/BusinessHeader'
import { OrderingStrip } from './components/OrderingStrip'
import { MenuBar } from './components/StorefrontMenu'
import { CartBar } from './components/CartBar'
import { StorefrontOptional, StorefrontPart } from './parts'
import { storefrontBlocks, type StorefrontBlock } from './blocks'
import { StorefrontShell } from './StorefrontShell'
import { useStorefrontPage, type StorefrontPage } from './useStorefrontPage'
import type { StorefrontProps as StorefrontInput } from './storefrontProps'

export type { StorefrontPartKey } from './storefrontProps'

export interface StorefrontProps extends StorefrontInput {
  /** Replace what a configured block renders. Omitted keys keep `storefrontBlocks`. */
  readonly blocks?: Partial<Record<StorefrontSection, StorefrontBlock>>
}

export function Storefront({ blocks, className, ...input }: StorefrontProps) {
  const page = useStorefrontPage(input)
  const { store, data, mode } = input

  return (
    <StorefrontShell page={page} className={className}>
      {/* Back into discovery. The preview has no public URL to return to. */}
      {mode === 'live' ? <BusinessNavigation business={store} /> : null}

      {/* Identity. Always first, never a hideable block. */}
      <StorefrontPart part="header">
        <BusinessHeader store={store} tagline={page.config.brand.tagline} logoUrl={store.imageUrl ?? null} />
      </StorefrontPart>

      {/* How to order. Directory profiles pass commerce={false}. */}
      {page.commerce ? (
        <StorefrontPart part="ordering">
          <OrderingStrip ordering={data.ordering} hours={data.hours} />
        </StorefrontPart>
      ) : null}

      <div className="space-y-8">
        {/* Sticky wayfinding. A short menu uses the section headings instead. */}
        {page.showMenuBar ? (
          <MenuBar
            groups={page.shownGroups}
            query={page.query}
            onQuery={page.setQuery}
            activeId={page.activeId}
            onJump={page.jump}
            onHeight={page.setBarHeight}
          />
        ) : null}

        {page.searching ? <MenuSearchStatus query={page.query} count={page.resultCount} /> : null}

        {/* One entry per key in `storefrontBlocks`. Search keeps `menu` only. */}
        {STOREFRONT_SECTIONS.map((key) => (
          <StorefrontBlockSlot key={key} part={key} page={page} blocks={blocks} />
        ))}
      </div>

      {/* Live commerce only. The preview never writes a cart. */}
      {page.showCart ? <CartBar storeId={store.id} /> : null}
    </StorefrontShell>
  )
}

/**
 * Same rules for every configured block.
 * It must be in the config. Search unmounts everything except the menu.
 * Commerce off drops the menu. A hidden block is absent for shoppers and a Show bar in the editor.
 */
function StorefrontBlockSlot({ part, page, blocks }: {
  readonly part: StorefrontSection
  readonly page: StorefrontPage
  readonly blocks?: StorefrontProps['blocks']
}) {
  const setting = page.config.sections.find((section) => section.key === part)
  if (!setting) return null
  const render = blocks?.[part] ?? storefrontBlocks[part]
  if (part === 'menu') {
    if (!page.commerce) return null
    return <StorefrontPart part="menu">{render(page)}</StorefrontPart>
  }
  if (page.searching) return null
  return (
    <StorefrontOptional part={part} visible={setting.visible}>
      {setting.visible ? render(page) : null}
    </StorefrontOptional>
  )
}

function MenuSearchStatus({ query, count }: { readonly query: string; readonly count: number }) {
  const term = query.trim()
  const matches = count === 1 ? 'item matches' : 'items match'
  const text = count === 0 ? `Nothing on the menu matches “${term}”.` : `${count} ${matches} “${term}”`
  return (
    <p className="text-sm text-muted-foreground" role="status">
      {text}
    </p>
  )
}
