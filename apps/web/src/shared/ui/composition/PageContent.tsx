// @ts-nocheck
/**
 * PageContent - Professional Content Area Component
 * 
 * Provides consistent content area patterns across all layouts.
 * Replaces multiple content implementations with a unified system.
 * 
 * Features:
 * - Consistent content spacing and max-widths
 * - Professional background and padding patterns
 * - Responsive design with mobile-first approach
 * - Accessibility support with proper ARIA attributes
 * - Performance optimized with proper memoization
 */

import React, { memo, useMemo } from 'react'
import { cn } from '@shared/lib/utils/cn'
import { spacing, semanticSpacing } from '@shared/lib/utils/spacing'

// ========================================
// Types & Interfaces
// ========================================

export type ContentVariant = 'app' | 'auth' | 'marketing' | 'admin' | 'mobile'
export type ContentMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
export type ContentPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'
export type ContentBackground = 'transparent' | 'muted' | 'card' | 'primary' | 'secondary'

export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export interface PageContentProps {
  variant: ContentVariant
  maxWidth?: ContentMaxWidth
  padding?: ContentPadding
  background?: ContentBackground
  responsive: ResponsiveConfig
  className?: string
  children: React.ReactNode
}

// ========================================
// Content Variant Configurations
// ========================================

const contentConfigs: Record<ContentVariant, {
  maxWidth: ContentMaxWidth
  padding: ContentPadding
  background: ContentBackground
  classes: {
    container: string
    content: string
  }
}> = {
  app: {
    maxWidth: '4xl',
    padding: 'lg',
    background: 'transparent',
    classes: {
      container: 'w-full mx-auto',
      content: 'min-h-screen'
    }
  },
  auth: {
    maxWidth: 'md',
    padding: 'xl',
    background: 'card',
    classes: {
      container: 'w-full mx-auto',
      content: 'min-h-screen flex items-center justify-center'
    }
  },
  marketing: {
    maxWidth: 'full',
    padding: 'none',
    background: 'transparent',
    classes: {
      container: 'w-full',
      content: 'min-h-screen'
    }
  },
  admin: {
    maxWidth: '7xl',
    padding: 'lg',
    background: 'muted',
    classes: {
      container: 'w-full mx-auto',
      content: 'min-h-screen'
    }
  },
  mobile: {
    maxWidth: 'full',
    padding: 'sm',
    background: 'transparent',
    classes: {
      container: 'w-full',
      content: 'min-h-screen'
    }
  }
}

// ========================================
// Max Width Mappings
// ========================================

const maxWidthMappings: Record<ContentMaxWidth, string> = {
  sm: 'max-w-sm',      // 384px
  md: 'max-w-md',      // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-xl',      // 576px
  '2xl': 'max-w-2xl',  // 672px
  '3xl': 'max-w-3xl',  // 768px
  '4xl': 'max-w-4xl',  // 896px
  '5xl': 'max-w-5xl',  // 1024px
  '6xl': 'max-w-6xl',  // 1152px
  '7xl': 'max-w-7xl',  // 1280px
  full: 'max-w-full'
}

// ========================================
// Padding Mappings
// ========================================

const paddingMappings: Record<ContentPadding, string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12'
}

// ========================================
// Background Mappings
// ========================================

const backgroundMappings: Record<ContentBackground, string> = {
  transparent: 'bg-transparent',
  muted: 'bg-muted',
  card: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground'
}

// ========================================
// PageContent Component
// ========================================

const PageContentComponent = memo<PageContentProps>(({
  variant,
  maxWidth,
  padding,
  background,
  responsive,
  className,
  children
}) => {
  const { isMobile, isTablet, isDesktop } = responsive
  
  // ========================================
  // Computed Values
  // ========================================
  
  const config = useMemo(() => ({
    ...contentConfigs[variant],
    maxWidth: maxWidth || contentConfigs[variant].maxWidth,
    padding: padding || contentConfigs[variant].padding,
    background: background || contentConfigs[variant].background
  }), [variant, maxWidth, padding, background])
  
  // ========================================
  // Content Classes
  // ========================================
  
  const containerClasses = cn(
    config.classes.container,
    maxWidthMappings[config.maxWidth],
    {
      'px-4': isMobile,
      'px-6': isTablet,
      'px-8': isDesktop,
    },
    className
  )
  
  const contentClasses = cn(
    config.classes.content,
    paddingMappings[config.padding],
    backgroundMappings[config.background],
    {
      'py-4': isMobile,
      'py-6': isTablet,
      'py-8': isDesktop,
    }
  )
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  )
})

PageContentComponent.displayName = 'PageContent'

// ========================================
// Exports
// ========================================

export { PageContentComponent as PageContent }
export default PageContentComponent
export type { 
  PageContentProps, 
  ContentVariant, 
  ContentMaxWidth, 
  ContentPadding, 
  ContentBackground,
  ResponsiveConfig
}
