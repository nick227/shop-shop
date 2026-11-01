/**
 * Route guards and old-URL redirects for store pages under `/vendor/:storeId`.
 */
import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import { useVendorActiveStore } from './VendorActiveStoreContext'
import { canAccess, type StoreAccess } from './storeAccess'

/** Renders the store's pages only for stores you belong to. Never swaps in a different store. */
export function StoreRoute() {
  const { storeId = '' } = useParams<{ storeId: string }>()
  const { stores } = useVendorActiveStore()

  if (!stores.some((store) => store.id === storeId)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 md:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">You don’t have access to this store</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be for a store you were removed from, or the store no longer exists.
        </p>
        <Link
          to="/vendor"
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Go to your store
        </Link>
      </div>
    )
  }
  return <Outlet />
}

function AccessDenied({ storeId, label }: { readonly storeId: string; readonly label: string }) {
  useEffect(() => {
    toast(`You don’t have access to ${label} in this store`)
  }, [label])
  return <Navigate to={vendorPaths.overview(storeId)} replace />
}

/** Sends members without `need` to the store's Overview, with a one-line notice. */
export function RequireAccess({
  need,
  label,
  children,
}: {
  readonly need: StoreAccess
  readonly label: string
  readonly children: ReactNode
}) {
  const { selectedStore, selectedStoreId } = useVendorActiveStore()
  if (!canAccess(selectedStore, need)) return <AccessDenied storeId={selectedStoreId} label={label} />
  return <>{children}</>
}

type ScopedSection = 'orders' | 'affiliates' | 'team' | 'drivers'

/** Old `/vendor/orders?storeId=` style URLs. */
export function LegacyScopedRedirect({ section }: { readonly section: ScopedSection }) {
  const { search } = useLocation()
  const { stores, selectedStoreId } = useVendorActiveStore()
  const params = new URLSearchParams(search)
  const requested = params.get('storeId') ?? ''
  const storeId = stores.some((store) => store.id === requested) ? requested : selectedStoreId
  params.delete('storeId')
  if (!storeId) return <Navigate to={vendorPaths.newStore} replace />
  const rest = params.toString()
  return <Navigate to={`${vendorPaths[section](storeId)}${rest ? `?${rest}` : ''}`} replace />
}

/** Maps the part after an old `/vendor/stores/:storeId/` to its new place. */
export function legacyStorePath(storeId: string, rest: string): string {
  const parts = rest.split('/').filter(Boolean)
  const [section, id, action] = parts
  if (section === 'items' && id === 'new') return vendorPaths.newItem(storeId)
  if (section === 'items' && id && action === 'edit') return vendorPaths.item(storeId, id)
  if (section === 'items') return vendorPaths.menu(storeId)
  if (section === 'bundles' && id === 'new') return vendorPaths.newBundle(storeId)
  if (section === 'bundles' && id && action === 'edit') return vendorPaths.bundle(storeId, id)
  if (section === 'bundles') return vendorPaths.bundles(storeId)
  if (section === 'river') return vendorPaths.river(storeId)
  if (section === 'team') return vendorPaths.team(storeId)
  if (section === 'edit') return vendorPaths.settings(storeId)
  return vendorPaths.overview(storeId)
}

/** Old `/vendor/stores/:storeId/...` URLs. */
export function LegacyStorePathRedirect() {
  const { storeId = '', '*': rest = '' } = useParams<{ storeId: string; '*': string }>()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  params.delete('storeId')
  const query = params.toString()
  return <Navigate to={`${legacyStorePath(storeId, rest)}${query ? `?${query}` : ''}`} replace />
}
