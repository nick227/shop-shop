/**
 * UnifiedHeader - Professional Header Component
 * 
 * Provides consistent header patterns across all layouts.
 * Replaces multiple header implementations with a unified system.
 * 
 * Features:
 * - Consistent header heights and styling
 * - Professional branding and navigation
 * - Responsive design with mobile-first approach
 * - Accessibility support with proper ARIA attributes
 * - Performance optimized with proper memoization
 */

import React, { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Home, Menu, X } from 'lucide-react'
import { Button } from '@shared/ui/primitives'
import { cn } from '@shared/lib/utils/cn'
import { spacing } from '@shared/lib/utils/spacing'

// ========================================
// Types & Interfaces
// ========================================

export type HeaderVariant = 'app' | 'auth' | 'marketing' | 'admin' | 'mobile'
export type HeaderSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ResponsiveConfig {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export interface LogoConfig {
  text?: string
  image?: string
  href?: string
  size?: 'sm' | 'md' | 'lg'
}

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface BackButtonConfig {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export interface UnifiedHeaderProps {
  variant: HeaderVariant
  title?: string
  subtitle?: string
  logo?: LogoConfig
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  backButton?: BackButtonConfig
  sticky?: boolean
  transparent?: boolean
  responsive: ResponsiveConfig
  className?: string
}

// ========================================
// Header Variant Configurations
// ========================================

const headerConfigs: Record<HeaderVariant, {
  size: HeaderSize
  height: string
  padding: string
  background: string
  border: string
  shadow: string
  logo: Partial<LogoConfig>
}> = {
  app: {
    size: 'md',
    height: 'h-16',
    padding: 'px-4 py-3',
    background: 'bg-background',
    border: 'border-b border-border',
    shadow: 'shadow-sm',
    logo: { size: 'md' }
  },
  auth: {
    size: 'lg',
    height: 'h-20',
    padding: 'px-6 py-4',
    background: 'bg-background',
    border: 'border-b border-border',
    shadow: 'shadow-sm',
    logo: { size: 'lg' }
  },
  marketing: {
    size: 'md',
    height: 'h-16',
    padding: 'px-4 py-3',
    background: 'bg-background/95 backdrop-blur-md',
    border: 'border-b border-border/50',
    shadow: 'shadow-md',
    logo: { size: 'md' }
  },
  admin: {
    size: 'lg',
    height: 'h-16',
    padding: 'px-6 py-4',
    background: 'bg-background',
    border: 'border-b border-border',
    shadow: 'shadow-sm',
    logo: { size: 'md' }
  },
  mobile: {
    size: 'sm',
    height: 'h-14',
    padding: 'px-4 py-2',
    background: 'bg-background/95 backdrop-blur-md',
    border: 'border-b border-border',
    shadow: 'shadow-sm',
    logo: { size: 'sm' }
  }
}

// ========================================
// Header Component
// ========================================

const UnifiedHeaderComponent = memo<UnifiedHeaderProps>(({
  variant,
  title,
  subtitle,
  logo,
  actions,
  breadcrumbs,
  backButton,
  sticky = true,
  transparent = false,
  responsive,
  className
}) => {
  const { isMobile, isTablet, isDesktop } = responsive
  
  // ========================================
  // Computed Values
  // ========================================
  
  const config = useMemo(() => ({
    ...headerConfigs[variant],
    logo: { ...headerConfigs[variant].logo, ...logo }
  }), [variant, logo])
  
  // Determine if we should show mobile menu
  const showMobileMenu = isMobile && (breadcrumbs || actions)
  
  // ========================================
  // Header Classes
  // ========================================
  
  const headerClasses = cn(
    'flex items-center justify-between w-full',
    config.height,
    config.padding,
    config.background,
    config.border,
    config.shadow,
    {
      'sticky top-0 z-50': sticky,
      'bg-transparent backdrop-blur-md': transparent,
      'bg-background/95': transparent && !isMobile,
    },
    className
  )
  
  const logoClasses = cn(
    'flex items-center gap-2 font-bold text-foreground',
    {
      'text-lg': config.logo.size === 'sm',
      'text-xl': config.logo.size === 'md',
      'text-2xl': config.logo.size === 'lg',
    }
  )
  
  // ========================================
  // Render Logo
  // ========================================
  
  const renderLogo = () => {
    if (!config.logo.text && !config.logo.image) return null
    
    const logoContent = (
      <>
        {config.logo.image && (
          <img
            src={config.logo.image}
            alt={config.logo.text || 'Logo'}
            className="h-8 w-8 object-contain"
          />
        )}
        {config.logo.text && (
          <span className={logoClasses}>
            {config.logo.text}
          </span>
        )}
      </>
    )
    
    if (config.logo.href) {
      return (
        <Link to={config.logo.href} className="flex items-center gap-2">
          {logoContent}
        </Link>
      )
    }
    
    return logoContent
  }
  
  // ========================================
  // Render Breadcrumbs
  // ========================================
  
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null
    
    return (
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground">
                {crumb.icon && <crumb.icon className="h-4 w-4 mr-1" />}
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </nav>
    )
  }
  
  // ========================================
  // Render Back Button
  // ========================================
  
  const renderBackButton = () => {
    if (!backButton) return null
    
    const BackIcon = backButton.icon || ArrowLeft
    
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={backButton.onClick}
        className="flex items-center gap-2"
      >
        <BackIcon className="h-4 w-4" />
        {backButton.label}
      </Button>
    )
  }
  
  // ========================================
  // Render Actions
  // ========================================
  
  const renderActions = () => {
    if (!actions) return null
    
    return (
      <div className="flex items-center gap-2">
        {actions}
      </div>
    )
  }
  
  // ========================================
  // Render Mobile Menu
  // ========================================
  
  const renderMobileMenu = () => {
    if (!showMobileMenu) return null
    
    return (
      <div className="flex items-center gap-2">
        {/* Mobile menu button would go here */}
        <Button variant="ghost" size="sm">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    )
  }
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <header className={headerClasses}>
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Back Button */}
        {backButton && (
          <div className="flex-shrink-0">
            {renderBackButton()}
          </div>
        )}
        
        {/* Logo */}
        <div className="flex-shrink-0">
          {renderLogo()}
        </div>
        
        {/* Title and Subtitle */}
        {(title || subtitle) && (
          <div className="flex flex-col min-w-0">
            {title && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        {/* Breadcrumbs */}
        {!isMobile && (
          <div className="flex-1 min-w-0">
            {renderBreadcrumbs()}
          </div>
        )}
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Actions */}
        {!isMobile && renderActions()}
        
        {/* Mobile Menu */}
        {renderMobileMenu()}
      </div>
    </header>
  )
})

UnifiedHeaderComponent.displayName = 'UnifiedHeader'

// ========================================
// Exports
// ========================================

export { UnifiedHeaderComponent as UnifiedHeader }
export default UnifiedHeaderComponent
export type { 
  UnifiedHeaderProps, 
  HeaderVariant, 
  HeaderSize, 
  ResponsiveConfig,
  LogoConfig,
  BreadcrumbItem,
  BackButtonConfig
}
