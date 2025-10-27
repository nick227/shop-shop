/**
 * Integration Tests for ApiClient;
 * Tests the complete API client system with all components;
 */

import { apiClient } from '../client'

// Mock the SDK imports;
jest.mock('@packages/sdk', () => ({
  AuthApi: jest.fn().mockImplementation(() => ({ type: 'AuthApi' })),
  StoresApi: jest.fn().mockImplementation(() => ({ type: 'StoresApi' })),
  ItemsApi: jest.fn().mockImplementation(() => ({ type: 'ItemsApi' })),
  CartsApi: jest.fn().mockImplementation(() => ({ type: 'CartsApi' })),
  OrdersApi: jest.fn().mockImplementation(() => ({ type: 'OrdersApi' })),
  AddresssApi: jest.fn().mockImplementation(() => ({ type: 'AddresssApi' })),
  PromotionsApi: jest.fn().mockImplementation(() => ({ type: 'PromotionsApi' })),
  PaymentsApi: jest.fn().mockImplementation(() => ({ type: 'PaymentsApi' })),
  UsersApi: jest.fn().mockImplementation(() => ({ type: 'UsersApi' })),
  PostsApi: jest.fn().mockImplementation(() => ({ type: 'PostsApi' })),
  MediasApi: jest.fn().mockImplementation(() => ({ type: 'MediasApi' })),
  Configuration: jest.fn().mockImplementation((config) => ({
    basePath: config.basePath,
    headers: config.headers,
    middleware: config.middleware}))
}))

