import type { FastifyRequest, FastifyReply } from 'fastify'
import { getAccountCapabilities } from '@packages/db'
import { requireAuth } from './rbac.js'

export async function requireVendorWorkspace(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply)
  if (reply.sent || !req.user) return
  const access = await getAccountCapabilities(req.user.id)
  if (!access.canAccessVendorPortal) {
    return reply.code(403).send({ error: 'Workspace access is unavailable', code: 'VENDOR_ACCESS_DENIED' })
  }
}

export async function requireStoreCreation(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply)
  if (reply.sent || !req.user) return
  if (!(await getAccountCapabilities(req.user.id)).canCreateStore) {
    return reply.code(403).send({ error: 'Store creation is not authorized', code: 'STORE_CREATION_DENIED' })
  }
}
