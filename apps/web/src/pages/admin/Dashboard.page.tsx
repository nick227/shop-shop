import { useQuery } from '@tanstack/react-query'
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
} from 'lucide-react'
import { Spinner, Alert } from '@shared/ui/primitives'
import { formatCurrency } from '@shared/lib/utils/format'

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
  const apiBase = getApiBase()
  const headers = { Authorization: `Bearer ${token}` }

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

  const isLoading = statsLoading || financeLoading

  const criticalAlerts = finance?.alerts.filter((a) => a.severity === 'critical') ?? []
  const warningAlerts = finance?.alerts.filter((a) => a.severity === 'warning') ?? []

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
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
        </>
      )}
    </div>
  )
}
