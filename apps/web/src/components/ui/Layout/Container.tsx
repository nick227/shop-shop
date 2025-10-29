/**
 * Container Component - Unified Layout Container
 * 
 * Provides consistent container patterns across the entire application.
 * Replaces hardcoded container implementations with a unified system.
 * 
 * Features:
 * - Consistent max-widths and padding
 * - Responsive container sizes
 * - Centering and alignment options
 * - Semantic container types
 * - Performance optimized
 */

import React, { forwardRef } from 'react'
import { tv, type VariantProps } from 'tailwind-variants'
import { cn } from '@utils/cn'
import { spacing, semanticSpacing } from '@utils/spacing'

// ========================================
// Container Variants
// ========================================

const containerVariants = tv({
  base: [
    'w-full',
    'mx-auto',
    'px-4 sm:px-6 lg:px-8'
  ],
  variants: {
    size: {
      xs: 'max-w-xs',      // 320px
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
      full: 'max-w-full',
      screen: 'max-w-screen-xl'
    },
    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-12',
      '2xl': 'p-16'
    },
    center: {
      true: 'flex items-center justify-center'
    },
    fluid: {
      true: 'max-w-none'
    }
  },
  defaultVariants: {
    size: '4xl',
    padding: 'md',
    center: false,
    fluid: false
  }
})

// ========================================
// Container Props
// ========================================

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  // Semantic container types
  type?: 'page' | 'section' | 'content' | 'form' | 'card' | 'modal'
  
  // Custom max width
  maxWidth?: string
  
  // Custom padding
  customPadding?: string
  
  // Background and styling
  background?: 'transparent' | 'muted' | 'card' | 'primary' | 'secondary'
  
  // Border and shadow
  border?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Rounded corners
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// ========================================
// Semantic Container Types
// ========================================

const semanticTypes = {
  page: {
    size: '7xl' as const,
    padding: 'lg' as const,
    background: 'transparent' as const
  },
  section: {
    size: '6xl' as const,
    padding: 'md' as const,
    background: 'transparent' as const
  },
  content: {
    size: '4xl' as const,
    padding: 'md' as const,
    background: 'transparent' as const
  },
  form: {
    size: 'md' as const,
    padding: 'lg' as const,
    background: 'card' as const,
    border: true,
    rounded: 'lg' as const
  },
  card: {
    size: 'full' as const,
    padding: 'md' as const,
    background: 'card' as const,
    border: true,
    rounded: 'md' as const,
    shadow: 'sm' as const
  },
  modal: {
    size: 'lg' as const,
    padding: 'lg' as const,
    background: 'card' as const,
    border: true,
    rounded: 'lg' as const,
    shadow: 'lg' as const
  }
} as const

// ========================================
// Container Component
// ========================================

const ContainerComponent = forwardRef<HTMLDivElement, ContainerProps>(
  ({
    className,
    size,
    padding,
    center,
    fluid,
    type,
    maxWidth,
    customPadding,
    background = 'transparent',
    border = false,
    shadow = 'none',
    rounded = 'none',
    children,
    ...props
  }, ref) => {
    
    // ========================================
    // Computed Values
    // ========================================
    
    // Apply semantic type overrides
    const semanticConfig = type ? semanticTypes[type] : {}
    const finalSize = size || semanticConfig.size || '4xl'
    const finalPadding = customPadding ? undefined : (padding || semanticConfig.padding || 'md')
    const finalBackground = background || semanticConfig.background || 'transparent'
    const finalBorder = border || semanticConfig.border || false
    const finalShadow = shadow || semanticConfig.shadow || 'none'
    const finalRounded = rounded || semanticConfig.rounded || 'none'
    
    // ========================================
    // Style Classes
    // ========================================
    
    const backgroundClasses = {
      transparent: '',
      muted: 'bg-muted',
      card: 'bg-card',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground'
    }
    
    const borderClasses = finalBorder ? 'border border-border' : ''
    
    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    }
    
    const roundedClasses = {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    }
    
    // ========================================
    // Custom Styles
    // ========================================
    
    const customStyles: React.CSSProperties = {}
    if (maxWidth) customStyles.maxWidth = maxWidth
    if (customPadding) customStyles.padding = customPadding
    
    // ========================================
    // Render
    // ========================================
    
    return (
      <div
        ref={ref}
        className={cn(
          containerVariants({
            size: finalSize,
            padding: finalPadding,
            center,
            fluid
          }),
          backgroundClasses[finalBackground],
          borderClasses,
          shadowClasses[finalShadow],
          roundedClasses[finalRounded],
          className
        )}
        style={customStyles}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ContainerComponent.displayName = 'Container'

// ========================================
// Semantic Container Components
// ========================================

export const PageContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="page" ref={ref} />
)

export const SectionContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="section" ref={ref} />
)

export const ContentContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="content" ref={ref} />
)

export const FormContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="form" ref={ref} />
)

export const CardContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="card" ref={ref} />
)

export const ModalContainer = forwardRef<HTMLDivElement, Omit<ContainerProps, 'type'>>(
  (props, ref) => <ContainerComponent {...props} type="modal" ref={ref} />
)

// ========================================
// Exports
// ========================================

export { ContainerComponent as Container }
export default ContainerComponent
export type { ContainerProps }
