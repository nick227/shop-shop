// @ts-nocheck
/**
 * Enhanced Button Component - Unified Button System
 * 
 * Provides consistent button patterns across the entire application.
 * Replaces multiple button implementations with a single, unified system.
 * 
 * Features:
 * - Consistent sizing scale across all components
 * - Unified variant system with proper color mapping
 * - Integrated loading states with LoadingStates system
 * - Icon support with proper positioning
 * - Accessibility support
 * - Performance optimized
 */

import React, { forwardRef, memo } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { Loader2 } from 'lucide-react'
import { LoadingStates } from '../States/LoadingStates'
import { cn } from '@shared/lib/cn'

// ========================================
// Enhanced Button Variants
// ========================================

const buttonVariants = tv({
  base: [
    // Base styles
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
    'transition-all duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
    // Hover effects
    'hover:shadow-sm',
    // Focus styles
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
  ],
  variants: {
    variant: {
      primary: [
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 hover:shadow-md',
        'active:bg-primary/95'
      ],
      secondary: [
        'bg-secondary text-secondary-foreground',
        'hover:bg-secondary/80 hover:shadow-sm',
        'active:bg-secondary/90'
      ],
      outline: [
        'border border-input bg-background',
        'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
        'active:bg-accent/80'
      ],
      ghost: [
        'hover:bg-accent hover:text-accent-foreground',
        'active:bg-accent/80'
      ],
      destructive: [
        'bg-destructive text-destructive-foreground',
        'hover:bg-destructive/90 hover:shadow-md',
        'active:bg-destructive/95'
      ],
      success: [
        'bg-green-600 text-white',
        'hover:bg-green-700 hover:shadow-md',
        'active:bg-green-800'
      ],
      warning: [
        'bg-yellow-600 text-white',
        'hover:bg-yellow-700 hover:shadow-md',
        'active:bg-yellow-800'
      ],
      link: [
        'text-primary underline-offset-4',
        'hover:underline hover:text-primary/80',
        'active:text-primary/90'
      ]
    },
    size: {
      xs: 'h-6 px-2 text-xs font-medium',
      sm: 'h-8 px-3 text-sm font-medium',
      md: 'h-10 px-4 text-base font-medium',
      lg: 'h-12 px-6 text-lg font-medium',
      xl: 'h-14 px-8 text-xl font-medium',
      icon: 'h-10 w-10 p-0'
    },
    fullWidth: {
      true: 'w-full'
    },
    loading: {
      true: 'cursor-wait'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
})

// ========================================
// Enhanced Button Props
// ========================================

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // Loading state
  loading?: boolean
  loadingText?: string
  
  // Icon support
  icon?: React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  
  // Enhanced features
  tooltip?: string
  badge?: string | number
  
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}

// ========================================
// Enhanced Button Component
// ========================================

const EnhancedButtonComponent = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    loadingText,
    icon: Icon,
    iconPosition = 'left',
    tooltip,
    badge,
    children,
    disabled,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    
    // ========================================
    // Computed Values
    // ========================================
    
    const isDisabled = disabled || loading
    const showLoading = loading && !Icon // Don't show loading spinner if there's an icon
    
    // Determine loading text
    const displayLoadingText = loadingText || (loading ? 'Loading...' : undefined)
    
    // ========================================
    // Render Content
    // ========================================
    
    const renderContent = () => {
      if (showLoading) {
        return (
          <>
            <LoadingStates.Inline 
              size={size === 'xs' ? 'xs' : (size === 'sm' ? 'sm' : 'md')}
              variant="spinner"
            />
            {displayLoadingText && (
              <span className="ml-2">{displayLoadingText}</span>
            )}
          </>
        )
      }
      
      return (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="h-4 w-4" />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon className="h-4 w-4" />
          )}
          {badge && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {badge}
            </span>
          )}
        </>
      )
    }
    
    // ========================================
    // Render Button
    // ========================================
    
    return (
      <button
        ref={ref}
        className={buttonVariants({
          variant,
          size,
          fullWidth,
          loading,
          className
        })}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        title={tooltip}
        {...props}
      >
        {renderContent()}
      </button>
    )
  }
)

EnhancedButtonComponent.displayName = 'EnhancedButton'

// ========================================
// Memoized Export
// ========================================

export const EnhancedButton = memo(EnhancedButtonComponent)

// ========================================
// Button Variants for Easy Access
// ========================================

export const ButtonVariants = {
  // Primary buttons
  Primary: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="primary" />
  ),
  
  // Secondary buttons
  Secondary: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="secondary" />
  ),
  
  // Outline buttons
  Outline: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="outline" />
  ),
  
  // Ghost buttons
  Ghost: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="ghost" />
  ),
  
  // Destructive buttons
  Destructive: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="destructive" />
  ),
  
  // Success buttons
  Success: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="success" />
  ),
  
  // Warning buttons
  Warning: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="warning" />
  ),
  
  // Link buttons
  Link: (props: Omit<EnhancedButtonProps, 'variant'>) => (
    <EnhancedButton {...props} variant="link" />
  )
} as const

// ========================================
// Exports
// ========================================

export default EnhancedButton
export type { EnhancedButtonProps }
