/**
 * OrderCountWidget - Persistent order count badge for vendor pages;
 * CRITICAL: Always visible, shows pending orders, links to orders page;
 */
import { useNavigate } from 'react-router-dom'
import { usePendingOrderCount } from '@shared/hooks/hooks/vendor/useVendorOrders'
import { Button, Badge } from '@shared/ui/primitives'
import { useVendorActiveStore } from '@layouts/VendorLayout/VendorActiveStoreContext'

export function OrderCountWidget() {
  const navigate = useNavigate()
  const { selectedStoreId } = useVendorActiveStore()
  const { data: pendingCount, isLoading } = usePendingOrderCount(selectedStoreId || undefined)

  const handleClick = () => {
    navigate('/vendor/orders')
  }

  if (isLoading) {
    return (
      <div className="">
        <Button variant="ghost" size="small" onClick={handleClick}>
          📋 Orders
        </Button>
      </div>
    )
  }

  const hasPending = pendingCount && pendingCount > 0
  return (
    <div className="">
      <Button variant={hasPending ? 'primary' : 'ghost'} size="small" onClick={handleClick} className="gap-2">
        <span className="">📋</span>
        <span>Orders</span>
        {hasPending && (
          <Badge variant="destructive" className="">
            {pendingCount > 99 ? '99+' : pendingCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}

