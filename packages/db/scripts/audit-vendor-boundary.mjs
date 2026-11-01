import { config } from 'dotenv'
import { PrismaClient } from '../src/generated/client/index.js'
config({ path: '.env', quiet: true })
const url = new URL(process.env.DATABASE_URL)
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Audit is local-only')
const db = new PrismaClient()
console.log(JSON.stringify(await db.$queryRawUnsafe(`SELECT role, COUNT(*) AS total FROM User GROUP BY role`), (_, value) => typeof value === 'bigint' ? Number(value) : value))
console.log(JSON.stringify(await db.$queryRawUnsafe(`SELECT COUNT(*) AS legacyOwnersWithoutVendorRole FROM User u WHERE u.role <> 'VENDOR' AND EXISTS (SELECT 1 FROM Store s WHERE s.ownerUserId = u.id)`), (_, value) => typeof value === 'bigint' ? Number(value) : value))
console.log(JSON.stringify(await db.$queryRawUnsafe(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='User' AND COLUMN_NAME IN ('vendorAccessRevokedAt','adminVendorWorkspace','adminCreateStores')`)))
await db.$disconnect()
