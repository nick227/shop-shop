// ========================================
// Base Policy Interface
// Authorization logic for domain resources
// ========================================

export interface PolicyContext {
  userId: string
  userRole: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF'
  email?: string
}

export interface PolicyResult {
  allowed: boolean
  reason?: string
}

/**
 * Base interface for all resource policies
 * Returns true = allowed, string = denied with reason
 */
export interface BasePolicy<T = unknown> {
  canCreate(data: unknown, context: PolicyContext): Promise<boolean | string>
  canRead(resource: T, context: PolicyContext): Promise<boolean | string>
  canUpdate(resource: T, context: PolicyContext): Promise<boolean | string>
  canDelete(resource: T, context: PolicyContext): Promise<boolean | string>
  canList(context: PolicyContext): Promise<boolean | string>
}

/**
 * Helper to convert policy result to exception
 */
export function enforcePolicy(result: boolean | string): void {
  if (result !== true) {
    throw new Error(typeof result === 'string' ? result : 'Access denied')
  }
}

