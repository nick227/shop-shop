import { Link, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@shared/lib/cn'
import { useAppShell } from '@shared/ui/layout/AppShell'
import { usePendingOrderCount } from '@shared/hooks/hooks/vendor'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import { StoreIdentityMenu } from './StoreIdentityMenu'
import { ORDERS_ITEM, VENDOR_NAV, storeSection, type VendorNavItem } from './vendorNav'
import { canAccess } from './storeAccess'

function NavItem({ item, storeId, badge }: { readonly item: VendorNavItem; readonly storeId: string; readonly badge?: number }) {
  const { pathname } = useLocation()
  const section = storeSection(pathname)
  const active = section !== null && item.match(section)
  const Icon = item.icon
  return (
    <Link
      to={item.to(storeId)}
      aria-current={active ? 'page' : undefined}
      title={item.label}
      className={cn(
        'relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-muted text-foreground shadow-[inset_2px_0_0_hsl(var(--foreground))]' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
      <span className="app-shell-label flex-1">{item.label}</span>
      {badge ? (
        <>
          <span className="app-shell-label inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
            <span className="sr-only"> waiting</span>
          </span>
          <span className="app-shell-rail-only absolute left-6 top-2 h-2 w-2 rounded-full bg-destructive" aria-hidden />
        </>
      ) : null}
    </Link>
  )
}

export function VendorSidebar() {
  const { selectedStoreId, selectedStore } = useVendorActiveStore()
  const { collapsed, toggleCollapsed, inDrawer } = useAppShell()
  const { data: pending = 0 } = usePendingOrderCount(selectedStoreId || undefined)
  const groups = VENDOR_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccess(selectedStore, item.requires)),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      <Link to="/" className="flex min-h-10 items-center gap-2 px-3 text-lg font-bold tracking-tight" title="Back to shopping">
        <span className="app-shell-rail-only" aria-hidden>S</span>
        <span className="app-shell-label">
          ShopShop <span className="text-xs font-medium text-muted-foreground">for sellers</span>
        </span>
      </Link>

      <StoreIdentityMenu />

      {selectedStoreId ? (
        <div className="flex flex-1 flex-col gap-4">
          {groups.map((group, index) => (
            <div
              key={group.label ?? index}
              className={cn('flex flex-col gap-0.5', group.pinned && 'mt-auto border-t border-border pt-3')}
            >
              {group.label ? (
                <p className="app-shell-label px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  storeId={selectedStoreId}
                  badge={item === ORDERS_ITEM ? pending : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {inDrawer ? null : (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="app-shell-expanded-only min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
          <span className="app-shell-label">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      )}
    </>
  )
}
