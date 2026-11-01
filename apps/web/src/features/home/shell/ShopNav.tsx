import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import { cn } from '@shared/lib/cn'
import { SHOP_NAV } from './navConfig'
import { resetHomeTaste } from '../neighborhood/taste'

function NavLinks({ expanded, showReset }: { readonly expanded: boolean; readonly showReset: boolean }) {
  const { pathname } = useLocation()
  const authed = useAuthStore((state) => state.isAuthenticated)
  const items = SHOP_NAV.map((item) =>
    item.label === 'Account' && !authed ? { ...item, to: '/login' } : item,
  )

  return (
    <>
      <div className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = item.match(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              title={item.label}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
                active ? 'bg-[var(--ink)] text-[var(--air)]' : 'hover:bg-[var(--field)]',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span className={expanded ? undefined : 'shop-rail-label'}>{item.label}</span>
            </Link>
          )
        })}
      </div>
      {showReset ? (
        <button
          type="button"
          className="min-h-11 px-3 text-left text-xs"
          style={{ color: 'var(--quiet)' }}
          onClick={resetHomeTaste}
        >
          Reset home
        </button>
      ) : null}
    </>
  )
}

export function RailNav() {
  return (
    <nav className="shop-rail" aria-label="Primary">
      <Link to="/river" className="shop-display mb-4 flex min-h-11 items-center px-3 text-lg font-bold">
        <span className="shop-rail-label">ShopShop</span>
        <span className="shop-rail-mark">S</span>
      </Link>
      <NavLinks expanded={false} showReset={false} />
    </nav>
  )
}

export function DrawerNav({ onNavigate }: { readonly onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col" onClick={onNavigate}>
      <p className="shop-display mb-6 px-1 text-2xl font-bold">ShopShop</p>
      <NavLinks expanded showReset />
    </div>
  )
}
