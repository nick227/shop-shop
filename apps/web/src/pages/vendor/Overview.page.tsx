/**
 * Overview — the store's landing page. What it shows follows the store's state:
 * work in progress for an open store, a clear notice when paused or disabled.
 * The owner edits the store's settings here too, below the rest.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { OrderResponse } from '@api/types'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  StatusPill,
  type StatusTone,
} from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'
import { formatPriceCurrency } from '@shared/lib/utils/format'
import { vendorPaths } from '@shared/lib/utils/navigation/vendorPaths'
import {
  useStoreOrdering,
  useVendorOrders,
  useUpdateOrderStatus,
  type VendorStore,
} from '@shared/hooks/hooks/vendor'
import { ORDER_STATUS_CONFIG, parseOrderItems } from '@features/orders/utils/orderUtils'
import { VendorPage } from '@layouts/VendorLayout/page'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { canAccess } from '@layouts/VendorLayout/storeAccess'
import { storeStatus } from '@layouts/VendorLayout/storeStatus'
import { OverviewStoreSettings } from './components/OverviewStoreSettings'

const IN_PROGRESS = new Set(['ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'])
const ORDER_TONE: Partial<Record<string, StatusTone>> = { PLACED: 'danger', READY: 'live' }

function orderNumber(order: OrderResponse) {
  return `#${order.id.slice(0, 6).toUpperCase()}`
}

function minutesAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours} hr` : new Date(iso).toLocaleDateString()
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString()
}

function Panel({ title, children, className }: { readonly title: string; readonly children: React.ReactNode; readonly className?: string }) {
  return (
    <section className={cn('rounded-xl border border-border p-4', className)}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function OrderRow({ order, action }: { readonly order: OrderResponse; readonly action?: React.ReactNode }) {
  const config = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]
  const items = parseOrderItems(order.items) as readonly { readonly quantity?: number }[]
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  const customer = (order.user as unknown as { readonly name?: string | null } | null)?.name
  return (
    <li className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
      <StatusPill tone={ORDER_TONE[order.status] ?? 'neutral'}>
        {config?.label ?? order.status}
      </StatusPill>
      <span className="min-w-0 flex-1 truncate text-sm">
        <span className="font-medium">{orderNumber(order)}</span>
        <span className="text-muted-foreground">
          {[
            '',
            customer,
            itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : null,
            formatPriceCurrency(order.total),
          ]
            .filter((part) => part !== null && part !== undefined)
            .join(' · ')}
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{minutesAgo(order.createdAt)}</span>
      {action}
    </li>
  )
}

function OrdersAtAGlance({ storeId, canManage }: { readonly storeId: string; readonly canManage: boolean }) {
  const { data: orders = [], isLoading, error, refetch } = useVendorOrders({ storeId, refetchInterval: 30_000 })
  const updateStatus = useUpdateOrderStatus()

  const { incoming, inProgress, today } = useMemo(() => {
    const byNewest = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const todays = orders.filter((order) => isToday(order.createdAt) && order.status !== 'CANCELED')
    const sales = todays.reduce((sum, order) => sum + Number(order.total ?? 0), 0)
    return {
      incoming: byNewest.filter((order) => order.status === 'PLACED'),
      inProgress: byNewest.filter((order) => IN_PROGRESS.has(order.status)),
      today: { count: todays.length, sales, average: todays.length > 0 ? sales / todays.length : 0 },
    }
  }, [orders])

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders…</p>
  if (error) {
    return (
      <div className="rounded-xl border border-border p-4 text-sm">
        <p className="font-medium">Orders could not be loaded</p>
        <Button variant="outline" size="small" className="mt-3" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Panel title={incoming.length > 0 ? `Incoming · ${incoming.length}` : 'Incoming'}>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders waiting.</p>
        ) : (
          <ul>
            {incoming.slice(0, 5).map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                action={
                  canManage ? (
                    <Button
                      size="small"
                      variant="primary"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ orderId: order.id, status: 'ACCEPTED' })}
                    >
                      Accept
                    </Button>
                  ) : null
                }
              />
            ))}
          </ul>
        )}
        {incoming.length > 5 ? (
          <Link to={`${vendorPaths.orders(storeId)}?status=PLACED`} className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground">
            {incoming.length - 5} more in Orders
          </Link>
        ) : null}
      </Panel>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <Panel title="In progress">
          {inProgress.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing being prepared.</p>
          ) : (
            <ul>
              {inProgress.slice(0, 5).map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Today">
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Orders</dt>
              <dd className="text-xl font-semibold tabular-nums">{today.count}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Sales</dt>
              <dd className="text-xl font-semibold tabular-nums">{formatPriceCurrency(today.sales)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Average</dt>
              <dd className="text-xl font-semibold tabular-nums">{formatPriceCurrency(today.average)}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  )
}

function Notice({ tone, title, children }: { readonly tone: 'warning' | 'danger'; readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div role="status" className={cn('rounded-xl p-4 text-sm', tone === 'warning' ? 'bg-warning/15' : 'bg-destructive/10')}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  )
}

function PauseDialog({
  open,
  onOpenChange,
  storeName,
  pending,
  onPause,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly storeName: string
  readonly pending: boolean
  readonly onPause: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pause new orders?</DialogTitle>
          <DialogDescription>
            Customers can’t place new orders at {storeName} until you resume. Orders already in progress stay on your board.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            onPause(reason.trim())
          }}
        >
          <Input
            label="Reason (optional, only your team sees it)"
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Sold out for today"
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Keep taking orders
            </Button>
            <Button type="submit" variant="primary" isLoading={pending} disabled={pending}>
              Pause new orders
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Restrictions the merchant can't lift come first, then the merchant's own pause.
 * The copy says what the store can't do, never who did it: status doesn't record that.
 */
