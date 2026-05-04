/**
 * Order Status Badge Component
 * 
 * Extracted status badge with proper styling and variant mapping.
 */

import { Badge } from '@shared/ui/primitives'
import { getStatusBadgeVariant } from '../../utils/orderUtils'

interface OrderStatusBadgeProps {
  status: string
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const variant = getStatusBadgeVariant(status)
  
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}
