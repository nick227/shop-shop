/**
 * Card Composition - Unified Card System
 * 
 * Addresses critical composition issues:
 * - Redundant card component implementations
 * - Inconsistent card APIs and patterns
 * - Missing card composition primitives
 * - Poor card reusability and flexibility
 */

import React, { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/ui/primitives'
import { Button, Badge, Image, Icon } from '@shared/ui/primitives'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export type CardVariant = 'product' | 'store' | 'order' | 'custom' | 'base'
export type CardLayout = 'horizontal' | 'vertical' | 'grid' | 'list'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

export interface CardImageConfig {
  src?: string
  alt?: string
  aspectRatio?: string
  zoom?: boolean
  gallery?: boolean
  videos?: boolean
  placeholder?: string
}

export interface CardActionConfig {
  primary?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }
  secondary?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
    icon?: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }
}

export interface CardBadgeConfig {
  sale?: boolean
  new?: boolean
  featured?: boolean
  limited?: boolean
  custom?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
  }[]
}

export interface CardMetaConfig {
  price?: {
    amount: number
    currency?: string
    originalAmount?: number
    discount?: number
  }
  rating?: {
    value: number
    count: number
    max?: number
  }
  status?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  }
  location?: {
    address: string
    distance?: number
    city?: string
    state?: string
  }
  timestamp?: {
    date: string
    time?: string
    relative?: boolean
  }
}

export interface CardFeatures {
  image?: CardImageConfig
  actions?: CardActionConfig
  badges?: CardBadgeConfig
  meta?: CardMetaConfig
}

export interface CardCompositionProps {
  variant: CardVariant
  layout: CardLayout
  size: CardSize
  features: CardFeatures
  responsive: boolean
  interactive: boolean
  loading: boolean
  error: boolean
  children?: React.ReactNode
  className?: string
}

export interface FooterConfig {
  metadata?: string[]
  timestamp?: string
  author?: string
}

// ========================================
// Card Composition Component
// ========================================

