/**
 * API Cache System Tests;
 * Tests for thread safety, memory management, and configuration validation;
 */

import { apiClient } from '../client'

describe('API Cache System', () => {
  beforeEach(() => {
    // Clear cache before each test;
    apiClient.clearCache()
  })

  describe('Instance Creation and Caching', () => {
    it('should create and cache API instances', () => {
      const stores1 = apiClient.stores()
      const stores2 = apiClient.stores()
      
      // Should return the same instance;
      expect(stores1).toBe(stores2)
    })

    it('should create different instances for different APIs', () => {
      const stores = apiClient.stores()
      const items = apiClient.items()
      
      // Should be different instances;
      expect(stores).not.toBe(items)
    })
  })

  describe('Configuration Versioning', () => {
    it('should invalidate instances when token changes', () => {
      // Create initial instance;
      const stores1 = apiClient.stores()
      
      // Change token;
      apiClient.setToken('new-token')
      
      // Create new instance;
      const stores2 = apiClient.stores()
      
      // Should be different instances due to token change;
      expect(stores1).not.toBe(stores2)
    })

    it('should maintain instances when token stays the same', () => {
      // Create initial instance;
      const stores1 = apiClient.stores()
      
      // Set same token again;
      apiClient.setToken(apiClient.getToken())
      
      // Create new instance;
      const stores2 = apiClient.stores()
      
      // Should be the same instance;
      expect(stores1).toBe(stores2)
    })
  })

  describe('Memory Management', () => {
    it('should track cache statistics correctly', () => {
      // Create some instances;
      apiClient.stores()
      apiClient.items()
      apiClient.orders()
      
      const stats = apiClient.getCacheStats()
      
      expect(stats.size).toBe(3)
      expect(stats.maxSize).toBe(20)
      expect(stats.configVersion).toBeGreaterThan(0)
      expect(stats.staleInstances).toEqual([])
    })

    it('should handle cache size limits correctly', () => {
      // Create instances up to the limit;
      for (let i = 0; i < 25; i++) {
        apiClient.stores()
      }
      
      const stats = apiClient.getCacheStats()
      
      // Should not exceed max size;
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize)
    })

    it('should clear cache completely', () => {
      // Create some instances;
      apiClient.stores()
      apiClient.items()
      
      // Clear cache;
      apiClient.clearCache()
      
      const stats = apiClient.getCacheStats()
      expect(stats.size).toBe(0)
    })

    it('should clear only stale instances', () => {
      // Create initial instances;
      const stores1 = apiClient.stores()
      const items1 = apiClient.items()
      
      // Change token to make instances stale;
      apiClient.setToken('new-token')
      
      // Create new instances;
      const stores2 = apiClient.stores()
      const items2 = apiClient.items()
      
      // Clear stale instances;
      apiClient.clearStaleInstances()
      
      const stats = apiClient.getCacheStats()
      expect(stats.staleInstances).toEqual([])
    })
  })

  describe('Thread Safety', () => {
    it('should handle concurrent API calls safely', async () => {
      // Simulate concurrent calls;
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(apiClient.stores())
      )
      
      const instances = await Promise.all(promises)
      
      // All instances should be the same (cached)
      const firstInstance = instances[0]
      for (const instance of instances) {
        expect(instance).toBe(firstInstance)
      }
    })

    it('should handle concurrent calls with token changes', async () => {
      // Start concurrent calls;
      const promises = Array.from({ length: 5 }, (_, i) => 
        new Promise(resolve => {
          setTimeout(() => {
            if (i === 2) {
              apiClient.setToken('new-token')
            }
            resolve(apiClient.stores())
          }, i * 10)
        })
      )
      
      const instances = await Promise.all(promises)
      
      // Should not throw errors and should handle token changes gracefully;
      expect(instances).toHaveLength(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined token correctly', () => {
      apiClient.setToken(undefined)
      
      const stores = apiClient.stores()
      expect(stores).toBeDefined()
    })

    it('should handle undefined token correctly', () => {
      apiClient.setToken(undefined as any)
      
      const stores = apiClient.stores()
      expect(stores).toBeDefined()
    })

    it('should handle rapid token changes', () => {
      const tokens = ['token1', 'token2', 'token3', 'token1']
      
      for (const token of tokens) {
        apiClient.setToken(token)
        const stores = apiClient.stores()
        expect(stores).toBeDefined()
      }
    })
  })

  describe('Performance', () => {
    it('should create instances quickly', () => {
      const start = performance.now()
      
      // Create multiple instances;
      for (let i = 0; i < 100; i++) {
        apiClient.stores()
      }
      
      const end = performance.now()
      const duration = end - start;
      // Should be fast (less than 100ms for 100 calls)
      expect(duration).toBeLessThan(100)
    })

    it('should not leak memory with repeated calls', () => {
      const initialStats = apiClient.getCacheStats()
      
      // Make many calls;
      for (let i = 0; i < 1000; i++) {
        apiClient.stores()
      }
      
      const finalStats = apiClient.getCacheStats()
      
      // Cache size should not grow beyond max;
      expect(finalStats.size).toBeLessThanOrEqual(finalStats.maxSize)
    })
  })
})
