import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from './auth.js'

// ========================================
// Role-Based Access Control (RBAC) Middleware
// ========================================

export type Role = 'USER' | 'VENDOR_PENDING' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF'

/**
 * Middleware factory to require specific roles
 * @param allowedRoles - Array of roles that can access the route
 * @returns Fastify middleware function
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // If no roles specified, allow all authenticated users
    if (allowedRoles.length === 0) {
      return
    }
    
    // If a Bearer token exists but `req.user` wasn't populated by a prior hook,
    // authenticate now to avoid "forgot to include authenticate" route bugs.
    if (!req.user && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
      await authenticate(req, reply)
    }

    const user = req.user
    
    // User must be authenticated
    if (!user) {
      req.log.warn({ allowedRoles }, 'Unauthenticated access attempt')
      return reply.code(401).send({ 
        error: 'Authentication required' 
      })
    }
    
    // Check if user has required role
    if (!allowedRoles.includes(user.role as string)) {
      req.log.warn({
        userId: user.id,
        userRole: user.role,
        allowedRoles,
      }, 'Insufficient permissions')
      
      return reply.code(403).send({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: user.role,
      })
    }
    
    // User has required role, continue
  }
}

/**
 * Check if user is admin
 */
export function requireAdmin() {
  return requireRole(['ADMIN'])
}

/**
 * Check if user is vendor or admin
 */
export function requireVendor() {
  return requireRole(['VENDOR', 'ADMIN'])
}

/**
 * Allow any authenticated user
 */
export function requireAuth() {
  return requireRole(['USER', 'VENDOR', 'ADMIN', 'AFFILIATE', 'RIDER', 'STAFF'])
}

