import type { LucideIcon } from 'lucide-react'
import { Compass, Home, Receipt, Store, UserRound } from 'lucide-react'

export interface ShopNavItem {
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
  readonly match: (pathname: string) => boolean
}

export const SHOP_NAV: readonly ShopNavItem[] = [
  { label: 'Home', to: '/river', icon: Home, match: (path) => path === '/' || path === '/river' },
  { label: 'Explore', to: '/search', icon: Compass, match: (path) => path.startsWith('/search') },
  { label: 'Orders', to: '/orders', icon: Receipt, match: (path) => path.startsWith('/orders') || path.startsWith('/account/orders') },
  { label: 'Account', to: '/account/profile', icon: UserRound, match: (path) => path.startsWith('/account') && !path.startsWith('/account/orders') },
]

export const SELL_ITEM = {
  label: 'Sell on ShopShop',
  to: '/vendor/store/new',
  icon: Store,
}
