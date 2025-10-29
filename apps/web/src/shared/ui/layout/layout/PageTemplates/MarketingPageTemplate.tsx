/**
 * MarketingPageTemplate - Professional Marketing Page Template
 * 
 * Provides consistent layout patterns for marketing pages.
 * Replaces multiple marketing page implementations with a unified system.
 * 
 * Features:
 * - Consistent marketing page structure and spacing
 * - Professional header and navigation patterns
 * - Responsive design with mobile-first approach
 * - Accessibility support with proper ARIA attributes
 * - Performance optimized with proper memoization
 */

import React, { memo } from 'react'
import { MarketingLayout } from '@layouts/UnifiedLayout'
import { PageHeader } from '@components/layout/PageHeader'
import { PageSection } from '@components/layout/PageSection'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export interface MarketingPageTemplateProps {
  // Page identification
  title?: string
  subtitle?: string
  
  // Hero section
  hero?: {
    title: string
    subtitle?: string
    description?: string
    image?: string
    actions?: React.ReactNode
    background?: 'transparent' | 'gradient' | 'image' | 'video'
  }
  
  // Content sections
  sections?: {
    id: string
    title?: string
    subtitle?: string
    children: React.ReactNode
    className?: string
    background?: 'transparent' | 'muted' | 'card' | 'primary' | 'secondary'
  }[]
  
  // Footer
  footer?: {
    show?: boolean
    content?: React.ReactNode
  }
  
  // Layout
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  
  // Styling
  className?: string
  children?: React.ReactNode
}

// ========================================
// MarketingPageTemplate Component
// ========================================

const MarketingPageTemplateComponent = memo<MarketingPageTemplateProps>(({
  title,
  subtitle,
  hero,
  sections,
  footer,
  maxWidth = 'full',
  padding = 'none',
  className,
  children
}) => {
  
  // ========================================
  // Render Hero Section
  // ========================================
  
  const renderHeroSection = () => {
    if (!hero) return null
    
    return (
      <section className={cn(
        'relative min-h-screen flex items-center justify-center',
        {
          'bg-gradient-to-br from-primary to-primary/80': hero.background === 'gradient',
          'bg-muted': hero.background === 'muted',
          'bg-card': hero.background === 'card',
        }
      )}>
        {hero.background === 'image' && hero.image && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${hero.image})` }}
          />
        )}
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            {hero.title}
          </h1>
          
          {hero.subtitle && (
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-6">
              {hero.subtitle}
            </h2>
          )}
          
          {hero.description && (
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {hero.description}
            </p>
          )}
          
          {hero.actions && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hero.actions}
            </div>
          )}
        </div>
      </section>
    )
  }
  
  // ========================================
  // Render Page Sections
  // ========================================
  
  const renderPageSections = () => {
    if (!sections || sections.length === 0) return null
    
    return (
      <div className="space-y-16">
        {sections.map((section) => (
          <PageSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            background={section.background}
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
    <MarketingLayout
      header={{
        title,
        subtitle,
        transparent: true
      }}
      content={{
        maxWidth,
        padding,
        background: 'transparent'
      }}
      footer={footer}
      className={cn('marketing-page-template', className)}
    >
      <div className="space-y-0">
        {renderHeroSection()}
        {renderPageContent()}
      </div>
    </MarketingLayout>
  )
})

MarketingPageTemplateComponent.displayName = 'MarketingPageTemplate'

// ========================================
// Exports
// ========================================

export { MarketingPageTemplateComponent as MarketingPageTemplate }
export default MarketingPageTemplateComponent
export type { MarketingPageTemplateProps }
