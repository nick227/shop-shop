import type { FastifyInstance } from 'fastify'
import { prisma } from '@packages/db'

const PUBLIC_KEYS = [
  'platform.maintenance_mode',
  'platform.maintenance_message',
  'platform.new_vendor_signups_enabled',
  'platform.new_affiliate_signups_enabled',
]

export const settingsPublicRoutes = async (app: FastifyInstance) => {
  app.get('/settings/public', async (_req, reply) => {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    })
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))
    // Fill in defaults for any missing keys
    const defaults: Record<string, string> = {
      'platform.maintenance_mode': 'false',
      'platform.maintenance_message': 'We are performing scheduled maintenance. Please check back soon.',
      'platform.new_vendor_signups_enabled': 'true',
      'platform.new_affiliate_signups_enabled': 'true',
    }
    return reply.send({ settings: { ...defaults, ...settings } })
  })
}
