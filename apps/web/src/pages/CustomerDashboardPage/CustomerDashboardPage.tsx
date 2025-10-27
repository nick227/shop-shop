/**
 * CustomerDashboardPage - Customer account overview
 * Shows stats, pending orders, recent orders, and quick actions
 */

import { useNavigate } from 'react-router-dom'
import { useCustomerStats } from '@hooks/customer/useCustomerStats'
import { useOrders } from '@hooks/generated'
import { useCustomerRealtimeOrder } from '@hooks/useCustomerRealtimeOrder'
import { useAuth } from '@hooks/useAuth'
import { OrderCard } from '../../features/orders/components/OrderCard'
import { Button, Spinner, Card } from '@ui'
import { formatCurrency, formatRelativeTime } from '@utils/format'
import { isOrderPending, sortOrdersByDateDesc } from '@utils/orderHelpers'
import { styles } from '@utils/tailwind-classes'

export default function CustomerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats, isLoading: statsLoading } = useCustomerStats()
  const { data: orders, isLoading: ordersLoading } = useOrders()

  // Subscribe to real-time order updates
  useCustomerRealtimeOrder({
    userId: user?.id,
    enableToast: true,
  } as any)

  if (statsLoading || ordersLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="large" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  // Filter pending orders (using consolidated helper)
  const pendingOrders = orders?.filter(o => isOrderPending(o?.status)) || []

  // Get 5 most recent orders (using consolidated helper)
  const recentOrders = [...(orders || [])]
    .sort(sortOrdersByDateDesc)
    .slice(0, 5)

  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statValue}>{stats?.totalOrders || 0}</div>
          <div className={styles.statLabel}>Total Orders</div>
        </Card>

        <Card className={`${styles.statCard} ${styles.statCardPending}`}>
          <div className={styles.statIcon}>🔴</div>
          <div className={styles.statValue}>{stats?.pendingOrders || 0}</div>
          <div className={styles.statLabel}>Pending</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statValue}>{stats?.completedOrders || 0}</div>
          <div className={styles.statLabel}>Completed</div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statValue}>{formatCurrency(stats?.totalSpent || 0)}</div>
          <div className={styles.statLabel}>Total Spent</div>
        </Card>
      </div>

      {/* Pending Orders Section */}
      {pendingOrders.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.liveDot}>🔴</span>
              Pending Orders ({pendingOrders.length})
            </h2>
            <Button 
              variant="ghost" 
              size="small"
              onClick={() => navigate('/account/orders?filter=pending')}
            >
              View All →
            </Button>
          </div>
          <div className={styles.ordersList}>
            {pendingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={(id) => navigate('/orders/' + id + '')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Orders Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <Button 
            variant="ghost" 
            size="small"
            onClick={() => navigate('/account/orders')}
          >
            View All →
          </Button>
        </div>
        {recentOrders.length > 0 ? (
          <div className={styles.ordersList}>
            {recentOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onClick={(id) => navigate('/orders/' + id + '')}
              />
            ))}
          </div>
        ) : (
          <Card className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <p className={styles.emptyText}>No orders yet</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Order Now
            </Button>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Button 
            variant="primary" 
            size="large"
            onClick={() => navigate('/')}
            className={styles.actionButton}
          >
            <span className={styles.actionIcon}>🍔</span>
            <span className={styles.actionLabel}>Order Food</span>
          </Button>

          <Button 
            variant="secondary" 
            size="large"
            onClick={() => navigate('/account/addresses')}
            className={styles.actionButton}
          >
            <span className={styles.actionIcon}>📍</span>
            <span className={styles.actionLabel}>My Addresses</span>
          </Button>

          <Button 
            variant="secondary" 
            size="large"
            onClick={() => navigate('/account/profile')}
            className={styles.actionButton}
          >
            <span className={styles.actionIcon}>👤</span>
            <span className={styles.actionLabel}>My Profile</span>
          </Button>

          <Button 
            variant="secondary" 
            size="large"
            onClick={() => navigate('/account/deliveries')}
            className={styles.actionButton}
          >
            <span className={styles.actionIcon}>🚗</span>
            <span className={styles.actionLabel}>My Deliveries</span>
          </Button>
        </div>
      </section>

      {/* Account Summary */}
      {stats?.lastOrderDate && (
        <section className={styles.section}>
          <Card className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Account Summary</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Last Order</span>
                <span className={styles.summaryValue}>
                  {formatRelativeTime(stats?.lastOrderDate)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Average Order</span>
                <span className={styles.summaryValue}>
                  {formatCurrency(stats?.averageOrderValue)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Favorite Store</span>
                <span className={styles.summaryValue}>-</span>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

