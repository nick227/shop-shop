/**
 * Storefront — the only public business page. Live shop, vendor preview, and directory profile.
 *
 * Page order (see DESIGN.md):
 *   nav → hero (identity over photo | map) → ordering → featured → search → menu → rest → cart
 *
 * Configured blocks follow `STOREFRONT_SECTIONS`. A config can hide one. It cannot reorder them.
 * The menu bar is injected immediately before the menu block. Search keeps the menu and
 * unmounts every other configured block.
 */
import { Fragment } from 'react'
import { STOREFRONT_SECTIONS, type StorefrontSection } from '@packages/shared/storefront'
import { BusinessNavigation } from '@features/discovery-navigation/BusinessNavigation'
import { BusinessHeader } from './components/BusinessHeader'
import { OrderingStrip } from './components/OrderingStrip'
import { StorefrontHero } from './components/StorefrontHero'
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
      {mode === 'live' ? <BusinessNavigation business={store} /> : null}

      <div className="sf-top">
        {/* Identity floats on the cover, same composition as the discovery home hero. */}
        <StorefrontHero
          store={store}
          imageUrl={page.heroImage}
          showMap={mode === 'live'}
          identity={
            <StorefrontPart part="header">
              <BusinessHeader
                tone="hero"
                store={store}
                tagline={page.config.brand.tagline}
                logoUrl={store.imageUrl && store.imageUrl !== page.heroImage ? store.imageUrl : null}
              />
            </StorefrontPart>
          }
        />

        {page.commerce ? (
          <StorefrontPart part="ordering">
            <OrderingStrip ordering={data.ordering} hours={data.hours} />
          </StorefrontPart>
        ) : null}
      </div>

      <div className="sf-body">
        {STOREFRONT_SECTIONS.map((key) => (
          <Fragment key={key}>
            {key === 'menu' ? (
              <>
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
              </>
            ) : null}
            <StorefrontBlockSlot part={key} page={page} blocks={blocks} />
          </Fragment>
        ))}
      </div>

      {page.showCart ? <CartBar storeId={store.id} /> : null}
    </StorefrontShell>
  )
}

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