const CardCompositionComponent = memo<CardCompositionProps>(({
  variant,
  layout,
  size,
  features,
  children,
  className,
  responsive = true,
  interactive = true,
  loading = false,
  error = false
}) => {
  // ========================================
  // Computed Values
  // ========================================
  
  const cardConfig = useMemo(() => {
    const configs = {
      product: {
        layout: 'vertical',
        size: 'md',
        features: {
          image: { aspectRatio: '4/3', zoom: true },
          actions: { primary: { label: 'Add to Cart' } },
          badges: { sale: true, new: true },
          meta: { price: { amount: 0 } }
        }
      },
      store: {
        layout: 'vertical',
        size: 'lg',
        features: {
          image: { aspectRatio: '16/9' },
          actions: { primary: { label: 'View Store' } },
          badges: { featured: true },
          meta: { rating: { value: 0, count: 0 } }
        }
      },
      order: {
        layout: 'horizontal',
        size: 'md',
        features: {
          actions: { primary: { label: 'View Details' } },
          meta: { status: { text: 'Pending', variant: 'info' } }
        }
      },
      custom: {
        layout: 'vertical',
        size: 'md',
        features: {}
      },
      base: {
        layout: 'vertical',
        size: 'md',
        features: {}
      }
    }
    
    return configs[variant] || configs.base
  }, [variant])
  
  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: 'h-32 w-48',
      md: 'h-48 w-64',
      lg: 'h-64 w-80',
      xl: 'h-80 w-96'
    }
    return sizes[size] || sizes.md
  }, [size])
  
  const layoutClasses = useMemo(() => {
    const layouts = {
      horizontal: 'flex-row',
      vertical: 'flex-col',
      grid: 'grid',
      list: 'flex-row items-center'
    }
    return layouts[layout] || layouts.vertical
  }, [layout])
  
  // ========================================
  // Render Card Image
  // ========================================
  
  const renderCardImage = () => {
    if (!features.image) return null
    
    const { src, alt, aspectRatio, zoom, gallery, placeholder } = features.image
    
    return (
      <div className={cn(
        'card-image-container',
        {
          'card-image-container--zoom': zoom,
          'card-image-container--gallery': gallery,
          'card-image-container--responsive': responsive
        }
      )}>
        {src ? (
          <Image
            src={src}
            alt={alt || ''}
            className={cn(
              'card-image',
              {
                'card-image--zoom': zoom,
                'card-image--responsive': responsive
              }
            )}
            style={{ aspectRatio }}
          />
        ) : (
          <div className={cn(
            'card-image-placeholder',
            {
              'card-image-placeholder--responsive': responsive
            }
          )}>
            {placeholder || 'No Image'}
          </div>
        )}
      </div>
    )
  }
  
  // ========================================
  // Render Card Actions
  // ========================================
  
  const renderCardActions = () => {
    if (!features.actions) return null
    
    const { primary, secondary } = features.actions
    
    return (
      <div className={cn(
        'card-actions',
        {
          'card-actions--responsive': responsive
        }
      )}>
        {primary && (
          <Button
            variant={primary.variant || 'primary'}
            onClick={primary.onClick}
            href={primary.href}
            disabled={primary.disabled}
            className={cn(
              'card-action-primary',
              {
                'card-action-primary--responsive': responsive
              }
            )}
          >
            {primary.icon && <primary.icon className="mr-2 h-4 w-4" />}
            {primary.label}
          </Button>
        )}
        
        {secondary && (
          <Button
            variant={secondary.variant || 'secondary'}
            onClick={secondary.onClick}
            href={secondary.href}
            disabled={secondary.disabled}
            className={cn(
              'card-action-secondary',
              {
                'card-action-secondary--responsive': responsive
              }
            )}
          >
            {secondary.icon && <secondary.icon className="mr-2 h-4 w-4" />}
            {secondary.label}
          </Button>
        )}
      </div>
    )
  }
  
  // ========================================
  // Render Card Badges
  // ========================================
  
  const renderCardBadges = () => {
    if (!features.badges) return null
    
    const { sale, new: isNew, featured, limited, custom } = features.badges
    
    return (
      <div className={cn(
        'card-badges',
        {
          'card-badges--responsive': responsive
        }
      )}>
        {sale && (
          <Badge variant="destructive" className="card-badge card-badge--sale">
            Sale
          </Badge>
        )}
        
        {isNew && (
          <Badge variant="default" className="card-badge card-badge--new">
            New
          </Badge>
        )}
        
        {featured && (
          <Badge variant="secondary" className="card-badge card-badge--featured">
            Featured
          </Badge>
        )}
        
        {limited && (
          <Badge variant="outline" className="card-badge card-badge--limited">
            Limited
          </Badge>
        )}
        
        {custom?.map((badge, index) => (
          <Badge
            key={index}
            variant={badge.variant || 'default'}
            className={cn(
              'card-badge card-badge--custom',
              {
                'card-badge--responsive': responsive
              }
            )}
            style={{ backgroundColor: badge.color }}
          >
            {badge.label}
          </Badge>
        ))}
      </div>
    )
  }
  
  // ========================================
  // Render Card Meta
  // ========================================
  
  const renderCardMeta = () => {
    if (!features.meta) return null
    
    const { price, rating, status, location, timestamp } = features.meta
    
    return (
      <div className={cn(
        'card-meta',
        {
          'card-meta--responsive': responsive
        }
      )}>
        {price && (
          <div className="card-meta-price">
            <span className="card-meta-price-current">
              ${price.amount.toFixed(2)}
            </span>
            {price.originalAmount && price.originalAmount > price.amount && (
              <span className="card-meta-price-original">
                ${price.originalAmount.toFixed(2)}
              </span>
            )}
            {price.discount && (
              <span className="card-meta-price-discount">
                {price.discount}% off
              </span>
            )}
          </div>
        )}
        
        {rating && (
          <div className="card-meta-rating">
            <span className="card-meta-rating-stars">
              {'★'.repeat(Math.floor(rating.value))}
              {'☆'.repeat(rating.max || 5 - Math.floor(rating.value))}
            </span>
            <span className="card-meta-rating-count">
              ({rating.count})
            </span>
          </div>
        )}
        
        {status && (
          <Badge
            variant={status.variant || 'default'}
            className="card-meta-status"
          >
            {status.text}
          </Badge>
        )}
        
        {location && (
          <div className="card-meta-location">
            <span className="card-meta-location-address">
              {location.address}
            </span>
            {location.distance && (
              <span className="card-meta-location-distance">
                {location.distance} mi
              </span>
            )}
          </div>
        )}
        
        {timestamp && (
          <div className="card-meta-timestamp">
            <span className="card-meta-timestamp-date">
              {timestamp.date}
            </span>
            {timestamp.time && (
              <span className="card-meta-timestamp-time">
                {timestamp.time}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <Card className={cn(
      'card-composition',
      `card-composition--${variant}`,
      `card-composition--${layout}`,
      `card-composition--${size}`,
      {
        'card-composition--responsive': responsive,
        'card-composition--interactive': interactive,
        'card-composition--loading': loading,
        'card-composition--error': error
      },
      sizeClasses,
      layoutClasses,
      className
    )}>
      <CardHeader className="card-composition-header">
        {renderCardBadges()}
        {renderCardImage()}
        <CardTitle className="card-composition-title">
          {children}
        </CardTitle>
        <CardDescription className="card-composition-description">
          {renderCardMeta()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="card-composition-content">
        {renderCardActions()}
      </CardContent>
    </Card>
  )
})

CardCompositionComponent.displayName = 'CardComposition'

// ========================================
// Composition Factory
// ========================================

export const CardCompositionFactory = {
  // Product Card Composition
  Product: memo((props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionComponent {...props} variant="product" />
  )),
  
  // Store Card Composition
  Store: memo((props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionComponent {...props} variant="store" />
  )),
  
  // Order Card Composition
  Order: memo((props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionComponent {...props} variant="order" />
  )),
  
  // Custom Card Composition
  Custom: memo((props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionComponent {...props} variant="custom" />
  )),
  
  // Base Card Composition
  Base: memo((props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionComponent {...props} variant="base" />
  ))
}

// ========================================
// Exports
// ========================================

export { CardCompositionComponent as CardComposition }
export type { 
  CardCompositionProps, 
  CardVariant, 
  CardLayout, 
  CardSize, 
  CardImageConfig, 
  CardActionConfig, 
  CardBadgeConfig, 
  CardMetaConfig, 
  CardFeatures, 
  FooterConfig 
}