/**
 * Page Composition - Unified Page Template System
 * 
 * Addresses critical composition issues:
 * - Inconsistent page composition patterns
 * - Redundant page template implementations
 * - Missing responsive composition strategy
 * - Poor accessibility composition
 */

import React, { memo, useMemo } from 'react'
import { AppLayout } from '@layouts/UnifiedLayout'
import { PageHeader } from '@components/layout/PageHeader'
import { PageActions } from '@components/layout/PageActions'
import { PageSection } from '@components/layout/PageSection'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export type PageTemplate = 'app' | 'marketing' | 'auth' | 'admin' | 'mobile'
export type PageLayout = 'sidebar' | 'top-nav' | 'bottom-nav' | 'minimal' | 'full'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

export interface PageAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface PageSection {
  id: string
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export interface PageCompositionProps {
  template: PageTemplate
  layout: PageLayout
  sections: ('header' | 'content' | 'sidebar' | 'footer' | 'navigation')[]
  responsive: boolean
  accessibility: boolean
  children: React.ReactNode
  className?: string
}

export interface ResponsiveConfig {
  mobile: Record<string, any>
  tablet: Record<string, any>
  desktop: Record<string, any>
}

// ========================================
// Page Composition Component
// ========================================

const PageCompositionComponent = memo<PageCompositionProps>(({
  template,
  layout,
  sections,
  children,
  className,
  responsive = true,
  accessibility = true
}) => {
  // ========================================
  // Computed Values
  // ========================================
  
  const pageConfig = useMemo(() => {
    const configs = {
      app: {
        layout: 'sidebar',
        sections: ['header', 'content', 'sidebar'],
        responsive: true,
        accessibility: true
      },
      marketing: {
        layout: 'top-nav',
        sections: ['header', 'content', 'footer'],
        responsive: true,
        accessibility: true
      },
      auth: {
        layout: 'minimal',
        sections: ['content'],
        responsive: true,
        accessibility: true
      },
      admin: {
        layout: 'sidebar',
        sections: ['header', 'content', 'sidebar'],
        responsive: true,
        accessibility: true
      },
      mobile: {
        layout: 'bottom-nav',
        sections: ['header', 'content', 'bottom-nav'],
        responsive: true,
        accessibility: true
      }
    }
    
    return configs[template] || configs.app
  }, [template])
  
  const sectionConfigs = useMemo(() => {
    return sections.map(section => ({
      type: section,
      variant: section === 'header' ? 'primary' : 'secondary',
      sticky: section === 'header' || section === 'navigation',
      responsive: true,
      className: `page-section-${section}`
    }))
  }, [sections])
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <div className={cn(
      'page-composition',
      `page-composition--${template}`,
      `page-composition--${layout}`,
      {
        'page-composition--responsive': responsive,
        'page-composition--accessibility': accessibility
      },
      className
    )}>
      {/* Header Section */}
      {sections.includes('header') && (
        <header className={cn(
          'page-header',
          {
            'page-header--sticky': sectionConfigs.find(s => s.type === 'header')?.sticky,
            'page-header--responsive': responsive
          }
        )}>
          {children}
        </header>
      )}
      
      {/* Navigation Section */}
      {sections.includes('navigation') && (
        <nav className={cn(
          'page-navigation',
          {
            'page-navigation--sticky': sectionConfigs.find(s => s.type === 'navigation')?.sticky,
            'page-navigation--responsive': responsive
          }
        )}>
          {children}
        </nav>
      )}
      
      {/* Main Content Area */}
      <div className={cn(
        'page-content-area',
        {
          'page-content-area--sidebar': layout === 'sidebar',
          'page-content-area--top-nav': layout === 'top-nav',
          'page-content-area--bottom-nav': layout === 'bottom-nav',
          'page-content-area--minimal': layout === 'minimal',
          'page-content-area--full': layout === 'full'
        }
      )}>
        {/* Sidebar Section */}
        {sections.includes('sidebar') && layout === 'sidebar' && (
          <aside className={cn(
            'page-sidebar',
            {
              'page-sidebar--responsive': responsive
            }
          )}>
            {children}
          </aside>
        )}
        
        {/* Main Content */}
        <main className={cn(
          'page-main',
          {
            'page-main--responsive': responsive
          }
        )}>
          {children}
        </main>
      </div>
      
      {/* Footer Section */}
      {sections.includes('footer') && (
        <footer className={cn(
          'page-footer',
          {
            'page-footer--responsive': responsive
          }
        )}>
          {children}
        </footer>
      )}
    </div>
  )
})

PageCompositionComponent.displayName = 'PageComposition'

// ========================================
// Layout Components
// ========================================

const SidebarContent = memo(() => (
  <aside className="page-sidebar-content">
    <nav className="page-sidebar-nav">
      <ul className="page-sidebar-nav-list">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/stores">Stores</a></li>
        <li><a href="/orders">Orders</a></li>
        <li><a href="/settings">Settings</a></li>
      </ul>
    </nav>
  </aside>
))

const TopNavContent = memo(() => (
  <nav className="page-top-nav">
    <div className="page-top-nav-content">
      <div className="page-top-nav-brand">
        <a href="/">Store Shop</a>
      </div>
      <div className="page-top-nav-menu">
        <a href="/">Home</a>
        <a href="/stores">Stores</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </nav>
))

const BottomNavContent = memo(() => (
  <nav className="page-bottom-nav">
    <div className="page-bottom-nav-content">
      <a href="/" className="page-bottom-nav-item">
        <span className="page-bottom-nav-icon">🏠</span>
        <span className="page-bottom-nav-label">Home</span>
      </a>
      <a href="/stores" className="page-bottom-nav-item">
        <span className="page-bottom-nav-icon">🏪</span>
        <span className="page-bottom-nav-label">Stores</span>
      </a>
      <a href="/orders" className="page-bottom-nav-item">
        <span className="page-bottom-nav-icon">📦</span>
        <span className="page-bottom-nav-label">Orders</span>
      </a>
      <a href="/profile" className="page-bottom-nav-item">
        <span className="page-bottom-nav-icon">👤</span>
        <span className="page-bottom-nav-label">Profile</span>
      </a>
    </div>
  </nav>
))

// ========================================
// Composition Factory
// ========================================

export const PageCompositionFactory = {
  // App Page Composition
  App: memo((props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionComponent {...props} template="app" />
  )),
  
  // Marketing Page Composition
  Marketing: memo((props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionComponent {...props} template="marketing" />
  )),
  
  // Auth Page Composition
  Auth: memo((props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionComponent {...props} template="auth" />
  )),
  
  // Admin Page Composition
  Admin: memo((props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionComponent {...props} template="admin" />
  )),
  
  // Mobile Page Composition
  Mobile: memo((props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionComponent {...props} template="mobile" />
  ))
}

// ========================================
// Responsive Composition Hook
// ========================================

export const useResponsivePageComposition = (config: ResponsiveConfig) => {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isTablet, setIsTablet] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(true)
  
  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
      setIsDesktop(width >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  return useMemo(() => {
    if (isMobile) return config.mobile
    if (isTablet) return config.tablet
    return config.desktop
  }, [isMobile, isTablet, isDesktop, config])
}

// ========================================
// Exports
// ========================================

export { PageCompositionComponent as PageComposition }
export { SidebarContent, TopNavContent, BottomNavContent }
export type { PageCompositionProps, ResponsiveConfig, BreadcrumbItem, PageAction, PageSection }