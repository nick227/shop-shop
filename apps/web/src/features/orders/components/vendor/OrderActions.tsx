/**
 * Order Actions Component
 * 
 * Extracted action buttons with status-specific logic.
 */

import { Button } from '@shared/ui/primitives'
import { isOrderActive, getActionButtonConfig } from '../../utils/orderUtils'

interface OrderActionsProps {
  status: string
  isDelivery: boolean
  onStatusUpdate: (orderId: string, newStatus: string) => void
  orderId: string
  className?: string
}

export function OrderActions({ 
  status, 
  isDelivery, 
  onStatusUpdate, 
  orderId, 
  className 
}: OrderActionsProps) {
  if (!isOrderActive(status)) return null
  
  const actionConfig = getActionButtonConfig(status, isDelivery)
  if (!actionConfig) return null
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStatusUpdate(orderId, actionConfig.nextStatus)
  }
  
  return (
    <div className={`flex gap-2 mt-4 pt-4 border-t border-gray-200 ${className}`}>
      <Button
        size="small"
        variant="primary"
        onClick={handleClick}
        className="flex-1"
        data-testid={`${status.toLowerCase().replace('_', '-')}-btn`}
        data-order-id={orderId}
      >
        {actionConfig.icon} {actionConfig.label}
      </Button>
    </div>
  )
}
