import { describe, it, expect } from 'vitest'

describe('Server Environment Validation', () => {
  it('should have required environment variables', () => {
    expect(process.env.DATABASE_URL).toBeTruthy()
    expect(process.env.JWT_SECRET).toBeTruthy()
    expect(process.env.NODE_ENV).toBeTruthy()
  })

  it('should have valid JWT_SECRET length', () => {
    const secret = process.env.JWT_SECRET || ''
    expect(secret.length).toBeGreaterThanOrEqual(32)
  })

  it('should have valid NODE_ENV', () => {
    expect(['development', 'production', 'test']).toContain(process.env.NODE_ENV)
  })

  it('should have PORT configured', () => {
    expect(process.env.PORT).toBeTruthy()
  })

  it('should parse CORS_ORIGINS', () => {
    const origins = (process.env.CORS_ORIGINS || '').split(',')
    expect(origins.length).toBeGreaterThan(0)
  })
})

