import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Badge, Spinner, Button } from '@shared/ui/primitives'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { ShoppingBag } from 'lucide-react'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

function fmt(n: unknown) {
  return '$' + Number(n ?? 0).toFixed(2)
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString()
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

interface AdminOrder {
  id: string
  status: string
  paymentStatus: string
  deliveryMode: string
  total: number
  createdAt: string
  user: { id: string; name: string | null; email: string }
  store: { id: string; name: string }
  _count: { items: number }
}

export default function AdminOrdersPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const apiBase = getApiBase()

  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, paymentFilter, search, from, to, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) params.set('status', statusFilter)
      if (paymentFilter) params.set('paymentStatus', paymentFilter)
      if (search) params.set('search', search)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      const res = await fetch(`${apiBase}/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load orders')
      return res.json() as Promise<{ orders: AdminOrder[]; total: number; pages: number }>
    },
  })

  const orders = data?.orders ?? []

  function resetFilters() {
    setStatusFilter('')
    setPaymentFilter('')
    setSearch('')
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">All orders across the platform.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search by order ID or customer…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="h-9 w-60 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="PLACED">Placed</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELED">Canceled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          title="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(1) }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          title="To date"
        />
        {(statusFilter || paymentFilter || search || from || to) && (
          <Button size="small" variant="outline" onClick={resetFilters}>
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" description="Try adjusting your filters." />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Store</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Payment</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Mode</th>
                  <th className="px-4 py-3 tabular-nums">Total</th>
                  <th className="px-4 py-3 hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</div>
                      <div className="text-xs text-muted-foreground">{o._count.items} item{o._count.items !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.user.name ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{o.user.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div
                        className="cursor-pointer hover:text-primary font-medium"
                        onClick={() => navigate(`/admin/vendors/${o.store.id}`)}
                      >
                        {o.store.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ORDER_STATUS_COLOR[o.status] ?? 'outline'}>
                        {o.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant={PAYMENT_STATUS_COLOR[o.paymentStatus] ?? 'outline'}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {o.deliveryMode.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{fmt(o.total)}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {data?.pages} · {data?.total} total
              </span>
              <div className="flex gap-2">
                <Button size="small" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Previous
                </Button>
                <Button size="small" variant="outline" disabled={page === data?.pages} onClick={() => setPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
