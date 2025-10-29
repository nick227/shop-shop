/**
 * OrderCountWidget - Persistent order count badge for vendor pages;
 * CRITICAL: Always visible, shows pending orders, links to orders page;
 */
import { useNavigate } from 'react-router-dom'
import { usePendingOrderCount } from '@shared/hooks/vendor/useVendorOrders'
import { Button, Badge } from '@shared/ui/primitives'
import { styles } from '@shared/lib/tailwind-classes'

export function OrderCountWidget() {
  const navigate = useNavigate()
  const { data: pendingCount, isLoading } = usePendingOrderCount()

  const handleClick = () => {
    navigate('/vendor/orders')
  }

  if (isLoading) {
    return (
      <div className={styles.widget}>
        <Button variant="ghost" size="small" onClick={handleClick}>
          📋 Orders;
        </Button>
      </div>
    )
  }

  const hasPending = pendingCount && pendingCount > 0;
  return (
    <div className={styles.widget}>
      <Button
        variant={hasPending ? 'primary' : 'ghost'}
        size="small"
        onClick={handleClick}
        className={hasPending ? styles.widgetActive : ''}
      >
        <span className={styles.widgetIcon}>📋</span>
        <span>Orders</span>
        {hasPending && (
          <Badge variant="destructive" className={styles.widgetBadge}>
            {pendingCount > 99 ? '99+' : pendingCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}

