/**
 * AppPageTemplate - Professional App Page Template
 * 
 * Provides consistent layout patterns for application pages.
 * Replaces multiple page implementations with a unified system.
 * 
 * Features:
 * - Consistent page structure and spacing
 * - Professional header and navigation patterns
 * - Responsive design with mobile-first approach
 * - Accessibility support with proper ARIA attributes
 * - Performance optimized with proper memoization
 */

import React, { memo } from 'react'
import { AppLayout } from '@layouts/UnifiedLayout'
import { PageHeader } from '@components/layout/PageHeader'
import { PageActions } from '@components/layout/PageActions'
import { PageSection } from '@components/layout/PageSection'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

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

export interface PageAction {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ComponentType<{ className?: string }>
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
}

export interface PageSection {
  id: string
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export interface AppPageTemplateProps {
  // Page identification
  title: string
  subtitle?: string
  
  // Navigation
  breadcrumbs?: BreadcrumbItem[]
  backButton?: BackButtonConfig
  
  // Actions
  actions?: PageAction[]
  
  // Content
  sections?: PageSection[]
  children?: React.ReactNode
  
  // Layout
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Styling
  className?: string
}

// ========================================
// AppPageTemplate Component
// ========================================

const AppPageTemplateComponent = memo<AppPageTemplateProps>(({
  title,
  subtitle,
  breadcrumbs,
  backButton,
  actions,
  sections,
  children,
  maxWidth = '4xl',
  padding = 'lg',
  className
}) => {
  
  // ========================================
  // Render Page Header
  // ========================================
  
  const renderPageHeader = () => {
    if (!title && !subtitle && !breadcrumbs && !backButton && !actions) return null
    
    return (
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        backButton={backButton}
        actions={actions}
        className="mb-8"
      />
    )
  }
  
  // ========================================
  // Render Page Sections
  // ========================================
  
  const renderPageSections = () => {
    if (!sections || sections.length === 0) return null
    
    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <PageSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            className={section.className}
          >
            {section.children}
          </PageSection>
        ))}
      </div>
    )
  }
  
  // ========================================
  // Render Page Content
  // ========================================
  
  const renderPageContent = () => {
    if (children) return children
    if (sections && sections.length > 0) return renderPageSections()
    return null
  }
  
  // ========================================
  // Render
  // ========================================
  
  return (
    <AppLayout
      header={{
        title,
        subtitle,
        breadcrumbs,
        backButton,
        actions: actions?.map(action => ({
          id: action.id,
          label: action.label,
          variant: action.variant,
          size: action.size,
          icon: action.icon,
          onClick: action.onClick,
          href: action.href,
          disabled: action.disabled,
          loading: action.loading
        }))
      }}
      content={{
        maxWidth,
        padding,
        background: 'transparent'
      }}
      className={cn('app-page-template', className)}
    >
      <div className="space-y-8">
        {renderPageHeader()}
        {renderPageContent()}
      </div>
    </AppLayout>
  )
})

AppPageTemplateComponent.displayName = 'AppPageTemplate'

// ========================================
// Exports
// ========================================

export { AppPageTemplateComponent as AppPageTemplate }
export default AppPageTemplateComponent
export type { 
  AppPageTemplateProps, 
  BreadcrumbItem, 
  BackButtonConfig, 
  PageAction, 
  PageSection 
}
