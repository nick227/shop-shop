import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { Spinner, Badge } from '@shared/ui/primitives'
import { ArrowLeft, MapPin, Truck, CreditCard, User, Store, PackageX } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fmt(n: unknown) {
  return '$' + Number(n ?? 0).toFixed(2)
}

function fmtDate(s: string | null | undefined) {
  return s ? new Date(s).toLocaleString() : '—'
}

const ORDER_STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
  PENDING_PAYMENT: 'outline',
  PLACED: 'warning',
  ACCEPTED: 'secondary',
  PREPARING: 'secondary',
  READY: 'warning',
  OUT_FOR_DELIVERY: 'secondary',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELED: 'destructive',
}

const PAYMENT_STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'outline'> = {
  UNPAID: 'outline',
  PAID: 'success',
  REFUNDED: 'warning',
}

interface OrderItem {
  id: string
  titleSnapshot: string
  quantity: number
  unitPrice: number
  optionsJson: unknown
  notes: string | null
}

interface OrderEvent {
  id: string
  status: string
  note: string | null
  createdAt: string
}

interface AdminOrderDetail {
  id: string
  status: string
  paymentStatus: string
  deliveryMode: string
  deliveryType: string
  subtotal: number
  fees: number
  tax: number
  tip: number
  total: number
  serviceFeeAmount: number
  netToVendor: number
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  stripeRefundId: string | null
  addressSnapshot: unknown
  cancelReason: string | null
  canceledAt: string | null
  refundReason: string | null
  refundedAt: string | null
  estimatedDeliveryAt: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string; phone: string | null }
  store: { id: string; name: string; slug: string }
  assignedTo: { id: string; name: string | null; email: string } | null
  items: OrderItem[]
  events: OrderEvent[]
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const apiBase = getApiBase()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load order')
      return (res.json() as Promise<{ order: AdminOrderDetail }>).then((d) => d.order)
    },
    enabled: !!orderId,
  })

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner size="large" /></div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Order not found.</div>
  }

  const o = data
  const addr = o.addressSnapshot as Record<string, unknown> | null

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6">
      <button
        onClick={() => navigate('/admin/orders')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-lg font-bold">{o.id}</h1>
          <p className="text-sm text-muted-foreground">{fmtDate(o.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={ORDER_STATUS_COLOR[o.status] ?? 'outline'} >
            {o.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant={PAYMENT_STATUS_COLOR[o.paymentStatus] ?? 'outline'}>
            {o.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Customer */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionHeader icon={User} label="Customer" />
            <div className="space-y-1.5">
              <Row label="Name" value={o.user.name ?? '—'} />
              <Row label="Email" value={<span className="truncate max-w-[160px] block">{o.user.email}</span>} />
              <Row label="Phone" value={o.user.phone ?? '—'} />
            </div>
          </CardContent>
        </Card>

        {/* Store */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionHeader icon={Store} label="Store" />
            <div className="space-y-1.5">
              <Row label="Name" value={
                <button
                  className="hover:text-primary"
                  onClick={() => navigate(`/admin/vendors/${o.store.id}`)}
                >
                  {o.store.name}
                </button>
              } />
              <Row label="Slug" value={<span className="font-mono text-xs">/{o.store.slug}</span>} />
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionHeader icon={CreditCard} label="Financials" />
            <div className="space-y-1.5">
              <Row label="Subtotal" value={fmt(o.subtotal)} />
              <Row label="Fees" value={fmt(o.fees)} />
              <Row label="Tax" value={fmt(o.tax)} />
              <Row label="Tip" value={fmt(o.tip)} />
              <Row label="Total" value={<span className="font-bold">{fmt(o.total)}</span>} />
              <div className="border-t border-border pt-1.5 mt-1">
                <Row label="Service fee" value={fmt(o.serviceFeeAmount)} />
                <Row label="Net to vendor" value={fmt(o.netToVendor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <SectionHeader icon={Truck} label="Delivery" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Row label="Mode" value={o.deliveryMode.replace(/_/g, ' ')} />
              <Row label="Type" value={o.deliveryType} />
              {o.estimatedDeliveryAt && (
                <Row label="Est. delivery" value={fmtDate(o.estimatedDeliveryAt)} />
              )}
              {o.assignedTo && (
                <Row label="Driver" value={o.assignedTo.name ?? o.assignedTo.email} />
              )}
            </div>
            {addr && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Delivery address
                </div>
                <div className="text-sm">
                  {[addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
          </div>
          {o.stripePaymentIntentId && (
            <div className="border-t border-border pt-3 space-y-1.5">
              <Row label="Payment intent" value={<span className="font-mono text-xs">{o.stripePaymentIntentId}</span>} />
              {o.stripeChargeId && (
                <Row label="Charge ID" value={<span className="font-mono text-xs">{o.stripeChargeId}</span>} />
              )}
              {o.stripeRefundId && (
                <Row label="Refund ID" value={<span className="font-mono text-xs">{o.stripeRefundId}</span>} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancellation / Refund */}
      {(o.canceledAt || o.refundedAt) && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <SectionHeader icon={PackageX} label="Cancellation / Refund" />
            <div className="space-y-1.5">
              {o.canceledAt && (
                <>
                  <Row label="Canceled at" value={fmtDate(o.canceledAt)} />
                  {o.cancelReason && <Row label="Cancel reason" value={o.cancelReason} />}
                </>
              )}
              {o.refundedAt && (
                <>
                  <Row label="Refunded at" value={fmtDate(o.refundedAt)} />
                  {o.refundReason && <Row label="Refund reason" value={o.refundReason} />}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Line Items ({o.items.length})
          </p>
          {o.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {o.items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div>{item.titleSnapshot}</div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground">Note: {item.notes}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {fmt(Number(item.unitPrice) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event timeline */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Timeline ({o.events.length} events)
          </p>
          {o.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded.</p>
          ) : (
            <div className="relative space-y-3 pl-4 before:absolute before:left-1 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
              {o.events.map((ev) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[1.1rem] top-1 h-2 w-2 rounded-full bg-border" />
                  <div className="text-xs text-muted-foreground">{fmtDate(ev.createdAt)}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ORDER_STATUS_COLOR[ev.status] ?? 'outline'} >
                      {ev.status.replace(/_/g, ' ')}
                    </Badge>
                    {ev.note && <span className="text-sm text-muted-foreground">{ev.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
