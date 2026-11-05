import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@shared/ui/primitives'
import { orderRequest, orderTime, orderLabels, type OperationalOrder } from '../operations'

const lanes = ['Needs attention', 'New', 'Preparing', 'Ready', 'Delivering', 'History'] as const
function belongs(order: OperationalOrder, lane: string) {
  if (lane === 'Needs attention') return order.exceptions.length > 0
  if (lane === 'New') return order.status === 'PLACED'
  if (lane === 'Preparing') return ['ACCEPTED', 'PREPARING'].includes(order.status)
  if (lane === 'Ready') return order.status === 'READY'
  if (lane === 'Delivering') return order.status === 'OUT_FOR_DELIVERY'
  return ['COMPLETED', 'DELIVERED', 'CANCELED'].includes(order.status)
}

export function OrderWorkspace({
  storeId,
  operationsOnly = false,
}: {
  storeId?: string
  operationsOnly?: boolean
}) {
  const [lane, setLane] = useState<string>('Needs attention')
  const [settings, setSettings] = useState(false)
  const history = lane === 'History'
  const query = useQuery({
    queryKey: ['order-operations', storeId, history],
    queryFn: () =>
      orderRequest<{ orders: OperationalOrder[]; limit: number }>(
        `/order-operations?history=${history}${storeId ? `&storeId=${storeId}` : ''}`
      ),
    refetchInterval: 10000,
  })
  const orders = query.data?.orders ?? []
  const visible = orders.filter((order) => belongs(order, lane))
  return (
    <section className="space-y-5" aria-label="Order workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" role="status">
          {query.isFetching
            ? 'Checking for updates…'
            : query.dataUpdatedAt
              ? `Updated ${orderTime(new Date(query.dataUpdatedAt).toISOString())} · refreshes every 10 seconds`
              : 'Connecting…'}
        </p>
        {storeId && (
          <Button variant="outline" size="small" onClick={() => setSettings(!settings)}>
            Acceptance settings
          </Button>
        )}
      </div>
      {settings && storeId && <OrderProcessingSettings storeId={storeId} />}
      {!operationsOnly && (
        <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Order stages">
          {lanes.map((value) => (
            <button
              key={value}
              onClick={() => setLane(value)}
              aria-pressed={lane === value}
              className={`min-h-11 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${lane === value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground'}`}
            >
              {value}{' '}
              {value !== 'History' && (
                <span className="ml-2 opacity-75">
                  {orders.filter((order) => belongs(order, value)).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      )}
      {query.isError && (
        <div role="alert" className="rounded-xl border border-destructive p-4">
          <p>Orders could not be refreshed. {query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      )}
      {query.isLoading ? (
        <p className="p-8 text-muted-foreground">Loading orders…</p>
      ) : !visible.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <h2 className="text-lg font-semibold">
            {lane === 'Needs attention'
              ? 'No orders need attention'
              : `No orders in ${lane.toLowerCase()}`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Incoming orders and updates will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <OperationalOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
      {orders.length === query.data?.limit && (
        <p className="text-sm text-muted-foreground">
          Showing the first {query.data.limit} orders. Use order history to review completed orders.
        </p>
      )}
    </section>
  )
}

export function OperationalOrderCard({ order }: { order: OperationalOrder }) {
  const client = useQueryClient()
  const [prepMinutes, setPrepMinutes] = useState(20)
  const [code, setCode] = useState('')
  const [reason, setReason] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [estimateOpen, setEstimateOpen] = useState(false)
  const [error, setError] = useState('')
  const primary = order.allowedActions.find((action) => action.status !== 'CANCELED')
  const mutation = useMutation({
    mutationFn: async (input: { status?: string; retryRefund?: boolean }) => {
      setError('')
      if (input.retryRefund)
        return orderRequest(`/orders/${order.id}/retry-refund`, { method: 'POST' })
      return orderRequest(`/orders/${order.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: input.status,
          expectedVersion: order.version,
          operationId: crypto.randomUUID(),
          ...(input.status === 'ACCEPTED' || !input.status ? { prepMinutes } : {}),
          ...(input.status === 'COMPLETED' ? { collectionCode: code } : {}),
          ...(input.status === 'CANCELED' ? { note: reason } : {}),
        }),
      })
    },
    onSuccess: () => {
      setCancelOpen(false)
      setEstimateOpen(false)
      void client.invalidateQueries({ queryKey: ['order-operations'] })
      void client.invalidateQueries({ queryKey: ['order'] })
    },
    onError: (error: Error) => {
      setError(error.message)
      void client.invalidateQueries({ queryKey: ['order-operations'] })
    },
  })
  const prepControl = (
    <label className="block text-sm font-medium">
      Ready in <span className="text-muted-foreground">(minutes from now)</span>
      <input
        aria-label={`Preparation minutes for order ${order.id.slice(0, 8)}`}
        type="number"
        min={1}
        max={240}
        value={prepMinutes}
        onChange={(event) => setPrepMinutes(Number(event.target.value))}
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 tabular-nums"
      />
    </label>
  )
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-card ${order.overdue ? 'border-destructive' : 'border-border'}`}
      aria-label={`Order ${order.id.slice(0, 8)}`}
    >
      <div className="grid lg:grid-cols-[180px_minmax(0,1fr)_240px]">
        <div
          className={`border-b border-border p-5 lg:border-b-0 lg:border-r ${order.overdue ? 'bg-destructive/5' : 'bg-primary/5'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {order.status === 'COMPLETED' ? 'Collected' : 'Promised ready'}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
            {order.promisedReadyAt ? orderTime(order.promisedReadyAt) : 'Not set'}
          </p>
          <p
            className={`mt-2 text-sm font-medium ${order.overdue ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {order.overdue
              ? 'Overdue · update shopper'
              : (orderLabels[order.status] ?? order.status)}
          </p>
          <span className="mt-4 inline-block rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold">
            {order.deliveryType === 'PICKUP' ? 'Pickup' : 'Delivery'}
          </span>
        </div>
        <div className="min-w-0 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold">#{order.id.slice(0, 8).toUpperCase()}</h2>
            <span className="text-sm tabular-nums">${Number(order.total).toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {order.store.name} · Placed {orderTime(order.createdAt)}
          </p>
          <ul className="my-4 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="text-sm">
                <span className="mr-3 font-semibold tabular-nums">{item.quantity}×</span>
                {item.titleSnapshot}
                {item.notes && <p className="ml-7 text-xs text-muted-foreground">{item.notes}</p>}
              </li>
            ))}
          </ul>
          {order.exceptions.length > 0 && (
            <div className="rounded-lg bg-muted/60 p-3 text-sm">
              <p className="font-medium">{order.exceptions.join(' · ')}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Owner: {order.owner ?? order.store.name}
              </p>
            </div>
          )}
          {order.cancelReason && <p className="mt-3 text-sm">Canceled: {order.cancelReason}</p>}
          {order.refundState !== 'NONE' && (
            <p className="mt-3 text-sm">
              Refund: {order.refundState.toLowerCase()}
              {order.refundError ? ' · Needs review' : ''}
            </p>
          )}
          {order.canAdjustEstimate && (
            <button
              className="mt-3 text-sm font-semibold text-primary underline underline-offset-4"
              onClick={() => setEstimateOpen(!estimateOpen)}
            >
              Adjust ready time
            </button>
          )}
          {estimateOpen && (
            <div className="mt-3 space-y-3">
              {prepControl}
              <Button
                size="small"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({})}
              >
                Update shopper’s ready time
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-3 border-t border-border p-5 lg:border-l lg:border-t-0">
          {primary?.requiresPrepMinutes && prepControl}
          {primary?.status === 'COMPLETED' && (
            <label className="block text-sm font-medium">
              Shopper’s collection code
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 tracking-widest"
              />
            </label>
          )}
          {primary && (
            <Button
              className="w-full"
              disabled={mutation.isPending || (primary.status === 'COMPLETED' && code.length !== 6)}
              onClick={() => mutation.mutate({ status: primary.status })}
            >
              {mutation.isPending ? 'Saving…' : primary.label}
            </Button>
          )}
          {order.canRecoverRefund && ['PENDING', 'FAILED'].includes(order.refundState) && (
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ retryRefund: true })}
            >
              Retry refund recovery
            </Button>
          )}
          {order.allowedActions.some((action) => action.status === 'CANCELED') && (
            <button
              className="text-sm text-muted-foreground underline underline-offset-4"
              onClick={() => setCancelOpen(!cancelOpen)}
            >
              Cancel order
            </button>
          )}
          {cancelOpen && (
            <div className="space-y-3">
              <label className="block text-sm">
                Reason for cancellation
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background p-2"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Paid orders enter refund recovery automatically.
              </p>
              <Button
                variant="outline"
                disabled={mutation.isPending || !reason.trim()}
                onClick={() => mutation.mutate({ status: 'CANCELED' })}
              >
                Confirm cancellation
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function OrderProcessingSettings({ storeId }: { storeId: string }) {
  const query = useQuery({
    queryKey: ['order-processing', storeId],
    queryFn: () =>
      orderRequest<{
        autoAcceptOrders: boolean
        prepTimeMin: number
        acceptanceTimeoutMin: number
      }>(`/stores/${storeId}/order-processing`),
  })
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: {
      autoAcceptOrders: boolean
      prepTimeMin: number
      acceptanceTimeoutMin: number
    }) =>
      orderRequest(`/stores/${storeId}/order-processing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['order-processing', storeId] })
    },
  })
  if (!query.data)
    return (
      <p role="status">
        {query.isError ? 'Could not load acceptance settings.' : 'Loading settings…'}
      </p>
    )
  return (
    <form
      key={query.dataUpdatedAt}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        mutation.mutate({
          autoAcceptOrders: data.get('auto') === 'on',
          prepTimeMin: Number(data.get('prep')),
          acceptanceTimeoutMin: Number(data.get('timeout')),
        })
      }}
      className="space-y-4 rounded-xl border border-border bg-muted/30 p-5"
    >
      <h2 className="font-semibold">Acceptance settings</h2>
      <p className="text-sm text-muted-foreground">
        These settings work even when this screen is closed. Unaccepted orders are canceled after
        the acceptance window; paid orders enter refund recovery.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input name="auto" type="checkbox" defaultChecked={query.data.autoAcceptOrders} />
        Automatically accept orders with the preparation time below
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Preparation minutes
          <input
            className="ml-3 w-20 rounded border border-border bg-background p-2"
            name="prep"
            type="number"
            min="1"
            max="240"
            defaultValue={query.data.prepTimeMin}
          />
        </label>
        <label className="text-sm">
          Acceptance window (minutes)
          <input
            className="ml-3 w-20 rounded border border-border bg-background p-2"
            name="timeout"
            type="number"
            min="2"
            max="30"
            defaultValue={query.data.acceptanceTimeoutMin}
          />
        </label>
      </div>
      <Button size="small" type="submit" disabled={mutation.isPending}>
        Save settings
      </Button>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="text-sm">
          Settings saved.
        </p>
      )}
    </form>
  )
}
