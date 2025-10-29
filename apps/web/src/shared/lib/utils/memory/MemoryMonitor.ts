/**
 * Memory Monitor - Real-time Memory Usage Tracking
 * 
 * Addresses critical memory issues:
 * - No visibility into memory usage patterns
 * - Missing memory leak detection
 * - No memory pressure monitoring
 * - Lack of memory optimization feedback
 */

export interface MemoryStats {
  used: number
  total: number
  available: number
  utilization: number
  timestamp: number
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'leak'
  message: string
  threshold: number
  current: number
  timestamp: number
}

export interface MemoryLeakDetection {
  isLeaking: boolean
  leakRate: number // MB per minute
  suspectedObjects: string[]
  recommendations: string[]
}

export class MemoryMonitor {
  private stats: MemoryStats[] = []
  private alerts: MemoryAlert[] = []
  private leakDetection: MemoryLeakDetection | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private readonly maxStatsHistory = 100
  private readonly alertThresholds = {
    warning: 80, // 80% memory usage
    critical: 95, // 95% memory usage
    leak: 5 // 5MB increase per minute
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring()
    }

    this.monitoringInterval = setInterval(() => {
      this.collectMemoryStats()
      this.checkMemoryAlerts()
      this.detectMemoryLeaks()
    }, intervalMs)
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Collect current memory statistics
   */
  private collectMemoryStats(): void {
    if (typeof performance === 'undefined' || !performance.memory) {
      return // Not available in this environment
    }

    const memory = performance.memory
    const stats: MemoryStats = {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      available: memory.jsHeapSizeLimit - memory.usedJSHeapSize,
      utilization: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      timestamp: Date.now()
    }

    this.stats.push(stats)

    // Keep only recent stats
    if (this.stats.length > this.maxStatsHistory) {
      this.stats.shift()
    }
  }

  /**
   * Check for memory alerts
   */
  private checkMemoryAlerts(): void {
    if (this.stats.length === 0) return

    const current = this.stats[this.stats.length - 1]
    
    // Check utilization thresholds
    if (current.utilization >= this.alertThresholds.critical) {
      this.addAlert({
        type: 'critical',
        message: `Critical memory usage: ${current.utilization.toFixed(1)}%`,
        threshold: this.alertThresholds.critical,
        current: current.utilization,
        timestamp: Date.now()
      })
    } else if (current.utilization >= this.alertThresholds.warning) {
      this.addAlert({
        type: 'warning',
        message: `High memory usage: ${current.utilization.toFixed(1)}%`,
        threshold: this.alertThresholds.warning,
        current: current.utilization,
        timestamp: Date.now()
      })
    }
  }

  /**
   * Detect potential memory leaks
   */
  private detectMemoryLeaks(): void {
    if (this.stats.length < 10) return // Need at least 10 data points

    const recent = this.stats.slice(-10)
    const leakRate = this.calculateLeakRate(recent)
    
    if (leakRate > this.alertThresholds.leak) {
      this.leakDetection = {
        isLeaking: true,
        leakRate,
        suspectedObjects: this.identifySuspectedObjects(),
        recommendations: this.generateRecommendations()
      }

      this.addAlert({
        type: 'leak',
        message: `Potential memory leak detected: ${leakRate.toFixed(2)}MB/min`,
        threshold: this.alertThresholds.leak,
        current: leakRate,
        timestamp: Date.now()
      })
    } else {
      this.leakDetection = {
        isLeaking: false,
        leakRate: 0,
        suspectedObjects: [],
        recommendations: []
      }
    }
  }

  /**
   * Calculate memory leak rate
   */
  private calculateLeakRate(stats: MemoryStats[]): number {
    if (stats.length < 2) return 0

    const first = stats[0]
    const last = stats[stats.length - 1]
    const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60 // minutes
    const memoryDiff = (last.used - first.used) / 1024 / 1024 // MB

    return timeDiff > 0 ? memoryDiff / timeDiff : 0
  }

  /**
   * Identify suspected objects causing leaks
   */
  private identifySuspectedObjects(): string[] {
    const suspects: string[] = []
    
    // Check for common leak patterns
    if (this.hasEventListeners()) {
      suspects.push('Event listeners not cleaned up')
    }
    
    if (this.hasTimers()) {
      suspects.push('Timers not cleared')
    }
    
    if (this.hasClosures()) {
      suspects.push('Large objects held in closures')
    }
    
    return suspects
  }

