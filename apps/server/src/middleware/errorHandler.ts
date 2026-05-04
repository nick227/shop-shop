/**
 * Global Error Handler Middleware
 * 
 * Captures and logs all errors with request context.
 * Prevents server crashes and provides consistent error responses.
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

interface ErrorContext {
  requestId?: string
  method: string
  url: string
  ip: string
  userAgent?: string
  userId?: string
  sessionId?: string
  timestamp: string
  body?: any
  query?: any
  params?: any
}

interface ErrorPayload {
  error: {
    name: string
    message: string
    stack?: string
    code?: string | number
  }
  context: ErrorContext
  environment: string
}

/**
 * Extract request context for error logging
 */
function extractRequestContext(req: FastifyRequest): ErrorContext {
  return {
    requestId: (req as any).id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.userId,
    sessionId: (req as any).sessionId,
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    params: req.params,
  }
}

/**
 * Log error with context
 */
function logError(error: FastifyError, context: ErrorContext) {
  const payload: ErrorPayload = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context,
    environment: process.env.NODE_ENV || 'development',
  }

  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Try to send to error endpoint if configured
    if (process.env.ERROR_ENDPOINT) {
      fetch(process.env.ERROR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently fail if error endpoint fails
        console.error('Failed to send error to endpoint:', payload)
      })
    }
    
    // Always log to console as fallback
    console.error('Production Error:', JSON.stringify(payload, null, 2))
  } else {
    // Development: detailed logging
    console.error('Development Error:', {
      error: error.message,
      stack: error.stack,
      context,
    })
  }
}

/**
 * Global error handler for Fastify
 */
export const globalErrorHandler = async (
  error: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const context = extractRequestContext(req)
  
  // Log the error with context
  logError(error, context)

  // Don't send error details in production for security
  const isDevelopment = process.env.NODE_ENV !== 'production'
  
  // Handle specific error types
  if (error.validation) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Validation failed',
      details: isDevelopment ? error.validation : undefined,
      requestId: context.requestId,
    })
  }

  const sc = error.statusCode
  if (sc !== undefined && sc >= 400 && sc < 500) {
    return reply.status(sc).send({
      error: error.name || 'Client Error',
      message: error.message,
      requestId: context.requestId,
    })
  }

  // Default server error response
  const statusCode = error.statusCode || 500
  return reply.status(statusCode).send({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    requestId: context.requestId,
  })
}

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = (error: Error) => {
  const payload: ErrorPayload = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context: {
      method: 'UNCAUGHT',
      url: 'process',
      ip: 'process',
      timestamp: new Date().toISOString(),
    },
    environment: process.env.NODE_ENV || 'development',
  }

  console.error('Uncaught Exception:', JSON.stringify(payload, null, 2))
  
  // In production, try to send to error endpoint before exiting
  if (process.env.NODE_ENV === 'production' && process.env.ERROR_ENDPOINT) {
    fetch(process.env.ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).finally(() => {
      process.exit(1)
    })
  } else {
    process.exit(1)
  }
}

/**
 * Unhandled promise rejection handler
 */
export const handleUnhandledRejection = (reason: any, promise: Promise<any>) => {
  const payload: ErrorPayload = {
    error: {
      name: 'UnhandledPromiseRejection',
      message: reason?.message || String(reason),
      stack: reason?.stack,
    },
    context: {
      method: 'UNHANDLED_REJECTION',
      url: 'promise',
      ip: 'process',
      timestamp: new Date().toISOString(),
    },
    environment: process.env.NODE_ENV || 'development',
  }

  console.error('Unhandled Rejection:', JSON.stringify(payload, null, 2))
  
  // In production, try to send to error endpoint
  if (process.env.NODE_ENV === 'production' && process.env.ERROR_ENDPOINT) {
    fetch(process.env.ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silently fail
    })
  }
}