describe('ApiClient Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test;
    apiClient.clearCache()
  })

  describe('API Instance Creation', () => {
    it('should create and cache API instances', () => {
      const auth1 = apiClient.auth()
      const auth2 = apiClient.auth()
      
      expect(auth1).toBe(auth2) // Should be the same instance;
      expect(auth1).toBeDefined()
    })

    it('should create different instances for different APIs', () => {
      const auth = apiClient.auth()
      const stores = apiClient.stores()
      
      expect(auth).not.toBe(stores)
      expect(auth).toBeDefined()
      expect(stores).toBeDefined()
    })

    it('should create all API types', () => {
      const apis = {
        auth: apiClient.auth(),
        stores: apiClient.stores(),
        items: apiClient.items(),
        carts: apiClient.carts(),
        orders: apiClient.orders(),
        addresses: apiClient.addresses(),
        promotions: apiClient.promotions(),
        payments: apiClient.payments(),
        users: apiClient.users(),
        media: apiClient.media()
      }

      for (const [type, instance] of Object.entries(apis)) {
        expect(instance).toBeDefined()
        expect(instance).toBeDefined()
      }
    })
  })

  describe('Token Management', () => {
    it('should handle token changes and invalidate cache', () => {
      const auth1 = apiClient.auth()
      
      apiClient.setToken('new-token')
      const auth2 = apiClient.auth()
      
      expect(auth1).not.toBe(auth2) // Should be different instances;
    })

    it('should maintain instances when token stays the same', () => {
      const auth1 = apiClient.auth()
      
      apiClient.setToken(apiClient.getToken())
      const auth2 = apiClient.auth()
      
      expect(auth1).toBe(auth2) // Should be the same instance;
    })

    it('should handle undefined token', () => {
      apiClient.setToken(undefined)
      
      const auth = apiClient.auth()
      expect(auth).toBeDefined()
    })
  })

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      apiClient.auth()
      apiClient.stores()
      
      const stats = apiClient.getCacheStats()
      
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(20)
      expect(stats.configVersion).toBeGreaterThan(0)
      expect(Array.isArray(stats.staleInstances)).toBe(true)
    })

    it('should clear cache completely', () => {
      apiClient.auth()
      apiClient.stores()
      
      apiClient.clearCache()
      
      const stats = apiClient.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it('should refresh all instances', () => {
      const auth1 = apiClient.auth()
      
      apiClient.refreshAllInstances()
      const auth2 = apiClient.auth()
      
      expect(auth1).not.toBe(auth2)
    })

    it('should clear only stale instances', () => {
      apiClient.auth()
      apiClient.setToken('new-token')
      apiClient.stores()
      
      apiClient.clearStaleInstances()
      
      const stats = apiClient.getCacheStats()
      expect(stats.staleInstances).toHaveLength(0)
    })
  })

  describe('Cache Warming', () => {
    it('should warm up cache with specified APIs', async () => {
      await apiClient.warmupCache(['auth', 'stores'])
      
      const stats = apiClient.getCacheStats()
      expect(stats.size).toBeGreaterThanOrEqual(2)
    })

    it('should warm up cache with default APIs', async () => {
      await apiClient.warmupCache()
      
      const stats = apiClient.getCacheStats()
      expect(stats.size).toBeGreaterThanOrEqual(3) // auth, stores, items;
    })
  })

  describe('Analytics', () => {
    it('should provide comprehensive analytics', () => {
      apiClient.auth()
      apiClient.stores()
      
      const analytics = apiClient.getCacheAnalytics()
      
      expect(analytics).toHaveProperty('stats')
      expect(analytics).toHaveProperty('health')
      expect(analytics).toHaveProperty('recommendations')
      
      expect(analytics.stats).toHaveProperty('size')
      expect(analytics.stats).toHaveProperty('hitRate')
      expect(analytics.stats).toHaveProperty('memoryUsage')
      
      expect(analytics.health).toHaveProperty('isHealthy')
      expect(analytics.health).toHaveProperty('efficiency')
      
      expect(Array.isArray(analytics.recommendations)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown API types gracefully', () => {
      expect(() => {
        (apiClient as any).getApiInstance('unknown-type')
      }).toThrow('Unknown API type: unknown-type')
    })

    it('should handle factory creation errors', () => {
      // Mock a factory that throws an error;
      const originalAuthFactory = (apiClient as any).apiFactories.auth;
      ;(apiClient as any).apiFactories.auth = {
        create: () => {
          throw new Error('Factory creation failed')
        }
      }

      expect(() => {
        apiClient.auth()
      }).toThrow('Failed to create auth API instance')

      // Restore original factory;
      ;(apiClient as any).apiFactories.auth = originalAuthFactory;
    })
  })

  describe('Performance', () => {
    it('should create instances quickly', () => {
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        apiClient.auth()
      }
      
      const end = performance.now()
      expect(end - start).toBeLessThan(100) // Should be very fast due to caching;
    })

    it('should handle concurrent API calls', async () => {
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(apiClient.auth())
      )
      
      const instances = await Promise.all(promises)
      
      // All should be the same instance (cached)
      const firstInstance = instances[0]
      for (const instance of instances) {
        expect(instance).toBe(firstInstance)
      }
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory with repeated calls', () => {
      const initialStats = apiClient.getCacheStats()
      
      // Make many API calls;
      for (let i = 0; i < 1000; i++) {
        apiClient.auth()
      }
      
      const finalStats = apiClient.getCacheStats()
      
      // Cache size should not grow beyond max;
      expect(finalStats.size).toBeLessThanOrEqual(finalStats.maxSize)
    })

    it('should handle cache size limits', () => {
      // Create many different API instances;
      const apiTypes = ['auth', 'stores', 'items', 'carts', 'orders', 'addresses', 'promotions', 'payments', 'users', 'posts', 'medias']
      
      for (const type of apiTypes) {
        ;(apiClient as any)[type]()
      }
      
      const stats = apiClient.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid token changes', () => {
      const tokens = ['token1', 'token2', 'token3', 'token1']
      
      for (const token of tokens) {
        apiClient.setToken(token)
        const auth = apiClient.auth()
        expect(auth).toBeDefined()
      }
    })

    it('should handle undefined token', () => {
      apiClient.setToken(undefined as any)
      
      const auth = apiClient.auth()
      expect(auth).toBeDefined()
    })

    it('should handle empty string token', () => {
      apiClient.setToken('')
      
      const auth = apiClient.auth()
      expect(auth).toBeDefined()
    })
  })
})
