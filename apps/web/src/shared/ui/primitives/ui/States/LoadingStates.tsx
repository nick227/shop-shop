// @ts-nocheck
/**
 * Unified Loading States System
 * 
 * Provides consistent loading patterns across the entire application.
 * Replaces multiple loading implementations with a single, unified system.
 * 
 * Features:
 * - Consistent sizing scale across all components
 * - Multiple loading variants (spinner, skeleton, dots, pulse)
 * - Responsive loading states
 * - Accessibility support
 * - Performance optimized
 */

import React, { memo } from 'react'
import { Loader2, MoreHorizontal } from 'lucide-react'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LoadingVariant = 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'inline'
export type SkeletonVariant = 'card' | 'text' | 'avatar' | 'button' | 'input'

export interface LoadingConfig {
  size?: LoadingSize
  variant?: LoadingVariant
  message?: string
  fullScreen?: boolean
  inline?: boolean
  className?: string
}

export interface SkeletonConfig {
  count?: number
  variant?: SkeletonVariant
  className?: string
  width?: string | number
  height?: string | number
}

// ========================================
// Size & Animation Mappings
// ========================================

const sizeMap: Record<LoadingSize, { icon: string; text: string; spacing: string }> = {
  xs: { icon: 'h-3 w-3', text: 'text-xs', spacing: 'gap-1' },
  sm: { icon: 'h-4 w-4', text: 'text-sm', spacing: 'gap-2' },
  md: { icon: 'h-6 w-6', text: 'text-base', spacing: 'gap-3' },
  lg: { icon: 'h-8 w-8', text: 'text-lg', spacing: 'gap-4' },
  xl: { icon: 'h-12 w-12', text: 'text-xl', spacing: 'gap-6' }
}

const skeletonVariants: Record<SkeletonVariant, string> = {
  card: 'rounded-lg',
  text: 'rounded',
  avatar: 'rounded-full',
  button: 'rounded-md',
  input: 'rounded-md'
}

// ========================================
// Loading Components
// ========================================

/**
 * Inline Loading - For buttons, small areas
 */
export const InlineLoading = memo<LoadingConfig>(({ 
  size = 'sm', 
  variant = 'spinner',
  message,
  className 
}) => {
  const { icon, text, spacing } = sizeMap[size]
  
  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex items-center', spacing, className)}>
        <Loader2 className={cn(icon, 'animate-spin text-primary')} />
        {message && <span className={cn(text, 'text-muted-foreground')}>{message}</span>}
      </div>
    )
  }
  
  return (
    <div className={cn('inline-flex items-center justify-center', spacing, className)}>
      <Loader2 className={cn(icon, 'animate-spin text-primary')} />
      {message && <span className={cn(text, 'text-muted-foreground')}>{message}</span>}
    </div>
  )
})

/**
 * Content Loading - Replacing content areas
 */
export const ContentLoading = memo<LoadingConfig>(({ 
  size = 'md', 
  variant = 'spinner',
  message = 'Loading...',
  className 
}) => {
  const { icon, text, spacing } = sizeMap[size]
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {variant === 'spinner' && (
        <Loader2 className={cn(icon, 'animate-spin text-primary mb-4')} />
      )}
      
      {variant === 'dots' && (
        <div className={cn('flex items-center', spacing, 'mb-4')}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-primary animate-pulse',
                size === 'xs' ? 'w-1 h-1' : (size === 'sm' ? 'w-2 h-2' : 'w-3 h-3')
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      {variant === 'pulse' && (
        <div className={cn(
          'rounded-full bg-primary animate-pulse mb-4',
          size === 'xs' ? 'w-6 h-6' : (size === 'sm' ? 'w-8 h-8' : 'w-12 h-12')
        )} />
      )}
      
      {message && (
        <p className={cn(text, 'text-muted-foreground')}>{message}</p>
      )}
    </div>
  )
})

/**
 * Full Screen Loading - For page transitions
 */
export const FullScreenLoading = memo<LoadingConfig>(({ 
  size = 'lg', 
  variant = 'spinner',
  message = 'Loading...',
  className 
}) => {
  const { icon, text, spacing } = sizeMap[size]
  
  return (
    <div className={cn(
      'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}>
      <div className={cn('flex flex-col items-center', spacing)}>
        {variant === 'spinner' && (
          <Loader2 className={cn(icon, 'animate-spin text-primary')} />
        )}
        
        {variant === 'dots' && (
          <div className={cn('flex items-center', spacing)}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-primary animate-pulse',
                  size === 'sm' ? 'w-2 h-2' : (size === 'md' ? 'w-3 h-3' : 'w-4 h-4')
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}
        
        {message && (
          <p className={cn(text, 'text-muted-foreground')}>{message}</p>
        )}
      </div>
    </div>
  )
})

/**
 * Skeleton Loading - For content placeholders
 */
export const SkeletonLoading = memo<SkeletonConfig>(({ 
  count = 3, 
  variant = 'card',
  className,
  width,
  height 
}) => {
  const baseClasses = cn(
    'animate-pulse bg-muted',
    skeletonVariants[variant],
    className
  )
  
  const style = {
    width: width || (variant === 'avatar' ? '40px' : '100%'),
    height: height || (variant === 'avatar' ? '40px' : (variant === 'text' ? '16px' : '200px'))
  }
  
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={baseClasses}
          style={style}
        />
      ))}
    </div>
  )
})

/**
 * Skeleton List - For list placeholders
 */
export const SkeletonList = memo<{ count?: number; variant?: SkeletonVariant }>(({ 
  count = 3, 
  variant = 'card' 
}) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start space-x-4">
          {variant === 'card' && (
            <>
              <div className="w-12 h-12 bg-muted animate-pulse rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
})

// ========================================
// Main Loading States Object
// ========================================

export const LoadingStates = {
  // Inline loading (buttons, small areas)
  Inline: InlineLoading,
  
  // Content loading (replacing content)
  Content: ContentLoading,
  
  // Full screen loading
  FullScreen: FullScreenLoading,
  
  // Skeleton loading for lists
  Skeleton: SkeletonLoading,
  SkeletonList: SkeletonList,
  
  // Quick access methods
  spinner: (size: LoadingSize = 'md') => <InlineLoading size={size} variant="spinner" />,
  dots: (size: LoadingSize = 'md') => <InlineLoading size={size} variant="dots" />,
  pulse: (size: LoadingSize = 'md') => <InlineLoading size={size} variant="pulse" />,
  skeleton: (count = 3) => <SkeletonLoading count={count} variant="card" />
} as const

// ========================================
// Exports
// ========================================

export default LoadingStates
export type { LoadingConfig, SkeletonConfig, LoadingSize, LoadingVariant, SkeletonVariant }
