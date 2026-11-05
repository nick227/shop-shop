/** Compatibility helpers. All transition edges come from the database package. */
import { ORDER_TRANSITIONS, canTransitionTo } from '@packages/db'
export type OrderStatus = keyof typeof ORDER_TRANSITIONS
export interface OrderStatusTransition {
  from: OrderStatus
  to: OrderStatus
  allowed: boolean
  reason?: string
  businessRule?: string
}
export interface OrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  transition?: OrderStatusTransition
}
export function validateStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  context?: {
    userId?: string
    userRole?: 'customer' | 'vendor' | 'admin'
    timestamp?: string
    orderId?: string
  }
): OrderValidationResult {
  const result = canTransitionTo(currentStatus, newStatus)
  const errors = result.valid ? [] : [result.reason!]
  if (
    context?.userRole === 'customer' &&
    (newStatus !== 'CANCELED' || !['PENDING_PAYMENT', 'PLACED'].includes(currentStatus))
  )
    errors.push('Customers may cancel only before acceptance')
  return {
    isValid: !errors.length,
    errors,
    warnings: [],
    transition: {
      from: currentStatus,
      to: newStatus,
      allowed: !errors.length,
      reason: errors.join('; ') || undefined,
    },
  }
}
export function getOrderStatusRules(status: OrderStatus) {
  return {
    description: status.toLowerCase().replaceAll('_', ' '),
    allowedTransitions: [...(ORDER_TRANSITIONS[status] ?? [])],
    businessRules: [],
    prerequisites: [],
  }
}
export function getAllStatuses(): OrderStatus[] {
  return Object.keys(ORDER_TRANSITIONS) as OrderStatus[]
}
export function getStatusTransitionPath(from: OrderStatus, to: OrderStatus): OrderStatus[] | null {
  const queue: OrderStatus[][] = [[from]]
  const visited = new Set<OrderStatus>()
  while (queue.length) {
    const path = queue.shift()!
    const current = path[path.length - 1]
    if (current === to) return path
    if (visited.has(current)) continue
    visited.add(current)
    for (const next of ORDER_TRANSITIONS[current] ?? []) queue.push([...path, next])
  }
  return null
}
