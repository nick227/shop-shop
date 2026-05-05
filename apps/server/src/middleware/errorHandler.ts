import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from './errors.js'

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'token', 'secret',
  'paymentMethod', 'cardNumber', 'cvv', 'ssn', 'authorization',
])

function scrubBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body
  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v,
    ]),
  )
}

export const globalErrorHandler = async (
  error: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const statusCode = (error as AppError).statusCode ?? error.statusCode

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    req.log.warn({ err: error, url: req.url, method: req.method }, 'Request rejected')
  } else {
    req.log.error(
      {
        err: error,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        body: scrubBody(req.body),
      },
      'Unhandled server error',
    )

    if (process.env.NODE_ENV === 'production' && process.env.ERROR_ENDPOINT) {
      fetch(process.env.ERROR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: { name: error.name, message: error.message, stack: error.stack },
          url: req.url,
          method: req.method,
          requestId: req.id,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {})
    }
  }

  if (error.validation) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Validation failed',
      details: process.env.NODE_ENV !== 'production' ? error.validation : undefined,
      requestId: req.id,
    })
  }

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send({
      error: error.name || 'Client Error',
      message: error.message,
      requestId: req.id,
    })
  }

  return reply.status(statusCode ?? 500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV !== 'production' ? error.message : 'Something went wrong',
    requestId: req.id,
  })
}

export const handleUncaughtException = (error: Error) => {
  console.error('Uncaught Exception — process will exit', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })

  if (process.env.NODE_ENV === 'production' && process.env.ERROR_ENDPOINT) {
    fetch(process.env.ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'uncaughtException', error: { name: error.name, message: error.message, stack: error.stack } }),
    }).finally(() => process.exit(1))
  } else {
    process.exit(1)
  }
}

export const handleUnhandledRejection = (reason: unknown) => {
  const err = reason instanceof Error ? reason : new Error(String(reason))
  console.error('Unhandled Promise Rejection', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  })

  if (process.env.NODE_ENV === 'production' && process.env.ERROR_ENDPOINT) {
    fetch(process.env.ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unhandledRejection', error: { name: err.name, message: err.message } }),
    }).catch(() => {})
  }
}
