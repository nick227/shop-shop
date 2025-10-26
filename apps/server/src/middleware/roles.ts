import type { FastifyRequest, FastifyReply } from 'fastify'

export type Role = 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF'

export const requireRole = (allowedRoles: Role[]) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Ensure user is authenticated (should use authenticate middleware first)
    if (!req.user) {
      return reply.code(401).send({
        error: 'Authentication required'
      })
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role as Role)) {
      return reply.code(403).send({
        error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
      })
    }
  }
}

