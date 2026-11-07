/**
 * Page state for the storefront: shopper actions, the resolved catalog, and menu search.
 * The layout reads this. It does not decide which block sits where.
 */
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { ItemResponse } from '@api/types'
import { matchesMenuSearch, type MenuGroup } from '@shared/lib/menu/menuSections'
import { useAddToCart } from '@shared/hooks/hooks/useAddToCart'
import type { StorefrontActions } from './context'
import { scrollToSection, useActiveSection } from './components/StorefrontMenu'
import { storefrontAppearanceClass, storefrontThemeStyle } from './theme'
import { storefrontHeroImage } from './components/StorefrontHero'
import { resolveStorefrontCatalog, type StorefrontCatalog } from './resolveCatalog'
import type { StorefrontProps } from './storefrontProps'

export interface StorefrontPage {
  readonly props: StorefrontProps
  readonly config: NonNullable<StorefrontProps['config']>
  readonly catalog: StorefrontCatalog
  readonly actions: StorefrontActions
  readonly theme: StorefrontActions['theme']
  readonly heroImage: string | null
  readonly shownGroups: readonly MenuGroup<ItemResponse>[]
  readonly query: string
  readonly setQuery: (query: string) => void
  readonly searching: boolean
  readonly resultCount: number
  readonly totalItems: number
  readonly showMenuBar: boolean
  readonly activeId: string | undefined
  readonly jump: (id: string) => void
  readonly setBarHeight: (height: number) => void
  readonly jumpOffset: number
  readonly sheetItem: ItemResponse | null
  readonly closeItem: () => void
  readonly commerce: boolean
  readonly showCart: boolean
}

export function useStorefrontPage(props: StorefrontProps): StorefrontPage {
  const { store, data, items, sections, bundles, mode, stickyTop, scrollRoot = null } = props
  const commerce = props.commerce ?? true
  const config = props.config ?? data.config
  const catalog = useMemo(
    () => resolveStorefrontCatalog({ items, sections, bundles, config, popularItemIds: data.popularItemIds }),
    [items, sections, bundles, config, data.popularItemIds],
  )
  const heroImage = useMemo(() => storefrontHeroImage(store, data.media), [store, data.media])

  const sheet = useItemSheet(mode, catalog.itemsById)
  const addToCart = useAddToCart()
  const addItem = useCallback(
    (item: ItemResponse, quantity = 1) => {
      if (mode === 'preview') {
        toast.info('Shoppers add items to their cart here.')
        return
      }
      if (!data.ordering.acceptingOrders) toast.info(data.ordering.message ?? 'This store isn’t taking orders right now.')
      addToCart.mutate({ storeId: item.storeId, itemId: item.id, quantity, title: item.title, unitPrice: item.price, item })
    },
    [mode, addToCart, data.ordering],
  )

  const theme = useMemo(
    () => ({ className: storefrontAppearanceClass(config.brand.appearance), style: storefrontThemeStyle(config.brand) }),
    [config.brand],
  )
  const actions: StorefrontActions = useMemo(
    () => ({
      store: { id: store.id, name: store.name },
      mode,
      acceptingOrders: data.ordering.acceptingOrders,
      openItem: sheet.openItem,
      addItem,
      stickyTop,
      scrollRoot,
      theme,
    }),
    [store.id, store.name, mode, data.ordering.acceptingOrders, sheet.openItem, addItem, stickyTop, scrollRoot, theme],
  )

  const menu = useMenu(catalog.groups, stickyTop, scrollRoot, commerce)
  return {
    props,
    config,
    catalog,
    actions,
    theme,
    heroImage,
    ...menu,
    sheetItem: sheet.item,
    closeItem: sheet.closeItem,
    commerce,
    showCart: commerce && mode === 'live',
  }
}

/** Live: the open item is `?item=`, so it can be shared and Back closes it. Preview keeps it local. */
function useItemSheet(mode: StorefrontProps['mode'], itemsById: StorefrontCatalog['itemsById']) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [previewItemId, setPreviewItemId] = useState<string | null>(null)
  const openItemId = mode === 'live' ? searchParams.get('item') : previewItemId
  const openItem = useCallback(
    (item: ItemResponse) => {
      if (mode === 'preview') return setPreviewItemId(item.id)
      const next = new URLSearchParams(searchParams)
      next.set('item', item.id)
      setSearchParams(next)
    },
    [mode, searchParams, setSearchParams],
  )
  const closeItem = useCallback(() => {
    if (mode === 'preview') return setPreviewItemId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('item')
    setSearchParams(next, { replace: true })
  }, [mode, searchParams, setSearchParams])
  return { item: openItemId ? itemsById.get(openItemId) ?? null : null, openItem, closeItem }
}

function useMenu(
  groups: readonly MenuGroup<ItemResponse>[],
  stickyTop: number,
  scrollRoot: HTMLElement | null,
  commerce: boolean,
) {
  const [query, setQuery] = useState('')
  const [barHeight, setBarHeight] = useState(104)
  const searching = query.trim().length > 0
  const shownGroups = useMemo(
    () =>
      searching
        ? groups
            .map((group) => ({ ...group, items: group.items.filter((item) => matchesMenuSearch(item, query)) }))
            .filter((group) => group.items.length > 0)
        : groups,
    [groups, query, searching],
  )
  const resultCount = shownGroups.reduce((sum, group) => sum + group.items.length, 0)
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0)
  const jumpOffset = stickyTop + barHeight + 8
  const activeId = useActiveSection(shownGroups.map((group) => group.id), scrollRoot, jumpOffset)
  const jump = useCallback((id: string) => scrollToSection(id, scrollRoot, jumpOffset), [scrollRoot, jumpOffset])
  return {
    shownGroups,
    query,
    setQuery,
    searching,
    resultCount,
    totalItems,
    showMenuBar: commerce && (groups.length > 1 || totalItems > 6),
    activeId,
    jump,
    setBarHeight,
    jumpOffset,
  }
}
