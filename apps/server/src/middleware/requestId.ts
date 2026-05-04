/**
 * Request ID Middleware
 * 
 * Generates and tracks request IDs for improved traceability.
 * Attaches x-request-id header and includes in all logs.
 */

import { FastifyReply, FastifyRequest } from 'fastify'
import { randomUUID } from 'crypto'

declare module 'fastify' {
  interface FastifyRequest {
    id: string
  }
}

/**
 * Generate or extract request ID
 */
function getRequestId(req: FastifyRequest): string {
  // Check for existing request ID in headers
  const existingId = req.headers['x-request-id'] as string
  if (existingId && typeof existingId === 'string' && existingId.length > 0) {
    return existingId
  }
  
  // Generate new UUID
  return randomUUID()
}

/**
 * Request ID middleware for Fastify
 */
export const requestIdMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  const requestId = getRequestId(req)
  
  // Attach to request object
  req.id = requestId
  
  // Set response header
  reply.header('x-request-id', requestId)
  
  // Add to logger context
  if (req.log) {
    req.log = req.log.child({ requestId })
  }
}

/**
 * Hook for adding request ID to all logs
 */
export const addRequestIdToLogger = async (req: FastifyRequest, reply: FastifyReply) => {
  // Ensure logger has request ID context
  if (req.log && !(req.log as { bindings?: () => Record<string, unknown> }).bindings?.()?.requestId) {
    req.log = req.log.child({ requestId: req.id })
  }
}
