import { config } from 'dotenv'
import { resolve } from 'path'
import { parseEnv } from './env.schema.js'
import type { ServerEnv } from './env.schema.js'

// Load .env from project root (2 levels up from this file)
config({ path: resolve(process.cwd(), '../../.env') })

export type { ServerEnv } from './env.schema.js'
export { parseEnv } from './env.schema.js'

export const validateEnv = (): ServerEnv => {
  const parsed = parseEnv(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    process.exit(1)
  }

  return parsed.data
}

export const env = validateEnv()

export const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim())
