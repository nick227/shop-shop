import type { FastifyReply, FastifyRequest } from 'fastify'
import crypto from 'node:crypto'

/** Resolved DoorDash webhook auth settings (built from server env). */
export type DoordashWebhookAuthConfig = Readonly<{
  mode: 'none' | 'basic' | 'hmac'
  basicUser?: string
  basicPassword?: string
  hmacSecret?: string
  /** Lowercase header name for signature (Node lowercases incoming headers). */
  signatureHeaderLower: string
}>

/**
 * Returns true when the request may proceed. On failure, sends an error response and returns false.
 * Raw body is required when mode is `hmac`.
 */
export function verifyDoordashWebhookRequest(
  req: FastifyRequest,
  reply: FastifyReply,
  auth: DoordashWebhookAuthConfig,
  rawBody: Buffer | undefined,
): boolean {
  if (auth.mode === 'none') {
    return true
  }

  if (auth.mode === 'basic') {
    const user = auth.basicUser
    const pass = auth.basicPassword
    if (!user || !pass) {
      reply.code(500).send({ error: 'DOORDASH_WEBHOOK_BASIC_USER/PASSWORD not configured' })
      return false
    }
    const header = req.headers.authorization
    if (!header?.startsWith('Basic ')) {
      reply.code(401).send({ error: 'Missing or invalid Authorization (Basic)' })
      return false
    }
    let decoded: string
    try {
      decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    } catch {
      reply.code(401).send({ error: 'Invalid Basic Authorization encoding' })
      return false
    }
    const colon = decoded.indexOf(':')
    const u = colon >= 0 ? decoded.slice(0, colon) : ''
    const p = colon >= 0 ? decoded.slice(colon + 1) : ''
    if (u !== user || p !== pass) {
      reply.code(401).send({ error: 'Invalid Basic credentials' })
      return false
    }
    return true
  }

  const secret = auth.hmacSecret
  if (!secret) {
    reply.code(500).send({ error: 'DOORDASH_WEBHOOK_SECRET not configured for hmac mode' })
    return false
  }
  if (!rawBody?.length) {
    reply.code(400).send({ error: 'Missing raw body' })
    return false
  }

  const signature = req.headers[auth.signatureHeaderLower]
  const sigStr = Array.isArray(signature) ? signature[0] : signature
  if (typeof sigStr !== 'string' || !sigStr.length) {
    reply.code(400).send({
      error: 'Missing signature header',
      header: auth.signatureHeaderLower,
    })
    return false
  }

  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expectedHex, 'utf8')
  const receivedBuf = Buffer.from(sigStr, 'utf8')
  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    reply.code(401).send({ error: 'Invalid signature' })
    return false
  }

  return true
}

/** Reads current process.env — call per request so tests can override DoorDash vars between inject() calls. */
export function buildDoordashWebhookAuthFromEnv(): DoordashWebhookAuthConfig {
  const raw = process.env.DOORDASH_WEBHOOK_AUTH_MODE?.trim()
  const mode: DoordashWebhookAuthConfig['mode'] =
    raw === 'basic' || raw === 'hmac' ? raw : 'none'
  return {
    mode,
    basicUser: process.env.DOORDASH_WEBHOOK_BASIC_USER,
    basicPassword: process.env.DOORDASH_WEBHOOK_BASIC_PASSWORD,
    hmacSecret: process.env.DOORDASH_WEBHOOK_SECRET,
    signatureHeaderLower: (process.env.DOORDASH_WEBHOOK_SIGNATURE_HEADER ?? 'x-doordash-signature').toLowerCase(),
  }
}
