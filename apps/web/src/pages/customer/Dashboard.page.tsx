// @ts-nocheck
/**
 * CustomerDashboardPage - Customer account overview
 * Shows stats, pending orders, recent orders, and quick actions
 */

import { useNavigate } from 'react-router-dom'
import { useCustomerStats } from '@shared/hooks/hooks/customer/useCustomerStats'
import { useOrders } from '@shared/hooks/generated'
import { useCustomerRealtimeOrder } from '@shared/hooks/hooks/useCustomerRealtimeOrder'
import { useAuth } from '@shared/hooks/hooks/useAuth'
import { OrderCard } from '@features/orders/components/OrderCard'
import { Button, Spinner } from '@shared/ui/primitives'
import { Card, CardContent } from '@shared/ui/primitives/ui/Card/Card'
import { EmptyState } from '@shared/ui/primitives/ui/EmptyState/EmptyState'
import { PageContainer, SectionHeader } from '@shared/ui/layout/PageLayout'
import { formatCurrency, formatRelativeTime } from '@shared/lib/format'
import { isOrderPending, sortOrdersByDateDesc } from '@shared/lib/utils/orderHelpers'
import { ShoppingBag, MapPin, UserIcon, Truck, Package } from 'lucide-react'
import { useHaptics } from '@shared/hooks/useHaptics'

export default function CustomerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useCustomerStats()
  const { data: orders, isLoading: ordersLoading } = useOrders()
  const haptics = useHaptics()

  // Subscribe to real-time order updates
  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  if (statsLoading || ordersLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[400px]">
        <Spinner size="large" />
        <p className="mt-4 text-muted-foreground text-sm">Loading dashboard...</p>
      </PageContainer>
    )
  }

  const pendingOrders = orders?.filter(o => isOrderPending(o?.status)) || []
  const recentOrders = [...(orders || [])].sort(sortOrdersByDateDesc).slice(0, 5)

  return (
    <PageContainer>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={stats?.totalOrders || 0} label="Total Orders" />
        <StatCard value={stats?.pendingOrders || 0} label="Pending" highlight />
        <StatCard value={stats?.completedOrders || 0} label="Completed" />
        <StatCard value={formatCurrency(stats?.totalSpent || 0)} label="Total Spent" />
      </div>

      {/* Pending Orders */}
      {pendingOrders.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader
            title={`Pending Orders (${pendingOrders.length})`}
            action={
              <Button variant="ghost" size="small" onClick={() => navigate('/account/orders?filter=pending')}>
                View All
              </Button>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={(id) => navigate('/orders/' + id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders */}
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Recent Orders"
          action={
            <Button variant="ghost" size="small" onClick={() => navigate('/account/orders')}>
              View All
            </Button>
          }
        />
        {recentOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={(id) => navigate('/orders/' + id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Place your first order to get started"
            action={
              <Button variant="primary" onClick={() => navigate('/')}>
                Order Now
              </Button>
            }
          />
        )}
      </section>

      {/* Quick Actions */}
      <section className="flex flex-col gap-3">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon={ShoppingBag} label="Order Food" onClick={() => { haptics.light(); navigate('/') }} />
          <QuickAction icon={MapPin} label="My Addresses" onClick={() => { haptics.light(); navigate('/account/addresses') }} variant="secondary" />
          <QuickAction icon={UserIcon} label="My Profile" onClick={() => { haptics.light(); navigate('/account/profile') }} variant="secondary" />
          <QuickAction icon={Truck} label="My Deliveries" onClick={() => { haptics.light(); navigate('/account/deliveries') }} variant="secondary" />
        </div>
      </section>

      {/* Account Summary */}
      {stats?.lastOrderDate && (
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-sm font-semibold tracking-tight mb-4">Account Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-caption">Last Order</span>
                <span className="font-medium">{formatRelativeTime(stats?.lastOrderDate)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption">Average Order</span>
                <span className="font-medium">{formatCurrency(stats?.averageOrderValue)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-caption">Favorite Store</span>
                <span className="font-medium">—</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}

/* ── Extracted Components ── */

interface StatCardProps {
  value: string | number
  label: string
  highlight?: boolean
}

function StatCard({ value, label, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-primary/30' : undefined}>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <div className="text-2xl font-bold tracking-tight mb-0.5">{value}</div>
        <div className="text-label">{label}</div>
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

function QuickAction({ icon: Icon, label, onClick, variant = 'primary' }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-xl border transition-all active:scale-[0.97] ${
        variant === 'primary'
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-card-foreground border-border hover:border-primary/30'
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={1.75} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
