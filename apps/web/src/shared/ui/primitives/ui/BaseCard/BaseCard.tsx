// @ts-nocheck
/**
 * BaseCard - Unified card component system
 * 
 * This component provides a consistent foundation for all card types across the application.
 * It handles common patterns like images, titles, descriptions, meta information, actions, and badges.
 * 
 * Benefits:
 * - Single source of truth for card styling and behavior
 * - Consistent interaction patterns across all cards
 * - Type-safe props with comprehensive interfaces
 * - Optimized performance with proper memoization
 * - Easy to extend for new card types
 */

import React, { memo, forwardRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '../Card'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Image } from '../Image'
import { cn } from '@shared/lib/cn'

// ========================================
// Type Definitions
// ========================================

export interface CardMetaItem {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}

export interface CardAction {
  label: string
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large' | 'icon'
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export interface CardBadge {
  label: string
  variant?: 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
  className?: string
}

export interface CardImage {
  src: string
  alt: string
  aspectRatio?: 'square' | 'landscape' | 'video' | 'portrait'
  fallbackSeed?: string
  className?: string
}

export type CardVariant = 'default' | 'compact' | 'expanded' | 'minimal'

export interface BaseCardProps {
  // Core content
  title: string
  description?: string
  subtitle?: string
  
  // Visual elements
  image?: CardImage
  badges?: CardBadge[]
  meta?: CardMetaItem[]
  actions?: CardAction[]
  
  // Behavior
  onClick?: () => void
  onImageClick?: () => void
  
  // Styling
  variant?: CardVariant
  className?: string
  contentClassName?: string
  headerClassName?: string
  footerClassName?: string
  
  // State
  loading?: boolean
  disabled?: boolean
  selected?: boolean
  
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}

// ========================================
// Component Implementation
// ========================================

const BaseCardComponent = forwardRef<HTMLDivElement, BaseCardProps>(
  ({
    title,
    description,
    subtitle,
    image,
    badges = [],
    meta = [],
    actions = [],
    onClick,
    onImageClick,
    variant = 'default',
    className,
    contentClassName,
    headerClassName,
    footerClassName,
    loading = false,
    disabled = false,
    selected = false,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    
    // ========================================
    // Memoized Handlers
    // ========================================
    
    const handleClick = useCallback(() => {
      if (disabled || loading) return
      onClick?.()
    }, [onClick, disabled, loading])
    
    const handleImageClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation()
      if (disabled || loading) return
      onImageClick?.()
    }, [onImageClick, disabled, loading])
    
    // ========================================
    // Memoized Computed Values
    // ========================================
    
    const aspectRatio = useMemo(() => {
      if (!image?.aspectRatio) return 'landscape'
      const ratios = {
        square: '1/1',
        landscape: '4/3',
        video: '16/9',
        portrait: '3/4'
      }
      return ratios[image.aspectRatio]
    }, [image?.aspectRatio])
    
    const cardClasses = useMemo(() => {
      const baseClasses = 'bg-card text-card-foreground rounded-lg border shadow-sm'
      const variantClasses = {
        default: '',
        compact: 'p-3',
        expanded: 'p-6',
        minimal: 'p-0 border-0 shadow-none'
      }
      
      return cn(
        baseClasses,
        variantClasses[variant],
        onClick && !disabled && !loading && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-normal',
        selected && 'ring-2 ring-brand-primary ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'opacity-75 cursor-wait',
        className
      )
    }, [variant, onClick, disabled, loading, selected, className])
    
    const contentClasses = useMemo(() => {
      return cn(
        'pt-0',
        contentClassName
      )
    }, [contentClassName])
    
    // ========================================
    // Render Helpers
    // ========================================
    
    const renderImage = () => {
      if (!image) return null
      
      return (
        <div className="relative overflow-hidden bg-muted">
          <Image
            src={image.src}
            alt={image.alt}
            fallbackSeed={image.fallbackSeed}
            aspectRatio={aspectRatio}
            containerClassName={cn(
              'w-full',
              image.className
            )}
            onClick={onImageClick ? handleImageClick : undefined}
            className={onImageClick ? 'cursor-pointer' : undefined}
          />
          
          {/* Image overlay for clickable images */}
          {onImageClick && (
            <div 
              className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-normal cursor-pointer"
              onClick={handleImageClick}
            />
          )}
        </div>
      )
    }
    
    const renderBadges = () => {
      if (badges.length === 0) return null
      
      return (
        <div className="flex flex-wrap gap-2 mb-3">
          {badges.map((badge, index) => (
            <Badge
              key={`${badge.label}-${index}`}
              variant={badge.variant || 'secondary'}
              className={badge.className}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      )
    }
    
    const renderMeta = () => {
      if (meta.length === 0) return null
      
      return (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {meta.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={`${item.label}-${index}`}
                className={cn(
                  'flex items-center gap-1',
                  item.className
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="font-medium">{item.label}:</span>
                <span>{item.value}</span>
              </div>
            )
          })}
        </div>
      )
    }
    
    const renderActions = () => {
      if (actions.length === 0) return null
      
      return (
        <div className="flex gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={`${action.label}-${index}`}
                variant={action.variant || 'outline'}
                size={action.size || 'small'}
                onClick={action.onClick}
                disabled={action.disabled || disabled || loading}
                isLoading={action.loading || loading}
                className={action.className}
              >
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      )
    }
    
    // ========================================
    // Main Render
    // ========================================
    
    return (
      <Card
        ref={ref}
        onClick={handleClick}
        className={cardClasses}
        aria-label={ariaLabel || title}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {/* Image */}
        {renderImage()}
        
        {/* Header */}
        <CardHeader className={cn('pb-3', headerClassName)}>
          {renderBadges()}
          
          <div className="space-y-1">
            <h3 className={cn(
              'font-semibold text-primary line-clamp-2',
              variant === 'compact' ? 'text-base' : 'text-lg'
            )}>
              {title}
            </h3>
            
            {subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </CardHeader>
        
        {/* Content */}
        <CardContent className={contentClasses}>
          {description && (
            <p className={cn(
              'text-muted-foreground line-clamp-3 mb-3',
              variant === 'compact' ? 'text-sm' : 'text-base'
            )}>
              {description}
            </p>
          )}
          
          {renderMeta()}
        </CardContent>
        
        {/* Footer */}
        {actions.length > 0 && (
          <CardFooter className={cn('pt-3', footerClassName)}>
            {renderActions()}
          </CardFooter>
        )}
      </Card>
    )
  }
)

BaseCardComponent.displayName = 'BaseCard'

// ========================================
// Exports
// ========================================

export const BaseCard = memo(BaseCardComponent)

// Re-export types for convenience
export type { BaseCardProps, CardMetaItem, CardAction, CardBadge, CardImage, CardVariant }
