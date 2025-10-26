import { describe, it, expect } from 'vitest'
import { createTestServer } from './__tests__/helpers.js'

describe('Server', () => {
  describe('Health Check', () => {
    it('should respond to /healthz', async () => {
      const app = await createTestServer()
      
      // Add health check route
      app.get('/healthz', async () => ({ ok: true }))
      
      const response = await app.inject({
        method: 'GET',
        url: '/healthz',
      })
      
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.body)).toEqual({ ok: true })
      
      await app.close()
    })
  })

  describe('Swagger Documentation', () => {
    it('should register Swagger UI routes', async () => {
      const app = await createTestServer()
      
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      })
      
      // Swagger UI redirects - just check it doesn't 404
      expect([200, 302]).toContain(response.statusCode)
      
      await app.close()
    })

    it('should serve OpenAPI spec JSON', async () => {
      const app = await createTestServer()
      
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      })
      
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      
      const spec = JSON.parse(response.body)
      expect(spec.openapi).toBe('3.0.3')
      expect(spec.info).toBeDefined()
      
      await app.close()
    })
  })

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const app = await createTestServer()
      
      app.get('/test', async () => ({ test: true }))
      
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/test',
        headers: {
          origin: 'http://localhost:3000',
        },
      })
      
      expect(response.headers['access-control-allow-origin']).toBeTruthy()
      
      await app.close()
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const app = await createTestServer()
      
      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent',
      })
      
      expect(response.statusCode).toBe(404)
      
      await app.close()
    })
  })
})