function AvailabilityNotices({
  store,
  canResume,
  resuming,
  onResume,
}: {
  readonly store: VendorStore
  readonly canResume: boolean
  readonly resuming: boolean
  readonly onResume: () => void
}) {
  if (store.status === 'DISABLED') {
    return (
      <Notice tone="danger" title="Hidden from customers">
        {store.name} is switched off on ShopShop: customers can’t find it or order from it. This switch isn’t in your
        settings, so contact support to turn it back on.
      </Notice>
    )
  }
  if (store.status === 'PAUSED') {
    return (
      <Notice tone="danger" title="New orders are on hold">
        Customers can’t place new orders at {store.name}. Orders already in progress still need to go out. This hold
        isn’t in your settings, so contact support to lift it.
      </Notice>
    )
  }
  if (store.acceptingOrders !== false) return null
  return (
    <Notice tone="warning" title="New orders are paused">
      <p>
        Customers can’t place new orders at {store.name} right now.
        {store.ordersPausedReason ? ` Reason: ${store.ordersPausedReason}` : ''}
      </p>
      {canResume ? (
        <Button variant="primary" size="small" className="mt-3" isLoading={resuming} disabled={resuming} onClick={onResume}>
          Resume orders
        </Button>
      ) : null}
    </Notice>
  )
}

export default function VendorOverviewPage() {
  const { selectedStore, selectedStoreId } = useVendorActiveStore()
  const ordering = useStoreOrdering(selectedStoreId)
  const [pauseOpen, setPauseOpen] = useState(false)
  // StoreRoute only renders this for a store you belong to.
  if (!selectedStore) return <VendorPage title="Overview" loading />

  const status = storeStatus(selectedStore)
  const canSeeOrders = canAccess(selectedStore, 'VIEW_ORDERS')
  const canEdit = canAccess(selectedStore, 'owner')
  const canPause = canAccess(selectedStore, 'MANAGE_STORE_SETTINGS')
  const adminRestricted = selectedStore.status === 'DISABLED' || selectedStore.status === 'PAUSED'
  const draft = !selectedStore.isPublished && !adminRestricted
  const canPauseNow = canPause && !draft && !adminRestricted && selectedStore.acceptingOrders !== false
  const showOrders = canSeeOrders && !draft

  return (
    <VendorPage
      title="Overview"
      description={
        <span className="inline-flex items-center gap-2">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      }
      actions={
        <>
          {canPauseNow ? (
            <Button variant="outline" onClick={() => setPauseOpen(true)}>
              Pause new orders
            </Button>
          ) : null}
          {showOrders ? (
            <Link
              to={vendorPaths.orders(selectedStoreId)}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open Orders
            </Link>
          ) : null}
        </>
      }
    >
      <div className="space-y-6">
        <AvailabilityNotices
          store={selectedStore}
          canResume={canPause}
          resuming={ordering.isPending}
          onResume={() => ordering.mutate({ acceptingOrders: true })}
        />
        <PauseDialog
          open={pauseOpen}
          onOpenChange={setPauseOpen}
          storeName={selectedStore.name}
          pending={ordering.isPending}
          onPause={(reason) =>
            ordering.mutate(
              { acceptingOrders: false, reason: reason || undefined },
              { onSuccess: () => setPauseOpen(false) },
            )
          }
        />

        {showOrders ? (
          <OrdersAtAGlance storeId={selectedStoreId} canManage={canAccess(selectedStore, 'MANAGE_ORDERS')} />
        ) : null}

        {!showOrders && !canEdit ? (
          <p className="text-sm text-muted-foreground">Use the sidebar to get to the parts of this store you work on.</p>
        ) : null}

        {canEdit ? <OverviewStoreSettings storeId={selectedStoreId} /> : null}
      </div>
    </VendorPage>
  )
}
