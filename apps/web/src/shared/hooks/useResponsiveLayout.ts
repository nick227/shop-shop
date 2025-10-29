/**
 * useResponsiveLayout - Responsive Layout Hook
 * 
 * Provides responsive layout utilities and breakpoint detection.
 * Replaces multiple responsive implementations with a unified system.
 * 
 * Features:
 * - Consistent breakpoint detection across all components
 * - Responsive layout utilities and helpers
 * - Performance optimized with proper memoization
 * - Type-safe responsive configuration
 */

import { useState, useEffect, useMemo } from 'react'

// ========================================
// Types & Interfaces
// ========================================

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide'

export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  isUltrawide: boolean
  breakpoint: Breakpoint
  width: number
  height: number
}

export interface BreakpointConfig {
  mobile: number
  tablet: number
  desktop: number
  wide: number
  ultrawide: number
}

// ========================================
// Default Breakpoint Configuration
// ========================================

const defaultBreakpoints: BreakpointConfig = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536
}

// ========================================
// Responsive Layout Hook
// ========================================

export function useResponsiveLayout(
  customBreakpoints?: Partial<BreakpointConfig>
): ResponsiveConfig {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })
  
  // Merge custom breakpoints with defaults
  const breakpoints = useMemo(() => ({
    ...defaultBreakpoints,
    ...customBreakpoints
  }), [customBreakpoints])
  
  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Call handler right away so state gets updated with initial window size
    handleResize()
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Determine current breakpoint
  const breakpoint = useMemo((): Breakpoint => {
    const { width } = windowSize
    
    if (width >= breakpoints.ultrawide) return 'ultrawide'
    if (width >= breakpoints.wide) return 'wide'
    if (width >= breakpoints.desktop) return 'desktop'
    if (width >= breakpoints.tablet) return 'tablet'
    return 'mobile'
  }, [windowSize.width, breakpoints])
  
  // Determine responsive flags
  const responsiveConfig = useMemo((): ResponsiveConfig => {
    const { width, height } = windowSize
    
    return {
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      isWide: breakpoint === 'wide',
      isUltrawide: breakpoint === 'ultrawide',
      breakpoint,
      width,
      height
    }
  }, [breakpoint, windowSize.width, windowSize.height])
  
  return responsiveConfig
}

// ========================================
// Responsive Utility Functions
// ========================================

/**
 * Get responsive value based on breakpoint
 */
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  wide?: T
  ultrawide?: T
}): T | undefined {
  const { breakpoint } = useResponsiveLayout()
  
  return useMemo(() => {
    switch (breakpoint) {
      case 'ultrawide':
        return values.ultrawide ?? values.wide ?? values.desktop ?? values.tablet ?? values.mobile
      case 'wide':
        return values.wide ?? values.desktop ?? values.tablet ?? values.mobile
      case 'desktop':
        return values.desktop ?? values.tablet ?? values.mobile
      case 'tablet':
        return values.tablet ?? values.mobile
      case 'mobile':
        return values.mobile
      default:
        return values.mobile
    }
  }, [breakpoint, values])
}

/**
 * Get responsive class names based on breakpoint
 */
export function useResponsiveClasses(classes: {
  mobile?: string
  tablet?: string
  desktop?: string
  wide?: string
  ultrawide?: string
}): string {
  const { breakpoint } = useResponsiveLayout()
  
  return useMemo(() => {
    switch (breakpoint) {
      case 'ultrawide':
        return classes.ultrawide ?? classes.wide ?? classes.desktop ?? classes.tablet ?? classes.mobile ?? ''
      case 'wide':
        return classes.wide ?? classes.desktop ?? classes.tablet ?? classes.mobile ?? ''
      case 'desktop':
        return classes.desktop ?? classes.tablet ?? classes.mobile ?? ''
      case 'tablet':
        return classes.tablet ?? classes.mobile ?? ''
      case 'mobile':
        return classes.mobile ?? ''
      default:
        return classes.mobile ?? ''
    }
  }, [breakpoint, classes])
}

/**
 * Check if current breakpoint matches any of the provided breakpoints
 */
export function useBreakpointMatch(breakpoints: Breakpoint[]): boolean {
  const { breakpoint } = useResponsiveLayout()
  
  return useMemo(() => {
    return breakpoints.includes(breakpoint)
  }, [breakpoint, breakpoints])
}

/**
 * Get responsive spacing value
 */
export function useResponsiveSpacing(spacing: {
  mobile?: string
  tablet?: string
  desktop?: string
  wide?: string
  ultrawide?: string
}): string {
  const { breakpoint } = useResponsiveLayout()
  
  return useMemo(() => {
    switch (breakpoint) {
      case 'ultrawide':
        return spacing.ultrawide ?? spacing.wide ?? spacing.desktop ?? spacing.tablet ?? spacing.mobile ?? '0'
      case 'wide':
        return spacing.wide ?? spacing.desktop ?? spacing.tablet ?? spacing.mobile ?? '0'
      case 'desktop':
        return spacing.desktop ?? spacing.tablet ?? spacing.mobile ?? '0'
      case 'tablet':
        return spacing.tablet ?? spacing.mobile ?? '0'
      case 'mobile':
        return spacing.mobile ?? '0'
      default:
        return spacing.mobile ?? '0'
    }
  }, [breakpoint, spacing])
}

// ========================================
// Exports
// ========================================

export default useResponsiveLayout
export type { 
  ResponsiveConfig, 
  Breakpoint, 
  BreakpointConfig 
}
