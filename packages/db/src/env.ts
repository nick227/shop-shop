import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PLATFORM_FEE_PERCENTAGE: z.string().default('10.0'),
})

export type Env = z.infer<typeof envSchema>

export const validateEnv = (): Env => {
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(parsed.error.format(), null, 2))
    process.exit(1)
  }
  
  return parsed.data
}

export const env = validateEnv()

