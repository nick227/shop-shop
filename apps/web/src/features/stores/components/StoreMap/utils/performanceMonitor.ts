/**
 * PerformanceMonitor - Map performance monitoring and optimization utilities
 * Single Responsibility: Performance tracking and optimization recommendations
 */
import { OptimizedIconService } from '../services/optimizedIconService'

export interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  iconCacheStats: {
    size: number
    maxSize: number
    hitRate: number
  }
  storeCount: number
  markerCount: number
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = []
  private static readonly maxMetricsHistory = 100

  static startRender(): number {
    return performance.now()
  }

  static endRender(startTime: number, storeCount: number, markerCount: number): PerformanceMetrics {
    const renderTime = performance.now() - startTime
    const memoryUsage = this.getMemoryUsage()
    const iconCacheStats = OptimizedIconService.getCacheStats()

    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      iconCacheStats,
      storeCount,
      markerCount
    }

    this.recordMetrics(metrics)
    return metrics
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  private static recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }
  }

  static getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {}

    // Optimized: Single pass with primitive accumulation (no object creation)
    let renderTimeSum = 0
    let memoryUsageSum = 0
    let storeCountSum = 0
    let markerCountSum = 0

    for (const metrics of this.metrics) {
      renderTimeSum += metrics.renderTime
      memoryUsageSum += metrics.memoryUsage
      storeCountSum += metrics.storeCount
      markerCountSum += metrics.markerCount
    }

    const count = this.metrics.length
    return {
      renderTime: renderTimeSum / count,
      memoryUsage: memoryUsageSum / count,
      storeCount: storeCountSum / count,
      markerCount: markerCountSum / count
    }
  }

  static getPerformanceReport(): string {
    const avg = this.getAverageMetrics()
    const latest = this.metrics[this.metrics.length - 1]
    const iconStats = OptimizedIconService.getCacheStats()

    return ('Map Performance Report:\n======================\nAverage Render Time: ' + (avg.renderTime?.toFixed(2) || '0') + 'ms\nAverage Memory Usage: ' + (avg.memoryUsage?.toFixed(2) || '0') + 'MB\nLatest Store Count: ' + (latest?.storeCount || 0) + '\nLatest Marker Count: ' + (latest?.markerCount || 0) + '\n\nIcon Cache Stats:\n- Cache Size: ' + iconStats.size + '/' + iconStats.maxSize + '\n- Hit Rate: ' + (iconStats.hitRate * 100).toFixed(1) + '%\n\nPerformance Recommendations:\n' + this.getRecommendations(avg, iconStats)).trim()
  }

  private static getRecommendations(avg: Partial<PerformanceMetrics>, iconStats: any): string {
    const recommendations: string[] = []

    if (avg.renderTime && avg.renderTime > 16) {
      recommendations.push('- Consider reducing store count or using virtual scrolling')
    }

    if (avg.memoryUsage && avg.memoryUsage > 50) {
      recommendations.push('- Memory usage is high, consider clearing icon cache')
    }

    if (iconStats.hitRate < 0.8) {
      recommendations.push('- Icon cache hit rate is low, check for unnecessary icon recreation')
    }

    if (avg.storeCount && avg.storeCount > 100) {
      recommendations.push('- Large store count detected, consider pagination or clustering')
    }

    if (recommendations.length === 0) {
      recommendations.push('- Performance looks good!')
    }

    return recommendations.join('\n')
  }

  static clearMetrics(): void {
    this.metrics = []
  }

  static getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics]
  }
}
