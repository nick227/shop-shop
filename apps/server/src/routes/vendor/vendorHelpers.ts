import type { FastifyReply } from 'fastify'
import { userHasStoreAccess } from '../../middleware/storeAccess'

// Re-export for convenience
export { userHasStoreAccess } from '../../middleware/storeAccess'

/**
 * Standardized error responses for vendor routes
 */
export const VendorErrors = {
  unauthorized: (reply: FastifyReply) => 
    reply.code(401).send({ error: 'Unauthorized' }),
    
  forbidden: (reply: FastifyReply, message?: string) =>
    reply.code(403).send({ error: 'Forbidden', ...(message && { message }) }),
    
  validationError: (reply: FastifyReply, details: any) =>
    reply.code(400).send({ error: 'Validation error', details }),
    
  notFound: (reply: FastifyReply, message: string) =>
    reply.code(404).send({ error: message }),
} as const

/**
 * Validates user authentication and returns standardized error response
 */
export const requireAuth = (userId: string | undefined, reply: FastifyReply) => {
  if (!userId) {
    VendorErrors.unauthorized(reply)
    return false
  }
  return true
}

/**
 * Validates store access with specific scope and returns standardized error response
 */
export const requireStoreAccess = async (
  userId: string,
  userRole: string,
  storeId: string,
  scope: 'settings' | 'team' | 'orders' | 'deliveries' | 'dispatch' | 'content' | 'analytics' | 'finance',
  reply: FastifyReply
): Promise<boolean> => {
  const hasAccess = await userHasStoreAccess(userId, userRole, storeId, scope)
  if (!hasAccess) {
    VendorErrors.forbidden(reply, `You cannot access ${scope} for this store`)
    return false
  }
  return true
}

/**
 * Combined auth + store access validation
 */
export const requireVendorAuth = async (
  userId: string | undefined,
  userRole: string | undefined,
  storeId: string,
  scope: 'settings' | 'team' | 'orders' | 'deliveries' | 'dispatch' | 'content' | 'analytics' | 'finance',
  reply: FastifyReply
): Promise<boolean> => {
  return requireAuth(userId, reply) && 
         await requireStoreAccess(userId!, userRole!, storeId, scope, reply)
}