  /**
   * Generate memory optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    if (this.leakDetection?.isLeaking) {
      recommendations.push('Implement object pooling for frequently created objects')
      recommendations.push('Add proper cleanup in useEffect hooks')
      recommendations.push('Use WeakMap/WeakSet for object references')
      recommendations.push('Implement lazy loading for large datasets')
    }
    
    if (this.getCurrentUtilization() > 80) {
      recommendations.push('Consider implementing virtual scrolling')
      recommendations.push('Use memoization for expensive computations')
      recommendations.push('Implement data pagination')
      recommendations.push('Clear unused caches and pools')
    }
    
    return recommendations
  }

  /**
   * Add memory alert
   */
  private addAlert(alert: MemoryAlert): void {
    this.alerts.push(alert)
    
    // Keep only recent alerts
    if (this.alerts.length > 50) {
      this.alerts.shift()
    }
    
    // Log alert
    console.warn(`[MemoryMonitor] ${alert.type.toUpperCase()}: ${alert.message}`)
  }

  /**
   * Check for event listeners (simplified detection)
   */
  private hasEventListeners(): boolean {
    // This is a simplified check - in a real implementation,
    // you'd track event listeners more precisely
    return document.querySelectorAll('[data-event-listener]').length > 0
  }

  /**
   * Check for timers (simplified detection)
   */
  private hasTimers(): boolean {
    // This is a simplified check - in a real implementation,
    // you'd track timers more precisely
    return (window as any).__timers?.length > 0
  }

  /**
   * Check for closures (simplified detection)
   */
  private hasClosures(): boolean {
    // This is a simplified check - in a real implementation,
    // you'd analyze closure patterns more precisely
    return false
  }

  /**
   * Get current memory utilization
   */
  getCurrentUtilization(): number {
    if (this.stats.length === 0) return 0
    return this.stats[this.stats.length - 1].utilization
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats[] {
    return [...this.stats]
  }

  /**
   * Get memory alerts
   */
  getAlerts(): MemoryAlert[] {
    return [...this.alerts]
  }

  /**
   * Get leak detection results
   */
  getLeakDetection(): MemoryLeakDetection | null {
    return this.leakDetection
  }

  /**
   * Get memory usage summary
   */
  getSummary() {
    if (this.stats.length === 0) {
      return {
        current: { used: 0, total: 0, available: 0, utilization: 0 },
        average: { used: 0, total: 0, available: 0, utilization: 0 },
        peak: { used: 0, total: 0, available: 0, utilization: 0 },
        trend: 'stable'
      }
    }

    const current = this.stats[this.stats.length - 1]
    const average = this.calculateAverage()
    const peak = this.findPeak()
    const trend = this.calculateTrend()

    return {
      current,
      average,
      peak,
      trend
    }
  }

  /**
   * Calculate average memory usage
   */
  private calculateAverage(): MemoryStats {
    const sum = this.stats.reduce((acc, stat) => ({
      used: acc.used + stat.used,
      total: acc.total + stat.total,
      available: acc.available + stat.available,
      utilization: acc.utilization + stat.utilization,
      timestamp: 0
    }), { used: 0, total: 0, available: 0, utilization: 0, timestamp: 0 })

    const count = this.stats.length
    return {
      used: sum.used / count,
      total: sum.total / count,
      available: sum.available / count,
      utilization: sum.utilization / count,
      timestamp: Date.now()
    }
  }

  /**
   * Find peak memory usage
   */
  private findPeak(): MemoryStats {
    return this.stats.reduce((peak, current) => 
      current.used > peak.used ? current : peak
    )
  }

  /**
   * Calculate memory usage trend
   */
  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.stats.length < 5) return 'stable'

    const recent = this.stats.slice(-5)
    const first = recent[0].used
    const last = recent[recent.length - 1].used
    const change = (last - first) / first

    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.stats = []
    this.alerts = []
    this.leakDetection = null
  }

  /**
   * Export memory data for analysis
   */
  exportData() {
    return {
      stats: this.stats,
      alerts: this.alerts,
      leakDetection: this.leakDetection,
      summary: this.getSummary(),
      timestamp: Date.now()
    }
  }
}

// Global memory monitor instance
export const memoryMonitor = new MemoryMonitor()

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  memoryMonitor.startMonitoring(5000)
}

// Export the class and instance
export { MemoryMonitor }
export default memoryMonitor
