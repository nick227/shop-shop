import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@stores/authStore'
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  Clock,
  UserCheck,
  Truck,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Spinner, Alert, Button, Badge } from '@shared/ui/primitives'
import { formatCurrency } from '@shared/lib/utils/format'
import { toast } from 'sonner'

function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
}

interface AdminStats {
  totalUsers: number
  totalStores: number
  ordersToday: number
  revenueToday: number
  pendingVendorApplications: number
  pendingAffiliateApplications: number
  activeDeliveries: number
}

interface FinanceOverview {
  payments: {
    ordersToday: number
    paidOrdersToday: number
    failedPaymentsToday: number
    failureRate: number
    stuckPendingPayment: number
  }
  stripe: { missingStripeStores: number; onboardingIncompleteStores: number }
  payouts: { pendingVendorPayouts: number; pendingVendorPayoutCents: number }
  revenue: { platformFeesTodayCents: number }
  alerts: Array<{ type: string; severity: 'info' | 'warning' | 'critical'; label: string; value: string | number }>
}

interface StatTileProps {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
  alert?: boolean
}

function StatTile({ label, value, icon: Icon, accent = 'text-primary', alert }: StatTileProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-5 ${alert ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'}`}
    >
      <div className={`rounded-lg bg-muted p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`text-2xl font-bold tabular-nums ${alert ? 'text-destructive' : ''}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

interface StoreData {
  id: string
  name: string
  slug: string
  description?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  isPublished: boolean
  addressCity?: string
  addressState?: string
  addressZip?: string
  phone?: string
  email?: string
  createdAt: string
  owner: {
    id: string
    email: string
    name?: string
  }
  _count: {
    items: number
    orders: number
  }
}

interface AdminStoresResponse {
  data: StoreData[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface ConfirmBulkDeleteDialogProps {
  selectedStores: StoreData[]
  onConfirm: (reason?: string) => void
  onCancel: () => void
  isDeleting: boolean
}

function ConfirmBulkDeleteDialog({ 
  selectedStores, 
  onConfirm, 
  onCancel, 
  isDeleting 
}: ConfirmBulkDeleteDialogProps) {
  const [reason, setReason] = useState('')

  const hasOrders = selectedStores.some(store => store._count.orders > 0)
  const totalItems = selectedStores.reduce((sum, store) => sum + store._count.items, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Confirm Bulk Delete</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You are about to delete {selectedStores.length} store(s). This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Store list preview */}
        <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2">
          {selectedStores.slice(0, 5).map(store => (
            <div key={store.id} className="text-xs py-1 border-b border-border/50 last:border-b-0">
              <div className="font-medium">{store.name}</div>
              <div className="text-muted-foreground">
                {store.owner.email} • {store._count.items} items • {store._count.orders} orders
              </div>
            </div>
          ))}
          {selectedStores.length > 5 && (
            <div className="text-xs text-muted-foreground py-1 text-center">
              ... and {selectedStores.length - 5} more
            </div>
          )}
        </div>

        {/* Warnings */}
        {hasOrders && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-xs text-destructive font-medium">
              ⚠️ Cannot delete stores with existing orders
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Some selected stores have orders and cannot be deleted.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-muted/50 rounded-md p-3">
          <div className="text-xs space-y-1">
            <div>• {selectedStores.length} stores will be permanently deleted</div>
            <div>• {totalItems} items will be removed</div>
            <div>• Store owners will lose access to their stores</div>
          </div>
        </div>

        {/* Reason input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Reason for deletion (optional, for audit log)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for bulk deletion..."
            rows={2}
            className="w-full mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            variant="outline" 
            size="small" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="small"
            disabled={isDeleting || hasOrders}
            onClick={() => onConfirm(reason || undefined)}
          >
            {isDeleting ? 'Deleting...' : `Delete ${selectedStores.length} Stores`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{children}</h2>
  )
}

const ALERT_ROUTES: Record<string, string> = {
  payment_failure_rate: '/admin/finance',
  stuck_payments: '/admin/orders',
  missing_stripe: '/admin/finance',
  delayed_payouts: '/admin/affiliate-payouts',
}

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}` }

  // Stores management state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/stats`, { headers })
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
  })

  const { data: finance, isLoading: financeLoading } = useQuery<FinanceOverview>({
    queryKey: ['admin-finance-overview'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/finance/overview`, { headers })
      if (!res.ok) throw new Error('Failed to load finance overview')
      return res.json()
    },
  })

  // Stores data fetching
  const { data: storesData, isLoading: storesLoading } = useQuery<AdminStoresResponse>({
    queryKey: ['admin-stores', 'dashboard', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      params.set('limit', '10') // Show fewer stores on dashboard
      
      const res = await fetch(`${apiBase}/api/admin/stores?${params}`, { headers })
      if (!res.ok) throw new Error('Failed to load stores')
      return res.json()
    },
    enabled: Boolean(token),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ storeIds, reason }: { storeIds: string[]; reason?: string }) => {
      const res = await fetch(`${apiBase}/api/admin/stores/bulk`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeIds, reason }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete stores')
      }
      return res.json()
    },
    onSuccess: (result, { storeIds }) => {
      toast.success(`Successfully deleted ${result.deletedCount} stores`)
      setSelectedStoreIds(new Set())
      setShowBulkDeleteDialog(false)
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }) // Refresh stats
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setShowBulkDeleteDialog(false)
    },
  })

  const isLoading = statsLoading || financeLoading || storesLoading
  const stores = storesData?.data ?? []
  const selectedStores = stores.filter(store => selectedStoreIds.has(store.id))

  const handleSelectAll = () => {
    if (selectedStoreIds.size === stores.length) {
      setSelectedStoreIds(new Set())
    } else {
      setSelectedStoreIds(new Set(stores.map(s => s.id)))
    }
  }

  const handleSelectStore = (storeId: string) => {
    const newSelection = new Set(selectedStoreIds)
    if (newSelection.has(storeId)) {
      newSelection.delete(storeId)
    } else {
      newSelection.add(storeId)
    }
    setSelectedStoreIds(newSelection)
  }

  const handleBulkDelete = (reason?: string) => {
    bulkDeleteMutation.mutate({ 
      storeIds: Array.from(selectedStoreIds), 
      reason 
    })
  }

  const criticalAlerts = finance?.alerts.filter((a) => a.severity === 'critical') ?? []
  const warningAlerts = finance?.alerts.filter((a) => a.severity === 'warning') ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {showBulkDeleteDialog && (
        <ConfirmBulkDeleteDialog
          selectedStores={selectedStores}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteDialog(false)}
          isDeleting={bulkDeleteMutation.isPending}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform control center</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : (
        <>
          {/* Active Alerts */}
          {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
            <div className="space-y-2">
              {criticalAlerts.map((a) => (
                <div
                  key={a.type}
                  onClick={() => ALERT_ROUTES[a.type] && navigate(ALERT_ROUTES[a.type])}
                  className={ALERT_ROUTES[a.type] ? 'cursor-pointer' : undefined}
                >
                  <Alert variant="error">
                    <span className="font-semibold">{a.label}:</span> {a.value}
                    {ALERT_ROUTES[a.type] && <span className="ml-2 underline text-xs">View →</span>}
                  </Alert>
                </div>
              ))}
              {warningAlerts.map((a) => (
                <div
                  key={a.type}
                  onClick={() => ALERT_ROUTES[a.type] && navigate(ALERT_ROUTES[a.type])}
                  className={ALERT_ROUTES[a.type] ? 'cursor-pointer' : undefined}
                >
                  <Alert variant="warning">
                    <span className="font-semibold">{a.label}:</span> {a.value}
                    {ALERT_ROUTES[a.type] && <span className="ml-2 underline text-xs">View →</span>}
                  </Alert>
                </div>
              ))}
            </div>
          )}

          {/* Operations */}
          <div className="space-y-3">
            <SectionHeading>Operations</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
              <StatTile label="Active Stores" value={stats?.totalStores ?? 0} icon={Store} />
              <StatTile label="Orders Today" value={stats?.ordersToday ?? 0} icon={ShoppingBag} />
              <StatTile
                label="Revenue Today"
                value={formatCurrency(stats?.revenueToday ?? 0)}
                icon={DollarSign}
                accent="text-green-600"
              />
              <StatTile
                label="Pending Vendor Applications"
                value={stats?.pendingVendorApplications ?? 0}
                icon={Clock}
                accent="text-yellow-600"
                alert={(stats?.pendingVendorApplications ?? 0) > 0}
              />
              <StatTile
                label="Pending Affiliate Applications"
                value={stats?.pendingAffiliateApplications ?? 0}
                icon={UserCheck}
                accent="text-blue-600"
              />
            </div>
          </div>

          {/* Finance Health */}
          <div className="space-y-3">
            <SectionHeading>Finance Health</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile
                label="Canceled / Unpaid Orders"
                value={`${(finance?.payments.failureRate ?? 0).toFixed(1)}%`}
                icon={AlertTriangle}
                accent={(finance?.payments.failureRate ?? 0) > 5 ? 'text-red-600' : 'text-green-600'}
                alert={(finance?.payments.failureRate ?? 0) > 5}
              />
              <StatTile
                label="Stores Missing Stripe"
                value={finance?.stripe.missingStripeStores ?? 0}
                icon={CreditCard}
                accent={(finance?.stripe.missingStripeStores ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}
                alert={(finance?.stripe.missingStripeStores ?? 0) > 0}
              />
              <StatTile
                label="Stuck Payments"
                value={finance?.payments.stuckPendingPayment ?? 0}
                icon={Clock}
                accent={(finance?.payments.stuckPendingPayment ?? 0) > 0 ? 'text-yellow-600' : 'text-green-600'}
                alert={(finance?.payments.stuckPendingPayment ?? 0) > 0}
              />
              <StatTile
                label="Platform Fees Today"
                value={formatCurrency((finance?.revenue.platformFeesTodayCents ?? 0) / 100)}
                icon={TrendingUp}
                accent="text-green-600"
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="space-y-3">
            <SectionHeading>Delivery</SectionHeading>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatTile
                label="Active Deliveries"
                value={stats?.activeDeliveries ?? 0}
                icon={Truck}
                accent="text-blue-600"
              />
            </div>
          </div>

          {/* Stores Management */}
          <div className="space-y-4">
            <SectionHeading>Stores Management</SectionHeading>
            
            {/* Stores Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="h-9 w-64 rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {stores.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {selectedStoreIds.size === stores.length ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {selectedStoreIds.size === stores.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              )}

              {selectedStoreIds.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">
                    {selectedStoreIds.size} selected
                  </span>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>

            {/* Stores Table */}
            <div className="overflow-hidden rounded-xl border border-border">
              {storesLoading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Spinner size="large" />
                </div>
              ) : stores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Store className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No stores found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase text-muted-foreground">
                      <th className="px-4 py-3 w-12"></th>
                      <th className="px-4 py-3">Store</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Owner</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 hidden md:table-cell">Items</th>
                      <th className="px-4 py-3 hidden md:table-cell">Orders</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Location</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stores.map((store) => (
                      <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSelectStore(store.id)}
                            className="flex items-center justify-center"
                          >
                            {selectedStoreIds.has(store.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium">{store.name}</div>
                            <div className="text-sm text-muted-foreground">{store.slug}</div>
                            {store.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {store.description}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div>
                            <div className="text-sm font-medium">{store.owner.name || store.owner.email}</div>
                            <div className="text-xs text-muted-foreground">{store.owner.email}</div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant={store.status === 'ACTIVE' ? 'success' : store.status === 'SUSPENDED' ? 'destructive' : 'secondary'}
                            >
                              {store.status}
                            </Badge>
                            {store.isPublished && (
                              <Badge variant="outline" className="text-xs">Published</Badge>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 hidden md:table-cell text-sm">
                          {store._count.items}
                        </td>
                        
                        <td className="px-4 py-3 hidden md:table-cell text-sm">
                          {store._count.orders}
                        </td>
                        
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                          {store.addressCity && (
                            <>
                              {store.addressCity}
                              {store.addressState && `, ${store.addressState}`}
                            </>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <Button 
                            size="small" 
                            variant="outline" 
                            onClick={() => navigate(`/admin/stores/${store.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Stores Pagination */}
            {storesData?.pagination && storesData.pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Page {storesData.pagination.page} of {storesData.pagination.pages} · {storesData.pagination.total} stores
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="small" 
                    variant="outline" 
                    disabled={!storesData.pagination.hasPrev} 
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="small" 
                    variant="outline" 
                    disabled={!storesData.pagination.hasNext} 
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
