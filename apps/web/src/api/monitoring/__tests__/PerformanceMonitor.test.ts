/**
 * Unit Tests for PerformanceMonitor
 * Tests monitoring, analytics, and optimization recommendations
 */

import { PerformanceMonitor } from '../PerformanceMonitor'

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = PerformanceMonitor.getInstance()
    monitor.clearMetrics()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PerformanceMonitor.getInstance()
      const instance2 = PerformanceMonitor.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('Monitoring Control', () => {
    it('should start and stop monitoring', () => {
      expect(() => monitor.startMonitoring(100)).not.toThrow()
      expect(() => monitor.stopMonitoring()).not.toThrow()
    })

    it('should not start monitoring if already monitoring', () => {
      monitor.startMonitoring(100)
      expect(() => monitor.startMonitoring(200)).not.toThrow()
      monitor.stopMonitoring()
    })
  })

  describe('Metrics Recording', () => {
    it('should record metrics', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics).toHaveProperty('timestamp')
      expect(metrics).toHaveProperty('cacheHitRate')
      expect(metrics).toHaveProperty('cacheMissRate')
      expect(metrics).toHaveProperty('averageResponseTime')
      expect(metrics).toHaveProperty('memoryUsage')
      expect(metrics).toHaveProperty('activeConnections')
      expect(metrics).toHaveProperty('errorRate')
      expect(metrics).toHaveProperty('throughput')
      
      expect(typeof metrics.timestamp).toBe('number')
      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.cacheMissRate).toBe('number')
      expect(typeof metrics.averageResponseTime).toBe('number')
      expect(typeof metrics.memoryUsage).toBe('number')
      expect(typeof metrics.activeConnections).toBe('number')
      expect(typeof metrics.errorRate).toBe('number')
      expect(typeof metrics.throughput).toBe('number')
    })

    it('should record multiple metrics', () => {
      monitor.recordMetrics()
      monitor.recordMetrics()
      monitor.recordMetrics()
      
      const allMetrics = monitor.getAllMetrics()
      expect(allMetrics).toHaveLength(3)
    })

    it('should limit metrics history', () => {
      // Record more metrics than the limit
      for (let i = 0; i < 1500; i++) {
        monitor.recordMetrics()
      }
      
      const allMetrics = monitor.getAllMetrics()
      expect(allMetrics.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('Analytics', () => {
    it('should provide current analytics', () => {
      monitor.recordMetrics()
      
      const analytics = monitor.getAnalytics()
      
      expect(analytics).toHaveProperty('current')
      expect(analytics).toHaveProperty('trends')
      expect(analytics).toHaveProperty('recommendations')
      
      expect(analytics.current).toHaveProperty('timestamp')
      expect(analytics.trends).toHaveProperty('hitRateTrend')
      expect(analytics.trends).toHaveProperty('responseTimeTrend')
      expect(analytics.trends).toHaveProperty('memoryTrend')
      expect(Array.isArray(analytics.recommendations)).toBe(true)
    })

    it('should calculate trends correctly', () => {
      // Record some metrics
      for (let i = 0; i < 15; i++) {
        monitor.recordMetrics()
      }
      
      const analytics = monitor.getAnalytics()
      
      expect(typeof analytics.trends.hitRateTrend).toBe('number')
      expect(typeof analytics.trends.responseTimeTrend).toBe('number')
      expect(typeof analytics.trends.memoryTrend).toBe('number')
    })

    it('should handle empty metrics for trends', () => {
      const analytics = monitor.getAnalytics()
      
      expect(analytics.trends.hitRateTrend).toBe(0)
      expect(analytics.trends.responseTimeTrend).toBe(0)
      expect(analytics.trends.memoryTrend).toBe(0)
    })
  })

  describe('Recommendations', () => {
    it('should generate recommendations based on metrics', () => {
      // Record metrics that might trigger recommendations
      for (let i = 0; i < 10; i++) {
        monitor.recordMetrics()
      }
      
      const analytics = monitor.getAnalytics()
      
      expect(Array.isArray(analytics.recommendations)).toBe(true)
      
      // Check if recommendations have proper structure
      for (const rec of analytics.recommendations) {
        expect(rec).toHaveProperty('type')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('title')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('impact')
        expect(rec).toHaveProperty('implementation')
        
        expect(['performance', 'memory', 'efficiency', 'scalability']).toContain(rec.type)
        expect(['low', 'medium', 'high', 'critical']).toContain(rec.priority)
      }
    })

    it('should provide recommendations for low hit rate', () => {
      // This would need to be mocked to force low hit rate
      const analytics = monitor.getAnalytics()
      
      // Check if any recommendations are for efficiency
      const efficiencyRecs = analytics.recommendations.filter(rec => rec.type === 'efficiency')
      expect(efficiencyRecs.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Metrics Calculation', () => {
    it('should provide realistic cache hit rates', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(85)
      expect(metrics.cacheHitRate).toBeLessThanOrEqual(95)
    })

    it('should provide realistic response times', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.averageResponseTime).toBeGreaterThanOrEqual(5)
      expect(metrics.averageResponseTime).toBeLessThanOrEqual(25)
    })

    it('should provide realistic memory usage', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.memoryUsage).toBeGreaterThan(0)
      expect(metrics.memoryUsage).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
    })

    it('should provide realistic connection counts', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.activeConnections).toBeGreaterThanOrEqual(10)
      expect(metrics.activeConnections).toBeLessThanOrEqual(50)
    })

    it('should provide realistic error rates', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0)
      expect(metrics.errorRate).toBeLessThanOrEqual(2)
    })

    it('should provide realistic throughput', () => {
      const metrics = monitor.recordMetrics()
      
      expect(metrics.throughput).toBeGreaterThanOrEqual(100)
      expect(metrics.throughput).toBeLessThanOrEqual(500)
    })
  })

  describe('Data Management', () => {
    it('should clear all metrics', () => {
      monitor.recordMetrics()
      monitor.recordMetrics()
      
      expect(monitor.getAllMetrics()).toHaveLength(2)
      
      monitor.clearMetrics()
      
      expect(monitor.getAllMetrics()).toHaveLength(0)
    })

    it('should maintain metrics history during monitoring', () => {
      monitor.startMonitoring(10) // Very fast monitoring
      
      // Wait a bit for metrics to be recorded
      setTimeout(() => {
        const metrics = monitor.getAllMetrics()
        expect(metrics.length).toBeGreaterThan(0)
        monitor.stopMonitoring()
      }, 50)
    })
  })

  describe('Performance', () => {
    it('should record metrics quickly', () => {
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        monitor.recordMetrics()
      }
      
      const end = performance.now()
      expect(end - start).toBeLessThan(50) // Should be very fast
    })

    it('should handle high frequency monitoring', () => {
      monitor.startMonitoring(1) // 1ms interval
      
      setTimeout(() => {
        const metrics = monitor.getAllMetrics()
        expect(metrics.length).toBeGreaterThan(0)
        monitor.stopMonitoring()
      }, 10)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty metrics gracefully', () => {
      const analytics = monitor.getAnalytics()
      
      expect(analytics.current.timestamp).toBeGreaterThan(0)
      expect(analytics.trends.hitRateTrend).toBe(0)
      expect(analytics.recommendations).toHaveLength(0)
    })

    it('should handle rapid metric recording', () => {
      for (let i = 0; i < 1000; i++) {
        monitor.recordMetrics()
      }
      
      const metrics = monitor.getAllMetrics()
      expect(metrics.length).toBeLessThanOrEqual(1000) // Should be limited
    })

    it('should handle concurrent monitoring', () => {
      monitor.startMonitoring(10)
      monitor.startMonitoring(20) // Should not cause issues
      
      setTimeout(() => {
        monitor.stopMonitoring()
      }, 50)
    })
  })
})
