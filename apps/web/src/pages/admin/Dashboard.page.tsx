import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { Users, Store, ShoppingBag, DollarSign, Clock, UserCheck } from 'lucide-react'
import { Spinner } from '@shared/ui/primitives'

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
}

interface StatTileProps {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
}

function StatTile({ label, value, icon: Icon, accent = 'text-primary' }: StatTileProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
      <div className={`rounded-lg bg-muted p-3 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const token = useAuthStore((s) => s.token)
  const apiBase = getApiBase()

  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load stats')
      return res.json()
    },
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview</p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner size="large" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Total Users" value={data?.totalUsers ?? 0} icon={Users} />
          <StatTile label="Active Stores" value={data?.totalStores ?? 0} icon={Store} />
          <StatTile label="Orders Today" value={data?.ordersToday ?? 0} icon={ShoppingBag} />
          <StatTile
            label="Revenue Today"
            value={`$${((data?.revenueToday ?? 0) / 100).toFixed(2)}`}
            icon={DollarSign}
            accent="text-green-600"
          />
          <StatTile
            label="Pending Vendor Applications"
            value={data?.pendingVendorApplications ?? 0}
            icon={Clock}
            accent="text-yellow-600"
          />
          <StatTile
            label="Pending Affiliate Applications"
            value={data?.pendingAffiliateApplications ?? 0}
            icon={UserCheck}
            accent="text-blue-600"
          />
        </div>
      )}
    </div>
  )
}
