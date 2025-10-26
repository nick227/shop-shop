import { describe, it, expect, beforeEach } from 'vitest'
import Fastify from 'fastify'
import { authRoutes } from './auth.route.js'
import { ALL_RESOURCES } from '../resources/index.js'
import { registerAllResources } from './loader.js'
import { prisma } from '@packages/db'

describe('Promotion Routes', () => {
  let app: ReturnType<typeof Fastify>
  let adminToken: string
  let vendorToken: string
  let userToken: string
  let storeId: string
  
  beforeEach(async () => {
    app = Fastify({ logger: false })
    await app.register(authRoutes)
    await registerAllResources(app, ALL_RESOURCES)  // Auto-register all resources
    
    // Clean up test data
    await prisma.promotion.deleteMany({ where: { code: { contains: 'TEST' } } })
    await prisma.store.deleteMany({ where: { slug: { contains: 'test-store' } } })
    await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } })
    
    // Create admin user
    const adminSignup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'admin@test.com',
        password: 'AdminPass123!',
        name: 'Admin User',
      }
    })
    const adminData = JSON.parse(adminSignup.body)
    await prisma.user.update({
      where: { id: adminData.user.id },
      data: { role: 'ADMIN' }
    })
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'admin@test.com',
        password: 'AdminPass123!',
      }
    })
    adminToken = JSON.parse(adminLogin.body).token
    
    // Create vendor user
    const vendorSignup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'vendor@test.com',
        password: 'VendorPass123!',
        name: 'Vendor User',
      }
    })
    const vendorData = JSON.parse(vendorSignup.body)
    await prisma.user.update({
      where: { id: vendorData.user.id },
      data: { role: 'VENDOR' }
    })
    const vendorLogin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'vendor@test.com',
        password: 'VendorPass123!',
      }
    })
    vendorToken = JSON.parse(vendorLogin.body).token
    
    // Create a store for the vendor
    const store = await prisma.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store-123',
        ownerUserId: vendorData.user.id,
        isPublished: true,
      }
    })
    storeId = store.id
    
    // Create regular user
    await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'user@test.com',
        password: 'UserPass123!',
        name: 'Regular User',
      }
    })
    const userLogin = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'user@test.com',
        password: 'UserPass123!',
      }
    })
    userToken = JSON.parse(userLogin.body).token
  })
  
  describe('POST /promotions', () => {
    it('should create a store promotion as vendor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTPROMO20',
          name: '20% Off Spring Sale',
          description: 'Get 20% off all items',
          type: 'PERCENTAGE',
          value: '20.00',
          minOrderValue: '50.00',
          maxDiscount: '100.00',
          usageLimit: 100,
          validFrom: new Date(Date.now() + 1000).toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      expect(response.statusCode).toBe(201)
      const promotion = JSON.parse(response.body)
      expect(promotion.code).toBe('TESTPROMO20')
      expect(promotion.storeId).toBe(storeId)
      expect(promotion.type).toBe('PERCENTAGE')
      expect(promotion.isGlobal).toBe(false)
    })
    
    it('should create a global promotion as admin', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          code: 'GLOBALTEST',
          name: 'Global Free Delivery',
          type: 'FREE_DELIVERY',
          value: '0.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      expect(response.statusCode).toBe(201)
      const promotion = JSON.parse(response.body)
      expect(promotion.code).toBe('GLOBALTEST')
      expect(promotion.isGlobal).toBe(true)
      expect(promotion.storeId).toBeNull()
    })
    
    it('should reject global promotion creation by vendor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          code: 'GLOBALFAIL',
          name: 'Should Fail',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      expect(response.statusCode).toBe(403)
      expect(JSON.parse(response.body).error).toContain('admin')
    })
    
    it('should reject promotion creation by regular user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          storeId,
          code: 'USERFAIL',
          name: 'Should Fail',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      expect(response.statusCode).toBe(403)
    })
    
    it('should reject duplicate promotion code', async () => {
      const payload = {
        storeId,
        code: 'DUPLICATE',
        name: 'Test',
        type: 'PERCENTAGE',
        value: '10.00',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
      }
      
      await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload
      })
      
      const response = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload
      })
      
      expect(response.statusCode).toBe(409)
      expect(JSON.parse(response.body).error).toContain('already exists')
    })
  })
  
  describe('GET /promotions', () => {
    it('should list all promotions (public)', async () => {
      // Create some test promotions
      await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTLIST1',
          name: 'Test 1',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      const response = await app.inject({
        method: 'GET',
        url: '/promotions'
      })
      
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      expect(result.data).toBeInstanceOf(Array)
      expect(result.total).toBeGreaterThan(0)
      expect(result.page).toBe(1)
    })
    
    it('should filter promotions by storeId', async () => {
      await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTFILTER',
          name: 'Test Filter',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      
      const response = await app.inject({
        method: 'GET',
        url: `/promotions?storeId=${storeId}`
      })
      
      expect(response.statusCode).toBe(200)
      const result = JSON.parse(response.body)
      
      // Should find the promotion we just created
      const hasFilterPromotion = result.data.some((p: { code: string }) => p.code === 'TESTFILTER')
      expect(hasFilterPromotion).toBe(true)
      
      // Filter should only return promotions for this specific storeId (not null/global)
      const filteredPromotion = result.data.find((p: { code: string }) => p.code === 'TESTFILTER')
      expect(filteredPromotion.storeId).toBe(storeId)
    })
  })
  
  describe('PATCH /promotions/:id', () => {
    it('should update promotion as owner', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTUPDATE',
          name: 'Original Name',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      const promotion = JSON.parse(create.body)
      
      const update = await app.inject({
        method: 'PATCH',
        url: `/promotions/${promotion.id}`,
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          name: 'Updated Name',
          status: 'ACTIVE',
        }
      })
      
      expect(update.statusCode).toBe(200)
      const updated = JSON.parse(update.body)
      expect(updated.name).toBe('Updated Name')
      expect(updated.status).toBe('ACTIVE')
    })
    
    it('should reject update by non-owner vendor', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTNOACCESS',
          name: 'Test',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      const promotion = JSON.parse(create.body)
      
      // Create another vendor
      await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'other-vendor@test.com',
          password: 'OtherPass123!',
        }
      })
      const otherVendorData = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'other-vendor@test.com',
          password: 'OtherPass123!',
        }
      })
      const otherVendorToken = JSON.parse(otherVendorData.body).token
      
      const update = await app.inject({
        method: 'PATCH',
        url: `/promotions/${promotion.id}`,
        headers: { authorization: `Bearer ${otherVendorToken}` },
        payload: { name: 'Should Fail' }
      })
      
      expect(update.statusCode).toBe(403)
    })
    
    it('should allow admin to update any promotion', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTADMIN',
          name: 'Test',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      const promotion = JSON.parse(create.body)
      
      const update = await app.inject({
        method: 'PATCH',
        url: `/promotions/${promotion.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: 'PAUSED' }
      })
      
      expect(update.statusCode).toBe(200)
    })
  })
  
  describe('DELETE /promotions/:id', () => {
    it('should delete promotion as owner', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTDELETE',
          name: 'Test Delete',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      const promotion = JSON.parse(create.body)
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/promotions/${promotion.id}`,
        headers: { authorization: `Bearer ${vendorToken}` }
      })
      
      expect(response.statusCode).toBe(204)
      
      // Verify deletion
      const check = await app.inject({
        method: 'GET',
        url: `/promotions/${promotion.id}`
      })
      expect(check.statusCode).toBe(404)
    })
    
    it('should reject delete by regular user', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/promotions',
        headers: { authorization: `Bearer ${vendorToken}` },
        payload: {
          storeId,
          code: 'TESTDELETEUSER',
          name: 'Test',
          type: 'PERCENTAGE',
          value: '10.00',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        }
      })
      const promotion = JSON.parse(create.body)
      
      const response = await app.inject({
        method: 'DELETE',
        url: `/promotions/${promotion.id}`,
        headers: { authorization: `Bearer ${userToken}` }
      })
      
      expect(response.statusCode).toBe(403)
    })
  })
})

