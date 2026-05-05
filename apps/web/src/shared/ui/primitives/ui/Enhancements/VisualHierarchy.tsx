// @ts-nocheck
/**
 * VisualHierarchy - Enhanced Visual Hierarchy Components
 * 
 * Provides enhanced visual hierarchy and content scanning patterns
 * to improve user experience and reduce cognitive load.
 * 
 * Features:
 * - Enhanced content prioritization
 * - Improved visual scanning patterns
 * - Better information architecture
 * - Contextual visual cues
 * - Performance optimized rendering
 * - Accessibility compliant hierarchy
 */

import React, { memo, useCallback, useState, useEffect, useMemo } from 'react'
import { cn } from '@shared/lib/cn'

// ========================================
// Types & Interfaces
// ========================================

export interface VisualHierarchyProps {
  children: React.ReactNode
  level?: 1 | 2 | 3 | 4 | 5 | 6
  variant?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'muted'
  emphasis?: 'none' | 'subtle' | 'medium' | 'strong'
  alignment?: 'left' | 'center' | 'right' | 'justify'
  className?: string
}

export interface ContentPriorityProps {
  children: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  variant?: 'card' | 'banner' | 'inline' | 'modal'
  interactive?: boolean
  onAction?: () => void
  className?: string
}

export interface ScanningPatternProps {
  children: React.ReactNode
  pattern?: 'f-pattern' | 'z-pattern' | 'layer-cake' | 'spotted' | 'banner-blindness'
  density?: 'sparse' | 'balanced' | 'dense'
  flow?: 'vertical' | 'horizontal' | 'diagonal' | 'radial'
  className?: string
}

export interface VisualCueProps {
  children: React.ReactNode
  cue: 'arrow' | 'highlight' | 'badge' | 'icon' | 'number' | 'progress' | 'pulse'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  className?: string
}

export interface InformationArchitectureProps {
  sections: InformationSection[]
  layout?: 'stacked' | 'sidebar' | 'tabs' | 'accordion' | 'grid'
  navigation?: boolean
  searchable?: boolean
  onSectionChange?: (section: string) => void
  className?: string
}

export interface InformationSection {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  priority?: 'high' | 'medium' | 'low'
  tags?: string[]
  icon?: React.ComponentType<{ className?: string }>
}

export interface ContentGroupingProps {
  children: React.ReactNode
  groups: ContentGroup[]
  layout?: 'cards' | 'list' | 'grid' | 'timeline'
  spacing?: 'tight' | 'normal' | 'loose'
  className?: string
}

export interface ContentGroup {
  id: string
  title: string
  description?: string
  items: React.ReactNode[]
  priority?: 'high' | 'medium' | 'low'
  collapsible?: boolean
  defaultExpanded?: boolean
}

// ========================================
// VisualHierarchy Component
// ========================================

const VisualHierarchyComponent = memo<VisualHierarchyProps>(({
  children,
  level = 1,
  variant = 'primary',
  emphasis = 'medium',
  alignment = 'left',
  className
}) => {
  const hierarchyClasses = cn(
    'font-display',
    {
      // Level-based sizing
      'text-5xl font-bold leading-tight': level === 1,
      'text-4xl font-bold leading-tight': level === 2,
      'text-3xl font-semibold leading-snug': level === 3,
      'text-2xl font-semibold leading-snug': level === 4,
      'text-xl font-medium leading-normal': level === 5,
      'text-lg font-medium leading-normal': level === 6,
      
      // Variant-based colors
      'text-foreground': variant === 'primary',
      'text-muted-foreground': variant === 'secondary',
      'text-muted-foreground/80': variant === 'tertiary',
      'text-primary': variant === 'accent',
      'text-muted-foreground/60': variant === 'muted',
      
      // Emphasis-based styling
      'font-normal': emphasis === 'none',
      'font-medium': emphasis === 'subtle',
      'font-semibold': emphasis === 'medium',
      'font-bold': emphasis === 'strong',
      
      // Alignment
      'text-left': alignment === 'left',
      'text-center': alignment === 'center',
      'text-right': alignment === 'right',
      'text-justify': alignment === 'justify',
    },
    className
  )
  
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  
  return (
    <Tag className={hierarchyClasses}>
      {children}
    </Tag>
  )
})

VisualHierarchyComponent.displayName = 'VisualHierarchy'

// ========================================
// ContentPriority Component
// ========================================

