import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyJWT, getUserById } from '@packages/db'
import type { User } from '@packages/db'

export interface AuthenticatedUser {
  id: string
  role: 'USER' | 'VENDOR' | 'ADMIN' | 'AFFILIATE' | 'RIDER' | 'STAFF'
  email: string
  name: string | null
  phone: string | null
  createdAt: Date
  updatedAt: Date
}

// Extend Fastify types to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

export const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Missing or invalid authorization header'
      })
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify JWT
    const decoded = verifyJWT(token)
    
    // Get user from database
    const user = await getUserById(decoded.userId)
    if (!user) {
      return reply.code(401).send({
        error: 'User not found'
      })
    }
    
    // Attach user to request
    req.user = user as AuthenticatedUser
  } catch (error) {
    if (error instanceof Error) {
      req.log.warn({ err: error }, 'Authentication failed')
    }
    return reply.code(401).send({
      error: 'Invalid or expired token'
    })
  }
}

