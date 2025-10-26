import { z } from 'zod'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from project root (2 levels up from this file)
config({ path: resolve(process.cwd(), '../../.env') })

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Server
  PORT: z.string().transform(Number).default(process.env.PORT ?? '3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Geocoding (optional - for location-based features)
  GEOCODING_API_KEY: z.string().optional(),
  
  // Frontend/CORS
  WEB_PORT: z.string().transform(Number).default(process.env.WEB_PORT ?? '5177'),
  CORS_ORIGINS: z.string().default(process.env.CORS_ORIGINS ?? 'http://localhost:5177'),
})

export type ServerEnv = z.infer<typeof envSchema>

export const validateEnv = (): ServerEnv => {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    process.exit(1)
  }
  
  return parsed.data
}

// Validate and export
export const env = validateEnv()

// Parse CORS origins
export const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim())

