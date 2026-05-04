/**
 * Order Status Validation
 * 
 * Provides validation for order status transitions with business rules.
 * Prevents invalid state changes and maintains order lifecycle integrity.
 */

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELED'

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

// ========================================
// Business Rules Configuration
// ========================================

const ORDER_STATUS_RULES: Record<OrderStatus, {
  description: string
  allowedTransitions: OrderStatus[]
  businessRules: string[]
  prerequisites: string[]
}> = {
  PLACED: {
    description: 'Order has been placed by customer',
    allowedTransitions: ['ACCEPTED', 'CANCELED'],
    businessRules: [
      'Customer can cancel within 5 minutes of placing order',
      'Vendor must accept within 10 minutes or order is auto-cancelled',
      'Payment must be successfully processed'
    ],
    prerequisites: [
      'Valid payment method',
      'Items in stock',
      'Delivery address validated (if delivery)'
    ]
  },
  
  ACCEPTED: {
    description: 'Order has been accepted by vendor',
    allowedTransitions: ['PREPARING', 'CANCELED'],
    businessRules: [
      'Vendor can cancel within 2 minutes of acceptance',
      'Customer cannot cancel after acceptance',
      'Preparation must start within 5 minutes'
    ],
    prerequisites: [
      'Vendor has confirmed order details',
      'Kitchen capacity available'
    ]
  },
  
  PREPARING: {
    description: 'Order is being prepared',
    allowedTransitions: ['READY', 'CANCELED'],
    businessRules: [
      'Only vendor can cancel during preparation (customer issues)',
      'Preparation time cannot exceed estimated time by more than 10 minutes',
      'Quality checks must be performed'
    ],
    prerequisites: [
      'All ingredients available',
      'Staff assigned to order'
    ]
  },
  
  READY: {
    description: 'Order is ready for pickup/delivery',
    allowedTransitions: ['OUT_FOR_DELIVERY', 'COMPLETED'],
    businessRules: [
      'Pickup orders must be collected within 15 minutes',
      'Delivery orders must be dispatched within 10 minutes',
      'Food temperature must be maintained'
    ],
    prerequisites: [
      'Quality inspection completed',
      'Packaging completed',
      'Delivery driver assigned (if delivery)'
    ]
  },
  
  OUT_FOR_DELIVERY: {
    description: 'Order is out for delivery',
    allowedTransitions: ['COMPLETED'],
    businessRules: [
      'Delivery must be completed within estimated time + 15 minutes',
      'Customer must be available to receive order',
      'GPS tracking must be active'
    ],
    prerequisites: [
      'Driver has picked up order',
      'Delivery route optimized'
    ]
  },
  
  COMPLETED: {
    description: 'Order has been completed successfully',
    allowedTransitions: [],
    businessRules: [
      'No further status changes allowed',
      'Customer feedback can be collected',
      'Revenue can be recognized'
    ],
    prerequisites: [
      'Order delivered or picked up',
      'Payment confirmed'
    ]
  },
  
  CANCELED: {
    description: 'Order has been cancelled',
    allowedTransitions: [],
    businessRules: [
      'No further status changes allowed',
      'Refund must be processed according to policy',
      'Cancellation reason must be recorded'
    ],
    prerequisites: [
      'Cancellation reason documented',
      'Refund process initiated'
    ]
  }
}

// ========================================
// Validation Functions
// ========================================

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
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check if current status is valid
  if (!ORDER_STATUS_RULES[currentStatus]) {
    errors.push(`Invalid current status: ${currentStatus}`)
    return { isValid: false, errors, warnings }
  }
  
  // Check if new status is valid
  if (!ORDER_STATUS_RULES[newStatus]) {
    errors.push(`Invalid target status: ${newStatus}`)
    return { isValid: false, errors, warnings }
  }
  
  // Check if transition is allowed
  const allowedTransitions = ORDER_STATUS_RULES[currentStatus].allowedTransitions
  const isAllowed = allowedTransitions.includes(newStatus)
  
  if (!isAllowed) {
    errors.push(
      `Cannot transition from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${allowedTransitions.join(', ')}`
    )
  }
  
  // Role-based validation
  if (context?.userRole) {
    const roleValidation = validateRoleBasedTransition(currentStatus, newStatus, context.userRole)
    if (!roleValidation.isValid) {
      errors.push(...roleValidation.errors)
    }
    warnings.push(...roleValidation.warnings)
  }
  
  // Time-based validation
  if (context?.timestamp) {
    const timeValidation = validateTimeBasedTransition(currentStatus, newStatus, context.timestamp)
    if (!timeValidation.isValid) {
      errors.push(...timeValidation.errors)
    }
    warnings.push(...timeValidation.warnings)
  }
  
  // Business rules validation
  const businessRulesValidation = validateBusinessRules(currentStatus, newStatus, context)
  if (!businessRulesValidation.isValid) {
    errors.push(...businessRulesValidation.errors)
  }
  warnings.push(...businessRulesValidation.warnings)
  
  const transition: OrderStatusTransition = {
    from: currentStatus,
    to: newStatus,
    allowed: isAllowed && errors.length === 0,
    reason: errors.length > 0 ? errors.join('; ') : undefined
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    transition
  }
}

function validateRoleBasedTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole: 'customer' | 'vendor' | 'admin'
): OrderValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Customer can only cancel their own orders in certain states
  if (userRole === 'customer') {
    if (newStatus !== 'CANCELED') {
      errors.push('Customers can only cancel orders')
    }
    if (!['PLACED'].includes(currentStatus)) {
      errors.push('Customers can only cancel orders in PLACED status')
    }
  }
  
  // Vendor can manage order flow but cannot complete delivery orders
  if (userRole === 'vendor') {
    if (newStatus === 'COMPLETED' && currentStatus === 'OUT_FOR_DELIVERY') {
      warnings.push('Vendor cannot mark delivery orders as completed - this is done by delivery system')
    }
  }
  
  // Admin has full control
  if (userRole === 'admin') {
    warnings.push('Admin override - be careful with manual status changes')
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

function validateTimeBasedTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  timestamp: string
): OrderValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const now = new Date()
  const transitionTime = new Date(timestamp)
  const timeDiff = now.getTime() - transitionTime.getTime()
  const minutesDiff = Math.floor(timeDiff / (1000 * 60))
  
  // Time-based business rules
  switch (currentStatus) {
    case 'PLACED':
      if (newStatus === 'CANCELED' && minutesDiff > 5) {
        errors.push('Customers can only cancel within 5 minutes of placing order')
      }
      if (newStatus === 'ACCEPTED' && minutesDiff > 10) {
        warnings.push('Order acceptance is delayed - consider auto-cancellation')
      }
      break
      
    case 'ACCEPTED':
      if (newStatus === 'CANCELED' && minutesDiff > 2) {
        errors.push('Vendor can only cancel within 2 minutes of acceptance')
      }
      break
      
    case 'READY':
      if (currentStatus === 'READY' && minutesDiff > 15) {
        warnings.push('Order has been ready for over 15 minutes - follow up required')
      }
      break
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

function validateBusinessRules(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  context?: any
): OrderValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // General business rules
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELED') {
    errors.push(`Cannot change status from ${currentStatus} - order is finalized`)
  }
  
  // Specific transition rules
  if (currentStatus === 'PLACED' && newStatus === 'ACCEPTED') {
    // Check if vendor has capacity
    if (context?.vendorCapacity === 'full') {
      errors.push('Vendor has reached capacity - cannot accept more orders')
    }
  }
  
  if (currentStatus === 'PREPARING' && newStatus === 'READY') {
    // Check if quality inspection is done
    if (!context?.qualityInspectionPassed) {
      errors.push('Quality inspection must be completed before marking order as ready')
    }
  }
  
  if (currentStatus === 'READY' && newStatus === 'OUT_FOR_DELIVERY') {
    // Check if delivery driver is assigned
    if (!context?.deliveryDriverAssigned) {
      errors.push('Delivery driver must be assigned before dispatch')
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings }
}

// ========================================
// Utility Functions
// ========================================

export function getOrderStatusRules(status: OrderStatus) {
  return ORDER_STATUS_RULES[status]
}

export function getAllStatuses(): OrderStatus[] {
  return Object.keys(ORDER_STATUS_RULES) as OrderStatus[]
}

export function getStatusTransitionPath(from: OrderStatus, to: OrderStatus): OrderStatus[] | null {
  // Simple pathfinding for status transitions
  // In a real implementation, this could use a graph algorithm
  const visited = new Set<OrderStatus>()
  const path: OrderStatus[] = []
  
  function dfs(current: OrderStatus, target: OrderStatus): boolean {
    if (current === target) {
      return true
    }
    
    if (visited.has(current)) {
      return false
    }
    
    visited.add(current)
    path.push(current)
    
    const transitions = ORDER_STATUS_RULES[current].allowedTransitions
    
    for (const next of transitions) {
      if (dfs(next, target)) {
        return true
      }
    }
    
    path.pop()
    return false
  }
  
  if (dfs(from, to)) {
    path.push(to)
    return path
  }
  
  return null
}

export function canUserModifyStatus(
  userRole: 'customer' | 'vendor' | 'admin',
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  if (userRole === 'admin') return true
  
  if (userRole === 'customer') {
    return targetStatus === 'CANCELED' && currentStatus === 'PLACED'
  }
  
  if (userRole === 'vendor') {
    return ORDER_STATUS_RULES[currentStatus].allowedTransitions.includes(targetStatus)
  }
  
  return false
}
