/**
 * Order Helper Functions
 * Consolidated utilities to eliminate code duplication
 */

/**
 * Order status categories for filtering and grouping
 */
export const ORDER_STATUS_GROUPS = {
  PENDING: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'] as const,
  FINAL: ['COMPLETED', 'CANCELED'] as const,
  ACTIVE: ['PLACED', 'ACCEPTED', 'PREPARING'] as const,
} as const

/**
 * Check if order is pending (not completed/canceled)
 */
export function isOrderPending(status: string): boolean {
  return ORDER_STATUS_GROUPS.PENDING.includes(status as any)
}

/**
 * Check if order is active (needs vendor action)
 */
export function isOrderActive(status: string): boolean {
  return ORDER_STATUS_GROUPS.ACTIVE.includes(status as any)
}

/**
 * Sort comparator for orders by creation date (newest first)
 * Replaces: new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
 */
export function sortOrdersByDateDesc<T extends { createdAt: string | Date }>(a: T, b: T): number {
  const aTime = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime()
  const bTime = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime()
  return bTime - aTime
}

/**
 * Sort comparator for orders by creation date (oldest first)
 */
export function sortOrdersByDateAsc<T extends { createdAt: string | Date }>(a: T, b: T): number {
  return -sortOrdersByDateDesc(a, b)
}

/**
 * Get order age in human-readable format
 * Returns both display string and raw minutes
 */
export interface OrderAge {
  minutes: number
  hours: number
  display: string
}

export function getOrderAge(createdAt: string | Date): OrderAge {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  const diffMs = now.getTime() - created.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours = Math.floor(minutes / 60)

  let display: string
  if (minutes < 1) {
    display = 'just now'
  } else if (minutes < 60) {
    display = '' + minutes + 'm ago'
  } else if (hours < 24) {
    display = '' + hours + 'h ago'
  } else {
    const days = Math.floor(hours / 24)
    display = '' + days + 'd ago'
  }

  return { minutes, hours, display }
}

/**
 * Partition orders by status group in single pass
 * Optimized: Single iteration, no intermediate arrays
 */
export interface PartitionedOrders<T> {
  pending: T[]
  completed: T[]
  canceled: T[]
}

export function partitionOrdersByStatus<T extends { status: string }>(
  orders: T[]
): PartitionedOrders<T> {
  const pending: T[] = []
  const completed: T[] = []
  const canceled: T[] = []

  for (const order of orders) {
    if (isOrderPending(order.status)) {
      pending.push(order)
    } else if (order.status === 'COMPLETED') {
      completed.push(order)
    } else if (order.status === 'CANCELED') {
      canceled.push(order)
    }
  }

  return { pending, completed, canceled }
}

/**
 * Get most recent order from a list without sorting entire array
 * Optimized: O(n) vs O(n log n) for sort
 */
export function getMostRecentOrder<T extends { createdAt: string | Date }>(
  orders: T[]
): T | undefined {
  if (!orders?.length) return undefined

  let mostRecent = orders[0]
  if (!mostRecent) return undefined
  
  let mostRecentTime = typeof mostRecent.createdAt === 'string' 
    ? new Date(mostRecent.createdAt).getTime()
    : mostRecent.createdAt.getTime()

  for (let i = 1; i < orders.length; i++) {
    const order = orders[i]
    if (!order) continue
    const orderTime = typeof order.createdAt === 'string'
      ? new Date(order.createdAt).getTime()
      : order.createdAt.getTime()
    
    if (orderTime > mostRecentTime) {
      mostRecent = order
      mostRecentTime = orderTime
    }
  }

  return mostRecent
}

/**
 * Get estimated ready time for an order
 * @param createdAt Order creation time
 * @param prepTimeMin Preparation time in minutes
 * @returns Estimated ready time as Date
 */
export function getEstimatedReadyTime(
  createdAt: string | Date,
  prepTimeMin = 30
): Date {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return new Date(created.getTime() + prepTimeMin * 60_000)
}