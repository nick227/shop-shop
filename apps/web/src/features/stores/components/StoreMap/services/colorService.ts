/**
 * ColorService - Service for managing map colors
 * Single Responsibility: Color management and CSS variable access
 */
export interface CircleOptions {
  color: string
  fillColor: string
  fillOpacity: number
  weight: number
}

export class ColorService {
  private static cachedSuccessColor: string | null = null
  private static readonly cachedCircleOptions = new Map<string, CircleOptions>()

  static getSuccessColor(): string {
    if (!this.cachedSuccessColor && typeof window !== 'undefined') {
      const style = getComputedStyle(document.documentElement)
      this.cachedSuccessColor = style.getPropertyValue('--color-success').trim() || '#10b981'
    }
    return this.cachedSuccessColor || '#10b981'
  }

  static getCircleOptions(color?: string): CircleOptions {
    const successColor = color || this.getSuccessColor()
    const cacheKey = successColor
    
    if (!this.cachedCircleOptions.has(cacheKey)) {
      this.cachedCircleOptions.set(cacheKey, {
        color: successColor,
        fillColor: successColor,
        fillOpacity: 0.1,
        weight: 2
      })
    }
    
    return this.cachedCircleOptions.get(cacheKey)!
  }
}
