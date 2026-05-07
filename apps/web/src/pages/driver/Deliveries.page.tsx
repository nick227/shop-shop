import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@shared/ui/layout/PageLayout'
import { PageShell } from '@shared/ui/layout/PageShell'
import { Button, Spinner, Badge } from '@shared/ui/primitives'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/primitives/ui/Card/Card'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { toast } from 'sonner'
import { Truck } from 'lucide-react'
import { useUpdateOrderStatus } from '@shared/hooks/hooks/vendor/useUpdateOrderStatus'
import type { OrderResponse } from '@api/types'
import { useAuthStore } from '@stores/authStore'
import { useDriverDeliveries } from '@shared/hooks/hooks/driver/useDriverDeliveries'

type DriverOrder = Pick<
  OrderResponse,
  'id' | 'status' | 'storeId' | 'deliveryType' | 'addressSnapshot' | 'createdAt'
>

function isDriverActiveDelivery(order: DriverOrder): boolean {
  if (order.deliveryType !== 'DELIVERY') return false
  return order.status === 'READY' || order.status === 'OUT_FOR_DELIVERY'
}

function actionForStatus(status: string) {
  if (status === 'READY') return { label: 'Confirm pickup', next: 'OUT_FOR_DELIVERY' as const }
  if (status === 'OUT_FOR_DELIVERY') return { label: 'Mark delivered', next: 'DELIVERED' as const }
  return null
}

function getDeliveryModeDisplay(order: DriverOrder) {
  // This would come from order.deliveryMode when backend is updated
  // For now, infer from context
  return 'Platform Driver' // Default for current implementation
}

function OrderCardRow({
  order,
  onSelect,
  onAction,
  isBusy,
}: Readonly<{
  order: DriverOrder
  onSelect: () => void
  onAction: (nextStatus: 'OUT_FOR_DELIVERY' | 'DELIVERED') => void
  isBusy: boolean
}>) {
  const action = actionForStatus(order.status)
  const addressLine1 = (order.addressSnapshot as any)?.line1 as string | undefined

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground truncate">
            {addressLine1 ?? 'Delivery address'}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {getDeliveryModeDisplay(order)}
            </Badge>
          </div>
        </div>
        <Badge variant={order.status === 'READY' ? 'success' : 'default'}>
          {order.status === 'OUT_FOR_DELIVERY' ? 'Out for delivery' : order.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSelect}>
          Details
        </Button>
        {action && (
          <Button
            variant="primary"
            className="flex-1"
            disabled={isBusy}
            onClick={() => onAction(action.next)}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function DeliveryDetailsDrawer({
  order,
  onClose,
  onAction,
  isBusy,
}: Readonly<{
  order: DriverOrder
  onClose: () => void
  onAction: (nextStatus: 'OUT_FOR_DELIVERY' | 'DELIVERED') => void
  isBusy: boolean
}>) {
  const action = actionForStatus(order.status)
  const a = order.addressSnapshot as any

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="relative w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl">
        <CardHeader className="border-b border-border/50 p-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</CardTitle>
            <div className="mt-1 text-xs text-muted-foreground">{order.status}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">✕</Button>
        </CardHeader>
        <CardContent className="p-5 space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dropoff</div>
            <div className="text-sm">
              <div className="font-medium">{a?.line1 ?? '—'}</div>
              {a?.line2 ? <div>{a.line2}</div> : null}
              <div className="text-muted-foreground">
                {a?.city ?? ''}{a?.city ? ', ' : ''}{a?.state ?? ''} {a?.postalCode ?? ''}
              </div>
            </div>
          </div>
        </CardContent>
        <div className="p-5 border-t border-border/50 bg-muted/10 flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
            Close
          </Button>
          {action && (
            <Button
              variant="primary"
              className="flex-1 h-11"
              disabled={isBusy}
              onClick={() => onAction(action.next)}
            >
              {action.label}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function DriverDeliveriesPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: orders, isLoading } = useDriverDeliveries()
  const updateStatus = useUpdateOrderStatus()
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  if (user && user.role !== 'RIDER') {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-5 py-6 md:py-6">
        <PageHeader title="Driver Deliveries" description="Deliveries assigned to you" />
        <EmptyState
          icon={Truck}
          title="Not available"
          description="This page is only available to driver accounts."
          action={<Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>}
        />
      </PageShell>
    )
  }

  const activeDeliveries = useMemo(() => {
    // Server enforces scope; this is only UX shaping/defensive.
    return (orders ?? []).filter(isDriverActiveDelivery) as DriverOrder[]
  }, [orders])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return activeDeliveries.find((o) => o.id === selectedOrderId) ?? null
  }, [activeDeliveries, selectedOrderId])

  const isBusy = updateStatus.isPending

  const handleAction = (orderId: string, nextStatus: 'OUT_FOR_DELIVERY' | 'DELIVERED') => {
    updateStatus.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => {
          if (nextStatus === 'DELIVERED') {
            setSelectedOrderId(null)
            toast.success('Delivery marked delivered')
          }
        },
      } as any,
    )
  }

  if (isLoading) {
    return (
      <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="py-6 md:py-6">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card p-4">
          <Spinner size="large" />
          <p className="mt-4 text-muted-foreground text-sm">Loading deliveries...</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell nested className="bg-background" containerClassName="max-w-4xl" contentClassName="space-y-5 py-6 md:py-6">
      <PageHeader title="Driver Deliveries" description="Deliveries assigned to you" />

      {activeDeliveries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No assigned deliveries"
          description="When a vendor assigns you a delivery, it will appear here."
          action={<Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {activeDeliveries.map((order) => (
            <OrderCardRow
              key={order.id}
              order={order}
              isBusy={isBusy}
              onSelect={() => setSelectedOrderId(order.id)}
              onAction={(next) => handleAction(order.id, next)}
            />
          ))}
        </div>
      )}

      {selectedOrder && (
        <DeliveryDetailsDrawer
          order={selectedOrder}
          isBusy={isBusy}
          onClose={() => setSelectedOrderId(null)}
          onAction={(next) => handleAction(selectedOrder.id, next)}
        />
      )}
    </PageShell>
  )
}

