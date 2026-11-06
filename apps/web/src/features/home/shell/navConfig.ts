import type { LucideIcon } from 'lucide-react'
import { Home, Receipt, UserRound } from 'lucide-react'

export interface ShopNavItem {
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
  readonly match: (pathname: string) => boolean
}

export const SHOP_NAV: readonly ShopNavItem[] = [
  {
    label: 'Home',
    to: '/explore',
    icon: Home,
    match: (path) => path === '/' || path === '/explore' || path === '/river' || path.startsWith('/search') || path.startsWith('/neighborhoods'),
  },
  { label: 'Orders', to: '/orders', icon: Receipt, match: (path) => path.startsWith('/orders') || path.startsWith('/account/orders') },
  { label: 'Account', to: '/account/profile', icon: UserRound, match: (path) => path.startsWith('/account') && !path.startsWith('/account/orders') },
]