const ContentPriorityComponent = memo<ContentPriorityProps>(({
  children,
  priority,
  variant = 'card',
  interactive = false,
  onAction,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const priorityClasses = cn(
    'transition-all duration-normal',
    {
      // Priority-based styling
      'border-2 border-primary shadow-lg': priority === 'high',
      'border border-border shadow-md': priority === 'medium',
      'border border-border/50 shadow-sm': priority === 'low',
      
      // Variant-based styling
      'rounded-lg p-6': variant === 'card',
      'rounded-t-lg p-4 border-b-2': variant === 'banner',
      'inline-block px-3 py-1': variant === 'inline',
      'rounded-xl p-8 shadow-2xl': variant === 'modal',
      
      // Interactive states
      'cursor-pointer hover:shadow-lg hover:scale-102': interactive && isHovered,
      'hover:shadow-md hover:scale-101': interactive && !isHovered,
    },
    className
  )
  
  const handleMouseEnter = useCallback(() => {
    if (interactive) setIsHovered(true)
  }, [interactive])
  
  const handleMouseLeave = useCallback(() => {
    if (interactive) setIsHovered(false)
  }, [interactive])
  
  const handleClick = useCallback(() => {
    if (interactive && onAction) {
      onAction()
    }
  }, [interactive, onAction])
  
  return (
    <div
      className={priorityClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  )
})

ContentPriorityComponent.displayName = 'ContentPriority'

// ========================================
// ScanningPattern Component
// ========================================

const ScanningPatternComponent = memo<ScanningPatternProps>(({
  children,
  pattern = 'f-pattern',
  density = 'balanced',
  flow = 'vertical',
  className
}) => {
  const patternClasses = cn(
    'transition-all duration-normal',
    {
      // Pattern-based layouts
      'grid grid-cols-1 gap-4': pattern === 'f-pattern',
      'flex flex-col space-y-4': pattern === 'z-pattern',
      'space-y-6': pattern === 'layer-cake',
      'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': pattern === 'spotted',
      'flex flex-col space-y-2': pattern === 'banner-blindness',
      
      // Density-based spacing
      'space-y-2': density === 'sparse',
      'space-y-4': density === 'balanced',
      'space-y-6': density === 'dense',
      
      // Flow-based direction
      'flex-col': flow === 'vertical',
      'flex-row': flow === 'horizontal',
      'flex-col md:flex-row': flow === 'diagonal',
      'flex-col items-center': flow === 'radial',
    },
    className
  )
  
  return (
    <div className={patternClasses}>
      {children}
    </div>
  )
})

ScanningPatternComponent.displayName = 'ScanningPattern'

// ========================================
// VisualCue Component
// ========================================

const VisualCueComponent = memo<VisualCueProps>(({
  children,
  cue,
  position = 'top-right',
  color = 'primary',
  size = 'md',
  animated = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(true)
    }
  }, [animated])
  
  const cueClasses = cn(
    'absolute z-10 transition-all duration-normal',
    {
      // Position-based placement
      'top-0 left-0': position === 'top-left',
      'top-0 right-0': position === 'top-right',
      'bottom-0 left-0': position === 'bottom-left',
      'bottom-0 right-0': position === 'bottom-right',
      'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2': position === 'center',
      
      // Size-based dimensions
      'h-4 w-4': size === 'sm',
      'h-6 w-6': size === 'md',
      'h-8 w-8': size === 'lg',
      
      // Color-based styling
      'bg-primary text-primary-foreground': color === 'primary',
      'bg-success text-success-foreground': color === 'success',
      'bg-warning text-warning-foreground': color === 'warning',
      'bg-destructive text-destructive-foreground': color === 'error',
      'bg-info text-info-foreground': color === 'info',
      
      // Animation states
      'opacity-0 scale-0': !isVisible,
      'opacity-100 scale-100': isVisible,
      'animate-pulse': animated && cue === 'pulse',
      'animate-bounce': animated && cue === 'badge',
    },
    className
  )
  
  const renderCue = () => {
    switch (cue) {
      case 'arrow': {
        return (
          <div className="flex items-center justify-center">
            <svg className="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
      }
      case 'highlight': {
        return (
          <div className="h-full w-full rounded-full bg-current opacity-20" />
        )
      }
      case 'badge': {
        return (
          <div className="flex h-full w-full items-center justify-center rounded-full text-xs font-bold">
            !
          </div>
        )
      }
      case 'icon': {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-3/4 w-3/4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        )
      }
      case 'number': {
        return (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold">
            1
          </div>
        )
      }
      case 'progress': {
        return (
          <div className="h-full w-full rounded-full bg-current opacity-20">
            <div className="h-full w-1/2 rounded-full bg-current" />
          </div>
        )
      }
      case 'pulse': {
        return (
          <div className="h-full w-full rounded-full bg-current animate-ping" />
        )
      }
      default: {
        return null
      }
    }
  }
  
  return (
    <div className="relative">
      {children}
      <div className={cueClasses}>
        {renderCue()}
      </div>
    </div>
  )
})

VisualCueComponent.displayName = 'VisualCue'

// ========================================
// InformationArchitecture Component
// ========================================

