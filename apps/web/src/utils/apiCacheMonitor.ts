/**
 * API Cache Monitor - Development utility for monitoring API cache performance
 * Only included in development builds
 */

import { apiClient } from '@api/client'

export interface CacheMonitorStats {
  cacheSize: number
  maxCacheSize: number
  memoryUsage: number
  timestamp: number
  configVersion?: number
  instanceVersions?: Record<string, number>
  staleInstances?: string[]
  hitRate?: number
  missRate?: number
  totalRequests?: number
  averageAccessTime?: number
}

class ApiCacheMonitor {
  private static instance: ApiCacheMonitor | null = null
  private stats: CacheMonitorStats[] = []
  private readonly maxStatsHistory = 100

  static getInstance(): ApiCacheMonitor {
    if (!this.instance) {
      this.instance = new ApiCacheMonitor()
    }
    return this.instance
  }

  /**
   * Record current cache statistics
   */
  recordStats(): CacheMonitorStats {
    const cacheStats = apiClient?.getCacheStats()
    const memoryUsage = this?.getMemoryUsage()
    
    const stats: CacheMonitorStats = {
      cacheSize: (cacheStats as any)?.cacheSize || 0,
      maxCacheSize: (cacheStats as any)?.maxCacheSize || 1000,
      memoryUsage: memoryUsage || 0,
      timestamp: Date.now(),
      configVersion: (cacheStats as any)?.configVersion,
      instanceVersions: (cacheStats as any)?.instanceVersions,
      staleInstances: (cacheStats as any)?.staleInstances,
      hitRate: (cacheStats as any)?.hitRate,
      missRate: (cacheStats as any)?.missRate,
      totalRequests: (cacheStats as any)?.totalRequests,
      averageAccessTime: (cacheStats as any)?.averageAccessTime
    }
    
    this.stats?.push(stats)
    
    // Keep only recent stats
    if (this.stats.length > this.maxStatsHistory) {
      this.stats = this.stats?.slice(-this.maxStatsHistory)
    }
    
    return stats
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return undefined
  }

  /**
   * Get cache performance report
   */
  getPerformanceReport(): string {
    if (this.stats.length === 0) {
      return 'No cache statistics available'
    }

    const latest = this.stats[this.stats.length - 1]
    if (!latest) return 'No cache statistics available'
    
    const avgCacheSize = this.stats.reduce((sum, stat) => sum + stat.cacheSize, 0) / this.stats.length
    const memoryStats = this.stats.filter(stat => stat.memoryUsage !== undefined)
    const avgMemoryUsage = memoryStats.length > 0 
      ? memoryStats.reduce((sum, stat) => sum + (stat.memoryUsage || 0), 0) / memoryStats.length
      : 0

    return ('API Cache Performance Report:\n============================\nCurrent Cache Size: ' + latest.cacheSize + '/' + latest.maxCacheSize + '\nAverage Cache Size: ' + avgCacheSize.toFixed(1) + '\nConfig Version: ' + (latest.configVersion || 0) + '\nMemory Usage: ' + (latest.memoryUsage ? latest.memoryUsage.toFixed(2) + 'MB' : 'N/A') + '\nAverage Memory: ' + (avgMemoryUsage ? avgMemoryUsage.toFixed(2) + 'MB' : 'N/A') + '\n\nPerformance Recommendations:\n' + this.getRecommendations(latest, avgCacheSize, avgMemoryUsage)).trim()
  }

  private getRecommendations(
    latest: CacheMonitorStats,
    avgCacheSize: number,
    avgMemoryUsage: number
  ): string {
    const recommendations: string[] = []

    if (latest.cacheSize >= latest.maxCacheSize * 0.8) {
      recommendations.push('- Cache is near capacity, consider increasing maxCacheSize')
    }

    if (avgMemoryUsage > 50) {
      recommendations.push('- High memory usage detected, consider clearing cache periodically')
    }

    if (latest.configVersion && latest.configVersion > 10) {
      recommendations.push('- High config version indicates frequent token changes')
    }

    if (recommendations.length === 0) {
      recommendations.push('- Cache performance looks good!')
    }

    return recommendations.join('\n')
  }

  /**
   * Clear all statistics
   */
  clearStats(): void {
    this.stats = []
  }

  /**
   * Get all recorded statistics
   */
  getAllStats(): CacheMonitorStats[] {
    return [...this.stats]
  }
}

// Export singleton instance
export const apiCacheMonitor = ApiCacheMonitor.getInstance()

// Development-only: Add to window for debugging
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).apiCacheMonitor = apiCacheMonitor
}
