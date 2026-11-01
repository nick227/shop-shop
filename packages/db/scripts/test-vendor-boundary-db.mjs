import { config } from 'dotenv'
import { PrismaClient } from '../src/generated/client/index.js'
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
config({ path: '.env', quiet: true })
const url = new URL(process.env.DATABASE_URL)
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Only isolated local testing is allowed')
const db = `shopshop_vendor_boundary_test_${Date.now()}`
const admin = new PrismaClient({ datasources: { db: { url: url.toString() } } })
await admin.$executeRawUnsafe(`CREATE DATABASE \`${db}\``)
url.pathname = `/${db}`
writeFileSync('/tmp/shopshop-vendor-test-url', url.toString(), { mode: 0o600 })
const oldSchema = execFileSync('git', ['show', 'HEAD:packages/db/prisma/schema.prisma'], { encoding: 'utf8' })
writeFileSync('/tmp/shopshop-vendor-before.prisma', oldSchema)
execFileSync('pnpm', ['exec', 'prisma', 'db', 'push', '--schema', '/tmp/shopshop-vendor-before.prisma', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' })
const test = new PrismaClient({ datasources: { db: { url: url.toString() } } })
// Seed legacy data before the migration, using SQL because the generated client has new columns.
await test.$executeRawUnsafe(`INSERT INTO User (id,email,passwordHash,role,createdAt,updatedAt) VALUES
 ('legacy-shopper','shopper@boundary.test','unused','USER',NOW(),NOW()),
 ('legacy-vendor','vendor@boundary.test','unused','VENDOR',NOW(),NOW()),
 ('legacy-owner','owner@boundary.test','unused','USER',NOW(),NOW()),
 ('legacy-team','team@boundary.test','unused','STAFF',NOW(),NOW()),
 ('legacy-admin','admin@boundary.test','unused','ADMIN',NOW(),NOW()),
 ('legacy-pending','pending@boundary.test','unused','VENDOR_PENDING',NOW(),NOW())`)
// Store required defaults are easiest derived from Prisma's old model via raw minimal insert.
await test.$executeRawUnsafe(`INSERT INTO Store (id, ownerUserId, name, slug, addressStreet, addressCity, addressState, addressZip, createdAt,updatedAt) VALUES ('legacy-store','legacy-owner','Legacy store','legacy-boundary','1 Main St','Austin','TX','78701',NOW(),NOW())`)
await test.$executeRawUnsafe(`INSERT INTO TeamMember (id,storeId,userId,permissionsJson,isActive,addedAt,updatedAt) VALUES ('legacy-membership','legacy-store','legacy-team','["VIEW_ITEMS"]',true,NOW(),NOW())`)
const migration = readFileSync('prisma/migrations/20261031000000_vendor_access_boundary/migration.sql','utf8')
for (const statement of migration.split(';').map(s=>s.replace(/^\s*--.*$/gm,'').trim()).filter(Boolean)) await test.$executeRawUnsafe(statement)
execFileSync('pnpm', ['exec', 'prisma', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: 'pipe' })
console.log(`Isolated migration and legacy fixture setup completed: ${db}`)
await test.$disconnect()
await admin.$disconnect()
