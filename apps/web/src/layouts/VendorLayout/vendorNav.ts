/**
 * Vendor sidebar destinations. Every item is a place inside the active store.
 */
import type { LucideIcon } from 'lucide-react'
import { ClipboardList, LayoutDashboard, Link2, Settings, Users, UtensilsCrossed, Waves } from 'lucide-react'
import { storeIdFromPath, vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import type { StoreAccess } from './storeAccess'

export interface VendorNavItem {
  readonly label: string
  readonly icon: LucideIcon
  readonly to: (storeId: string) => string
  /** Matches the part of the path after `/vendor/:storeId`. */
  readonly match: (section: string) => boolean
  readonly requires?: StoreAccess
}

export interface VendorNavGroup {
  readonly label?: string
  /** Pinned groups sit at the foot of the sidebar. */
  readonly pinned?: boolean
  readonly items: readonly VendorNavItem[]
}

const under = (prefix: string) => (section: string) => section === prefix || section.startsWith(`${prefix}/`)

export const OVERVIEW_ITEM: VendorNavItem = {
  label: 'Overview',
  icon: LayoutDashboard,
  to: vendorPaths.overview,
  match: (section) => section === '',
}

export const ORDERS_ITEM: VendorNavItem = {
  label: 'Orders',
  icon: ClipboardList,
  to: vendorPaths.orders,
  match: under('/orders'),
  requires: 'VIEW_ORDERS',
}

export const SETTINGS_ITEM: VendorNavItem = {
  label: 'Settings',
  icon: Settings,
  to: (storeId) => vendorPaths.settings(storeId),
  match: under('/settings'),
  requires: 'owner',
}

export const VENDOR_NAV: readonly VendorNavGroup[] = [
  {
    items: [
      OVERVIEW_ITEM,
      ORDERS_ITEM,
      { label: 'Menu', icon: UtensilsCrossed, to: vendorPaths.menu, match: under('/menu'), requires: 'VIEW_ITEMS' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'River', icon: Waves, to: vendorPaths.river, match: under('/river'), requires: 'FULL_ACCESS' },
      { label: 'Affiliates', icon: Link2, to: vendorPaths.affiliates, match: under('/affiliates'), requires: 'VIEW_FINANCE' },
    ],
  },
  {
    pinned: true,
    items: [
      { label: 'Team', icon: Users, to: vendorPaths.team, match: under('/team'), requires: 'FULL_ACCESS' },
      SETTINGS_ITEM,
    ],
  },
]

const ALL_ITEMS = VENDOR_NAV.flatMap((group) => group.items)

/** The path after `/vendor/:storeId`, or null when the pathname isn't a store page. */
export function storeSection(pathname: string): string | null {
  if (!storeIdFromPath(pathname)) return null
  const match = /^\/vendor\/[^/]+(\/.*)?$/.exec(pathname)
  return match ? (match[1] ?? '').replace(/\/$/, '') : null
}

/**
 * The same page in another store. Tab pages (Bundles, Drivers, a Settings tab, an order filter)
 * are kept; a page about one record of the old store (an item, a bundle) falls back to its list.
 */
export function switchTargetPath(pathname: string, search: string, storeId: string): string {
  const listLevel = (storeSection(pathname) ?? '')
    .replace(/^\/menu\/items(\/.*)?$/, '/menu')
    .replace(/^\/menu\/bundles\/.+$/, '/menu/bundles')
  return `/vendor/${storeId}${listLevel}${search}`
}

/** The section the pathname belongs to, used to keep the same section when switching stores. */
export function sectionFor(pathname: string): VendorNavItem | undefined {
  const section = storeSection(pathname)
  if (section === null) return undefined
  return ALL_ITEMS.find((item) => item.match(section))
}
