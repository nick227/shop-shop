/**
 * Overview — the store's landing page. What it shows follows the store's state:
 * setup steps for a draft, work in progress for an open store, a clear notice when paused or disabled.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronRight } from 'lucide-react'
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
  useVendorTeamRequest,
  useUpdateOrderStatus,
  type VendorStore,
} from '@shared/hooks/hooks/vendor'
import { ORDER_STATUS_CONFIG, parseOrderItems } from '@features/orders/utils/orderUtils'
import { VendorPage } from '@layouts/VendorLayout/page'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'
import { canAccess } from '@layouts/VendorLayout/storeAccess'
import { storeStatus } from '@layouts/VendorLayout/storeStatus'

interface ReadinessCheck {
  readonly key: string
  readonly label: string
  readonly passed: boolean
  readonly required: boolean
  readonly message?: string
}

interface Readiness {
  readonly canPublish: boolean
  readonly checks: readonly ReadinessCheck[]
}

/** Where each readiness check is fixed, and what to call it. */
const CHECK_STEPS: Record<string, { readonly label: string; readonly to: (storeId: string) => string }> = {
  identity: { label: 'Name, description, and contact', to: (id) => vendorPaths.settings(id, 'contact') },
  address: { label: 'Street address', to: (id) => vendorPaths.settings(id, 'location') },
  geocoding: { label: 'Map location', to: (id) => vendorPaths.settings(id, 'location') },
  fulfillment: { label: 'Pickup or delivery', to: (id) => vendorPaths.settings(id, 'orders') },
  deliveryZones: { label: 'Delivery area', to: (id) => vendorPaths.settings(id, 'orders') },
  products: { label: 'At least one menu item', to: vendorPaths.newItem },
  activationRequirements: { label: 'Store photo and listing details', to: (id) => vendorPaths.settings(id, 'store') },
}

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

function SetupSteps({ storeId, canEdit }: { readonly storeId: string; readonly canEdit: boolean }) {
  const request = useVendorTeamRequest()
  const readiness = useQuery({
    queryKey: ['store-readiness', storeId],
    queryFn: () => request<Readiness>(`/stores/${storeId}/readiness`),
    enabled: canEdit,
  })

  if (!canEdit) {
    return <p className="text-sm text-muted-foreground">This store isn’t published yet. The owner can finish setting it up.</p>
  }
  if (readiness.isLoading) return <p className="text-sm text-muted-foreground">Checking what’s left…</p>
  if (readiness.error || !readiness.data) {
    return (
      <p className="text-sm text-muted-foreground">
        Setup steps could not be loaded.{' '}
        <button type="button" className="underline" onClick={() => void readiness.refetch()}>
          Try again
        </button>
      </p>
    )
  }

  const steps = readiness.data.checks.filter((check) => check.required)
  const done = steps.filter((check) => check.passed).length

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Customers can’t see your store yet.</span>
          <span className="tabular-nums text-muted-foreground">
            {done} of {steps.length + 1} done
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground" style={{ width: `${(done / (steps.length + 1)) * 100}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {steps.map((check) => {
          const step = CHECK_STEPS[check.key] ?? { label: check.label, to: (id: string) => vendorPaths.settings(id) }
          return (
            <li key={check.key}>
              <Link
                to={step.to(storeId)}
                className={cn('flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted', check.passed && 'text-muted-foreground')}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                    check.passed ? 'border-success bg-success text-white' : 'border-border',
                  )}
                  aria-hidden
                >
                  {check.passed ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block', check.passed ? 'line-through' : 'font-medium')}>{step.label}</span>
                  {!check.passed && check.message ? <span className="block text-xs text-muted-foreground">{check.message}</span> : null}
                </span>
                <span className="sr-only">{check.passed ? 'Done' : 'To do'}</span>
                {!check.passed && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
              </Link>
            </li>
          )
        })}
        <li>
          <Link to={vendorPaths.settings(storeId, 'store')} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted">
            <span className="flex h-5 w-5 shrink-0 rounded-full border border-border" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">Publish your store</span>
              <span className="block text-xs text-muted-foreground">
                {readiness.data.canPublish ? 'Ready. Turn the store on in Settings.' : 'Available once the steps above are done.'}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      </ul>
    </div>
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

/** Admin restrictions first, since the merchant can't lift them; then the merchant's own pause. */
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
      <Notice tone="danger" title={`${store.name} is disabled`}>
        ShopShop turned this store off, so customers can’t see it or order from it. Contact support to have it turned back on.
      </Notice>
    )
  }
  if (store.status === 'PAUSED') {
    return (
      <Notice tone="danger" title={`${store.name} is suspended`}>
        ShopShop suspended this store, so it can’t take new orders. Orders already in progress still need to go out.
        Contact support to lift the suspension.
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

        {draft ? (
          <Panel title="Finish setting up">
            <SetupSteps storeId={selectedStoreId} canEdit={canEdit} />
          </Panel>
        ) : null}

        {showOrders ? (
          <OrdersAtAGlance storeId={selectedStoreId} canManage={canAccess(selectedStore, 'MANAGE_ORDERS')} />
        ) : null}

        {!canSeeOrders && !draft ? (
          <p className="text-sm text-muted-foreground">Use the sidebar to get to the parts of this store you work on.</p>
        ) : null}
      </div>
    </VendorPage>
  )
}
