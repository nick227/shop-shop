import { useAccountCapabilities } from '@features/account/useAccountCapabilities'
/**
 * Store identity — the business you're operating, at the top of the sidebar.
 * With one store it opens that store's details; with two or more it is the switcher.
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, ExternalLink, LayoutGrid, Plus, Settings } from 'lucide-react'
import { Menu, MenuItem, MenuLabel, MenuSeparator } from '@shared/ui/primitives/ui/Menu'
import { StatusPill } from '@shared/ui/primitives/ui/StatusPill'
import { usePendingOrderCounts } from '@shared/hooks/hooks/vendor'
import { getStoreRoute } from '@shared/lib/utils/navigation/routes'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import { StoreAvatar } from './StoreAvatar'
import { storePlace, storeStatus } from './storeStatus'
import { SETTINGS_ITEM, sectionFor, switchTargetPath } from './vendorNav'
import { canAccess } from './storeAccess'

const CREATE_STORE_PATH = vendorPaths.newStore

function PendingBadge({ count }: { readonly count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function StoreIdentityMenu() {
  const { capabilities } = useAccountCapabilities()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { stores, selectedStore, selectedStoreId, setSelectedStoreId } = useVendorActiveStore()
  const { data: pending = {} } = usePendingOrderCounts()

  if (!selectedStore) return null

  const status = storeStatus(selectedStore)
  const canSetUp = canAccess(selectedStore, SETTINGS_ITEM.requires)
  const multiple = stores.length > 1
  const waitingElsewhere = stores.reduce(
    (sum, store) => (store.id === selectedStoreId ? sum : sum + (pending[store.id] ?? 0)),
    0,
  )

  const switchTo = (storeId: string) => {
    if (storeId === selectedStoreId) return
    const section = sectionFor(pathname)
    const target = stores.find((store) => store.id === storeId)
    // Same section in the other store when you may use it there; its Overview otherwise.
    if (section && canAccess(target, section.requires)) navigate(switchTargetPath(pathname, search, storeId))
    else if (section) navigate(vendorPaths.overview(storeId))
    else setSelectedStoreId(storeId)
    const name = stores.find((store) => store.id === storeId)?.name
    if (name) toast(`Now working in ${name}`)
  }

  return (
    <Menu
      label={multiple ? 'Your stores' : selectedStore.name}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`${selectedStore.name}, ${status.label}. ${multiple ? 'Switch store' : 'Store menu'}`}
          className="relative flex w-full min-w-0 items-center gap-3 rounded-xl p-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StoreAvatar name={selectedStore.name} imageUrl={selectedStore.imageUrl} />
          {waitingElsewhere > 0 ? (
            <span className="app-shell-rail-only absolute left-8 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-destructive" aria-hidden />
          ) : null}
          <span className="app-shell-label flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{selectedStore.name}</span>
            <StatusPill tone={status.tone} bare>
              {status.label}
            </StatusPill>
          </span>
          <ChevronsUpDown className="app-shell-label h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      )}
    >
      {multiple ? (
        <>
          <MenuLabel>Your stores</MenuLabel>
          {stores.map((store) => {
            const storeState = storeStatus(store)
            const count = pending[store.id] ?? 0
            const current = store.id === selectedStoreId
            return (
              <MenuItem
                key={store.id}
                onSelect={() => switchTo(store.id)}
                icon={<StoreAvatar name={store.name} imageUrl={store.imageUrl} size="sm" />}
                className="min-h-12"
                end={current ? <Check className="h-4 w-4 text-foreground" aria-label="Current store" /> : <PendingBadge count={count} />}
              >
                <span className="block truncate font-medium">{store.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[storeState.label, count > 0 ? `${count} new` : storePlace(store)].filter(Boolean).join(' · ')}
                </span>
              </MenuItem>
            )
          })}
          <MenuSeparator />
          {canSetUp ? (
            <MenuItem to={SETTINGS_ITEM.to(selectedStoreId)} icon={<Settings className="h-4 w-4" />}>
              {selectedStore.name} settings
            </MenuItem>
          ) : null}
          <MenuItem to={vendorPaths.allStores} icon={<LayoutGrid className="h-4 w-4" />}>
            All stores
          </MenuItem>
          {capabilities?.canCreateStore ? <MenuItem to={CREATE_STORE_PATH} icon={<Plus className="h-4 w-4" />}>
            Add a store
          </MenuItem> : null}
        </>
      ) : (
        <>
          <div className="flex gap-3 border-b border-border px-4 pb-3 pt-2">
            <StoreAvatar name={selectedStore.name} imageUrl={selectedStore.imageUrl} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{selectedStore.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[status.label, storePlace(selectedStore)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          <div className="pt-1" />
          <MenuItem href={getStoreRoute({ id: selectedStore.id, name: selectedStore.name })} icon={<ExternalLink className="h-4 w-4" />}>
            View storefront
          </MenuItem>
          {canSetUp ? (
            <MenuItem to={SETTINGS_ITEM.to(selectedStoreId)} icon={<Settings className="h-4 w-4" />}>
              Store settings
            </MenuItem>
          ) : null}
          <MenuSeparator />
          {capabilities?.canCreateStore ? <MenuItem to={CREATE_STORE_PATH} icon={<Plus className="h-4 w-4" />}>
            Add another store
          </MenuItem> : null}
        </>
      )}
    </Menu>
  )
}
