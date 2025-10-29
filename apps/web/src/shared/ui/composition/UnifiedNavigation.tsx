/**
 * UnifiedNavigation - Professional Navigation Component
 * 
 * Provides consistent navigation patterns across all layouts.
 * Replaces multiple navigation implementations with a unified system.
 * 
 * Features:
 * - Consistent navigation styling and behavior
 * - Professional active states and hover effects
 * - Responsive design with mobile-first approach
 * - Accessibility support with proper ARIA attributes
 * - Performance optimized with proper memoization
 */

import React, { memo, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@shared/lib/utils/cn'
import { spacing } from '@shared/lib/utils/spacing'

// ========================================
// Types & Interfaces
// ========================================

export type NavigationVariant = 'sidebar' | 'top' | 'bottom' | 'breadcrumb'
export type NavigationSize = 'sm' | 'md' | 'lg'
export type NavigationOrientation = 'horizontal' | 'vertical'

export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export interface NavigationItem {
  id: string
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavigationItem[]
  onClick?: () => void
}

export interface UnifiedNavigationProps {
  variant: NavigationVariant
  items: NavigationItem[]
  activeItem?: string
  orientation?: NavigationOrientation
  size?: NavigationSize
  showIcons?: boolean
  showLabels?: boolean
  collapsible?: boolean
  responsive: ResponsiveConfig
  className?: string
}

// ========================================
// Navigation Variant Configurations
// ========================================

const navigationConfigs: Record<NavigationVariant, {
  size: NavigationSize
  orientation: NavigationOrientation
  showIcons: boolean
  showLabels: boolean
  collapsible: boolean
  classes: {
    container: string
    item: string
    active: string
    hover: string
  }
}> = {
  sidebar: {
    size: 'md',
    orientation: 'vertical',
    showIcons: true,
    showLabels: true,
    collapsible: true,
    classes: {
      container: 'w-64 bg-card border-r border-border flex flex-col',
      item: 'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors',
      active: 'bg-primary text-primary-foreground',
      hover: 'hover:bg-accent hover:text-accent-foreground'
    }
  },
  top: {
    size: 'md',
    orientation: 'horizontal',
    showIcons: false,
    showLabels: true,
    collapsible: false,
    classes: {
      container: 'bg-background border-b border-border flex items-center',
      item: 'px-4 py-3 text-sm font-medium transition-colors',
      active: 'border-b-2 border-primary text-primary',
      hover: 'hover:text-accent-foreground'
    }
  },
  bottom: {
    size: 'sm',
    orientation: 'horizontal',
    showIcons: true,
    showLabels: true,
    collapsible: false,
    classes: {
      container: 'bg-background border-t border-border flex items-center justify-around',
      item: 'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
      active: 'text-primary',
      hover: 'hover:text-accent-foreground'
    }
  },
  breadcrumb: {
    size: 'sm',
    orientation: 'horizontal',
    showIcons: false,
    showLabels: true,
    collapsible: false,
    classes: {
      container: 'flex items-center space-x-2 text-sm text-muted-foreground',
      item: 'transition-colors',
      active: 'text-foreground',
      hover: 'hover:text-foreground'
    }
  }
}

// ========================================
// Navigation Component
// ========================================

const UnifiedNavigationComponent = memo<UnifiedNavigationProps>(({
  variant,
  items,
  activeItem,
  orientation,
  size,
  showIcons,
  showLabels,
  collapsible,
  responsive,
  className
}) => {
  const location = useLocation()
  const { isMobile, isTablet, isDesktop } = responsive
  
  // ========================================
  // Computed Values
  // ========================================
  
  const config = useMemo(() => ({
    ...navigationConfigs[variant],
    orientation: orientation || navigationConfigs[variant].orientation,
    size: size || navigationConfigs[variant].size,
    showIcons: showIcons ?? navigationConfigs[variant].showIcons,
    showLabels: showLabels ?? navigationConfigs[variant].showLabels,
    collapsible: collapsible ?? navigationConfigs[variant].collapsible
  }), [variant, orientation, size, showIcons, showLabels, collapsible])
  
  // Determine if item is active
  const isItemActive = (item: NavigationItem) => {
    if (activeItem) return activeItem === item.id
    if (item.href) return location.pathname.startsWith(item.href)
    return false
  }
  
  // ========================================
  // Navigation Classes
  // ========================================
  
  const containerClasses = cn(
    config.classes.container,
    {
      'w-64': variant === 'sidebar' && !isMobile,
      'w-16': variant === 'sidebar' && isMobile && config.collapsible,
      'h-16': variant === 'top',
      'h-16': variant === 'bottom',
      'px-4': variant === 'top',
      'px-2': variant === 'bottom',
      'py-2': variant === 'top',
      'py-1': variant === 'bottom',
    },
    className
  )
  
  const itemClasses = cn(
    config.classes.item,
    {
      'w-full': variant === 'sidebar',
      'flex-1': variant === 'top' || variant === 'bottom',
      'justify-center': variant === 'top' || variant === 'bottom',
      'flex-col': variant === 'bottom',
      'flex-row': variant === 'sidebar' || variant === 'top',
    }
  )
  
  // ========================================
  // Render Navigation Item
  // ========================================
  
  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isItemActive(item)
    const Icon = item.icon
    
    const itemContent = (
      <>
        {/* Icon */}
        {config.showIcons && Icon && (
          <Icon className={cn(
            'flex-shrink-0',
            {
              'h-4 w-4': config.size === 'sm',
              'h-5 w-5': config.size === 'md',
              'h-6 w-6': config.size === 'lg',
            }
          )} />
        )}
        
        {/* Label */}
        {config.showLabels && (
          <span className={cn(
            'truncate',
            {
              'text-xs': config.size === 'sm',
              'text-sm': config.size === 'md',
              'text-base': config.size === 'lg',
            }
          )}>
            {item.label}
          </span>
        )}
        
        {/* Badge */}
        {item.badge && (
          <span className={cn(
            'inline-flex items-center justify-center rounded-full text-xs font-medium',
            {
              'bg-primary text-primary-foreground': isActive,
              'bg-muted text-muted-foreground': !isActive,
            },
            {
              'h-4 w-4': config.size === 'sm',
              'h-5 w-5': config.size === 'md',
              'h-6 w-6': config.size === 'lg',
            }
          )}>
            {item.badge}
          </span>
        )}
      </>
    )
    
    // Render as button if onClick is provided
    if (item.onClick) {
      return (
        <button
          key={item.id}
          onClick={item.onClick}
          className={cn(
            itemClasses,
            config.classes.hover,
            {
              [config.classes.active]: isActive,
            }
          )}
        >
          {itemContent}
        </button>
      )
    }
    
    // Render as link if href is provided
    if (item.href) {
      return (
        <Link
          key={item.id}
          to={item.href}
          className={cn(
            itemClasses,
            config.classes.hover,
            {
              [config.classes.active]: isActive,
            }
          )}
        >
          {itemContent}
        </Link>
      )
    }
    
    // Render as div if no href or onClick
    return (
      <div
        key={item.id}
        className={cn(
          itemClasses,
          {
            [config.classes.active]: isActive,
          }
        )}
      >
        {itemContent}
      </div>
    )
  }
  
  // ========================================
  // Render Navigation Items
  // ========================================
  
  const renderNavigationItems = () => {
    return items.map((item) => (
      <div key={item.id}>
        {renderNavigationItem(item)}
        
        {/* Render children if they exist */}
        {item.children && item.children.length > 0 && (
          <div className={cn(
            'ml-4 mt-2 space-y-1',
            {
              'hidden': variant === 'top' || variant === 'bottom',
            }
          )}>
            {item.children.map((child) => renderNavigationItem(child))}
          </div>
        )}
      </div>
    ))
  }
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <nav
      className={containerClasses}
      role="navigation"
      aria-label="Main navigation"
    >
      {renderNavigationItems()}
    </nav>
  )
})

UnifiedNavigationComponent.displayName = 'UnifiedNavigation'

// ========================================
// Exports
// ========================================

export { UnifiedNavigationComponent as UnifiedNavigation }
export default UnifiedNavigationComponent
export type { 
  UnifiedNavigationProps, 
  NavigationVariant, 
  NavigationSize, 
  NavigationOrientation,
  ResponsiveConfig,
  NavigationItem
}