const InformationArchitectureComponent = memo<InformationArchitectureProps>(({
  sections,
  layout = 'stacked',
  navigation = true,
  searchable = false,
  onSectionChange,
  className
}) => {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState(sections)
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredSections(filtered)
    } else {
      setFilteredSections(sections)
    }
  }, [searchQuery, sections])
  
  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    onSectionChange?.(sectionId)
  }, [onSectionChange])
  
  const layoutClasses = cn(
    'transition-all duration-normal',
    {
      'space-y-6': layout === 'stacked',
      'flex gap-6': layout === 'sidebar',
      'space-y-4': layout === 'tabs',
      'space-y-2': layout === 'accordion',
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6': layout === 'grid',
    },
    className
  )
  
  const renderNavigation = () => {
    if (!navigation) return null
    
    return (
      <nav className="mb-6">
        <ul className="flex flex-wrap gap-2">
          {filteredSections.map(section => (
            <li key={section.id}>
              <button
                onClick={() => handleSectionChange(section.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-normal',
                  {
                    'bg-primary text-primary-foreground': activeSection === section.id,
                    'bg-muted text-muted-foreground hover:bg-accent': activeSection !== section.id,
                  }
                )}
              >
                {section.icon && <section.icon className="h-4 w-4 mr-2 inline" />}
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    )
  }
  
  const renderSearch = () => {
    if (!searchable) return null
    
    return (
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sections..."
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-normal"
        />
      </div>
    )
  }
  
  const renderContent = () => {
    if (layout === 'tabs') {
      return (
        <div className="space-y-4">
          {filteredSections.map(section => (
            <div
              key={section.id}
              className={cn(
                'p-6 border border-border rounded-lg transition-all duration-normal',
                {
                  'block': activeSection === section.id,
                  'hidden': activeSection !== section.id,
                }
              )}
            >
              {section.content}
            </div>
          ))}
        </div>
      )
    }
    
    if (layout === 'accordion') {
      return (
        <div className="space-y-2">
          {filteredSections.map(section => (
            <div key={section.id} className="border border-border rounded-lg">
              <button
                onClick={() => handleSectionChange(section.id)}
                className="w-full p-4 text-left hover:bg-accent transition-colors duration-normal"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {section.icon && <section.icon className="h-5 w-5" />}
                    <h3 className="font-medium">{section.title}</h3>
                  </div>
                  <svg
                    className={cn(
                      'h-5 w-5 transition-transform duration-normal',
                      {
                        'rotate-180': activeSection === section.id,
                      }
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {activeSection === section.id && (
                <div className="p-4 border-t border-border">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        {filteredSections.map(section => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-3">
              {section.icon && <section.icon className="h-6 w-6" />}
              <h2 className="text-2xl font-semibold">{section.title}</h2>
            </div>
            {section.description && (
              <p className="text-muted-foreground">{section.description}</p>
            )}
            {section.content}
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className={layoutClasses}>
      {renderSearch()}
      {renderNavigation()}
      {renderContent()}
    </div>
  )
})

InformationArchitectureComponent.displayName = 'InformationArchitecture'

// ========================================
// ContentGrouping Component
// ========================================

const ContentGroupingComponent = memo<ContentGroupingProps>(({
  children,
  groups,
  layout = 'cards',
  spacing = 'normal',
  className
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.filter(g => g.defaultExpanded).map(g => g.id))
  )
  
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }, [])
  
  const layoutClasses = cn(
    'transition-all duration-normal',
    {
      'space-y-4': layout === 'cards',
      'space-y-2': layout === 'list',
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4': layout === 'grid',
      'space-y-6': layout === 'timeline',
      
      'space-y-2': spacing === 'tight',
      'space-y-4': spacing === 'normal',
      'space-y-6': spacing === 'loose',
    },
    className
  )
  
  return (
    <div className={layoutClasses}>
      {groups.map(group => (
        <div key={group.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{group.title}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>
            {group.collapsible && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="p-2 hover:bg-accent rounded-lg transition-colors duration-normal"
              >
                <svg
                  className={cn(
                    'h-5 w-5 transition-transform duration-normal',
                    {
                      'rotate-180': expandedGroups.has(group.id),
                    }
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          {(!group.collapsible || expandedGroups.has(group.id)) && (
            <div className={cn(
              'transition-all duration-normal',
              {
                'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4': layout === 'cards',
                'space-y-2': layout === 'list',
                'space-y-4': layout === 'grid',
                'space-y-6': layout === 'timeline',
              }
            )}>
              {group.items.map((item, index) => (
                <div key={index} className="space-y-2">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
})

ContentGroupingComponent.displayName = 'ContentGrouping'

// ========================================
// Exports
// ========================================

export { VisualHierarchyComponent as VisualHierarchy }
export { ContentPriorityComponent as ContentPriority }
export { ScanningPatternComponent as ScanningPattern }
export { VisualCueComponent as VisualCue }
export { InformationArchitectureComponent as InformationArchitecture }
export { ContentGroupingComponent as ContentGrouping }

export default VisualHierarchyComponent
export type { 
  VisualHierarchyProps, 
  ContentPriorityProps, 
  ScanningPatternProps, 
  VisualCueProps, 
  InformationArchitectureProps, 
  InformationSection, 
  ContentGroupingProps, 
  ContentGroup 
}
