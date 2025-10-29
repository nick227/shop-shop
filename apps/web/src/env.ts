/**
 * Environment Variable Validation
 * Validates required env vars at build/runtime
 */
import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),
  VITE_WS_URL: z.string().optional(), // WebSocket URL for real-time
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  VITE_PORT: z.string().transform(Number).optional(),
  MODE: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate and export
function validateEnv() {
  try {
    return envSchema.parse({
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_WS_URL: import.meta.env.VITE_WS_URL,
      VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      VITE_PORT: import.meta.env.VITE_PORT,
      MODE: import.meta.env.MODE,
    })
  } catch (error: unknown) {
    console.error('❌ Invalid environment variables:', error)
    throw new Error('Environment validation failed. Check your .env file.')
  }
}

export const env = validateEnv()


