// @ts-nocheck
/**
 * Composition Provider - Context for Composition System
 * 
 * Provides composition context and configuration across the application.
 * Enables consistent composition patterns and responsive behavior.
 */

import type { ReactNode} from 'react';
import React, { createContext, useContext, useMemo, memo } from 'react'
import { useResponsiveLayout } from '@shared/hooks/useResponsiveLayout'

// ========================================
// Types & Interfaces
// ========================================

export interface CompositionConfig {
  // Responsive configuration
  responsive: {
    enabled: boolean
    breakpoints: {
      mobile: number
      tablet: number
      desktop: number
    }
  }
  
  // Accessibility configuration
  accessibility: {
    enabled: boolean
    ariaLabels: boolean
    keyboardNavigation: boolean
    screenReaderSupport: boolean
  }
  
  // Performance configuration
  performance: {
    memoization: boolean
    lazyLoading: boolean
    virtualization: boolean
  }
  
  // Theme configuration
  theme: {
    mode: 'light' | 'dark' | 'auto'
    primaryColor: string
    secondaryColor: string
  }
}

export interface CompositionContextValue {
  config: CompositionConfig
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isWide: boolean
  isUltrawide: boolean
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultrawide'
}

// ========================================
// Default Configuration
// ========================================

const defaultConfig: CompositionConfig = {
  responsive: {
    enabled: true,
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1280
    }
  },
  accessibility: {
    enabled: true,
    ariaLabels: true,
    keyboardNavigation: true,
    screenReaderSupport: true
  },
  performance: {
    memoization: true,
    lazyLoading: true,
    virtualization: false
  },
  theme: {
    mode: 'auto',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b'
  }
}

// ========================================
// Context
// ========================================

const CompositionContext = createContext<CompositionContextValue | undefined>(undefined)

// ========================================
// Composition Provider Component
// ========================================

export interface CompositionProviderProps {
  config?: Partial<CompositionConfig>
  children: ReactNode
}

export const CompositionProvider = memo<CompositionProviderProps>(({
  config: userConfig,
  children
}) => {
  const { isMobile, isTablet, isDesktop, isWide, isUltrawide } = useResponsiveLayout()
  
  // Merge user config with default config
  const config = useMemo(() => ({
    ...defaultConfig,
    ...userConfig,
    responsive: {
      ...defaultConfig.responsive,
      ...userConfig?.responsive
    },
    accessibility: {
      ...defaultConfig.accessibility,
      ...userConfig?.accessibility
    },
    performance: {
      ...defaultConfig.performance,
      ...userConfig?.performance
    },
    theme: {
      ...defaultConfig.theme,
      ...userConfig?.theme
    }
  }), [userConfig])
  
  // Determine current breakpoint
  const breakpoint = useMemo(() => {
    if (isUltrawide) return 'ultrawide'
    if (isWide) return 'wide'
    if (isDesktop) return 'desktop'
    if (isTablet) return 'tablet'
    return 'mobile'
  }, [isMobile, isTablet, isDesktop, isWide, isUltrawide])
  
  const contextValue = useMemo(() => ({
    config,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isUltrawide,
    breakpoint
  }), [config, isMobile, isTablet, isDesktop, isWide, isUltrawide, breakpoint])
  
  return (
    <CompositionContext.Provider value={contextValue}>
      {children}
    </CompositionContext.Provider>
  )
})

CompositionProvider.displayName = 'CompositionProvider'

// ========================================
// Composition Hook
// ========================================

export const useComposition = (): CompositionContextValue => {
  const context = useContext(CompositionContext)
  
  if (context === undefined) {
    throw new Error('useComposition must be used within a CompositionProvider')
  }
  
  return context
}

// ========================================
// Composition Hooks
// ========================================

/**
 * Hook for responsive composition values
 */
export const useResponsiveComposition = <T,>(config: {
  mobile: T
  tablet: T
  desktop: T
  wide?: T
  ultrawide?: T
}): T => {
  const { isMobile, isTablet, isDesktop, isWide, isUltrawide } = useComposition()
  
  return useMemo(() => {
    if (isUltrawide && config.ultrawide) return config.ultrawide
    if (isWide && config.wide) return config.wide
    if (isDesktop) return config.desktop
    if (isTablet) return config.tablet
    return config.mobile
  }, [isMobile, isTablet, isDesktop, isWide, isUltrawide, config])
}

/**
 * Hook for composition configuration
 */
export const useCompositionConfig = (): CompositionConfig => {
  const { config } = useComposition()
  return config
}

/**
 * Hook for responsive breakpoint information
 */
export const useCompositionBreakpoint = () => {
  const { isMobile, isTablet, isDesktop, isWide, isUltrawide, breakpoint } = useComposition()
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isUltrawide,
    breakpoint,
    isSmall: isMobile,
    isMedium: isTablet,
    isLarge: isDesktop,
    isXLarge: isWide,
    isXXLarge: isUltrawide
  }
}

/**
 * Hook for accessibility configuration
 */
export const useCompositionAccessibility = () => {
  const { config } = useComposition()
  
  return {
    enabled: config.accessibility.enabled,
    ariaLabels: config.accessibility.ariaLabels,
    keyboardNavigation: config.accessibility.keyboardNavigation,
    screenReaderSupport: config.accessibility.screenReaderSupport
  }
}

/**
 * Hook for performance configuration
 */
export const useCompositionPerformance = () => {
  const { config } = useComposition()
  
  return {
    memoization: config.performance.memoization,
    lazyLoading: config.performance.lazyLoading,
    virtualization: config.performance.virtualization
  }
}

/**
 * Hook for theme configuration
 */
export const useCompositionTheme = () => {
  const { config } = useComposition()
  
  return {
    mode: config.theme.mode,
    primaryColor: config.theme.primaryColor,
    secondaryColor: config.theme.secondaryColor
  }
}

// ========================================
// Exports
// ========================================

export type { CompositionProviderProps, CompositionConfig, CompositionContextValue }
