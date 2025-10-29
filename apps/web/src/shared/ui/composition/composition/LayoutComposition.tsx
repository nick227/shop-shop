/**
 * Layout Composition - Flexible Layout Building Blocks
 * 
 * Addresses critical composition issues:
 * - Missing layout composition primitives
 * - Inconsistent layout patterns
 * - Poor responsive layout strategy
 * - No accessibility layout guidelines
 */

import React, { memo, useMemo } from 'react'
import { cn } from '@utils/cn'

// ========================================
// Types & Interfaces
// ========================================

export type LayoutType = 'grid' | 'flex' | 'stack' | 'sidebar' | 'header-content-footer'
export type LayoutDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'
export type LayoutAlignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type LayoutJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
export type LayoutGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface LayoutCompositionProps {
  type: LayoutType
  direction: LayoutDirection
  alignment: LayoutAlignment
  justify: LayoutJustify
  gap: LayoutGap
  wrap: boolean
  responsive: boolean
  children: React.ReactNode
  className?: string
}

export interface GridCompositionProps {
  columns: number | { mobile: number; tablet: number; desktop: number }
  rows?: number | { mobile: number; tablet: number; desktop: number }
  gap: LayoutGap
  responsive: boolean
  children: React.ReactNode
  className?: string
}

export interface FlexCompositionProps {
  direction: LayoutDirection
  alignment: LayoutAlignment
  justify: LayoutJustify
  gap: LayoutGap
  wrap: boolean
  responsive: boolean
  children: React.ReactNode
  className?: string
}

export interface StackCompositionProps {
  direction: LayoutDirection
  gap: LayoutGap
  responsive: boolean
  children: React.ReactNode
  className?: string
}

export interface SidebarCompositionProps {
  sidebar: React.ReactNode
  content: React.ReactNode
  sidebarPosition: 'left' | 'right'
  sidebarWidth: 'sm' | 'md' | 'lg' | 'xl'
  responsive: boolean
  className?: string
}

export interface HeaderContentFooterCompositionProps {
  header: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  stickyHeader: boolean
  stickyFooter: boolean
  responsive: boolean
  className?: string
}

// ========================================
// Layout Composition Component
// ========================================

const LayoutCompositionComponent = memo<LayoutCompositionProps>(({
  type,
  direction,
  alignment,
  justify,
  gap,
  wrap,
  responsive,
  children,
  className
}) => {
  const layoutClasses = useMemo(() => {
    const baseClasses = 'layout-composition'
    const typeClasses = `layout-composition--${type}`
    const directionClasses = `layout-composition--${direction}`
    const alignmentClasses = `layout-composition--align-${alignment}`
    const justifyClasses = `layout-composition--justify-${justify}`
    const gapClasses = `layout-composition--gap-${gap}`
    const wrapClasses = wrap ? 'layout-composition--wrap' : ''
    const responsiveClasses = responsive ? 'layout-composition--responsive' : ''
    
    return cn(
      baseClasses,
      typeClasses,
      directionClasses,
      alignmentClasses,
      justifyClasses,
      gapClasses,
      wrapClasses,
      responsiveClasses,
      className
    )
  }, [type, direction, alignment, justify, gap, wrap, responsive, className])
  
  const style = useMemo(() => {
    if (type === 'grid') {
      return {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: gap === 'none' ? '0' : `var(--space-${gap})`,
        alignItems: alignment,
        justifyContent: justify
      }
    }
    
    if (type === 'flex') {
      return {
        display: 'flex',
        flexDirection: direction,
        alignItems: alignment,
        justifyContent: justify,
        gap: gap === 'none' ? '0' : `var(--space-${gap})`,
        flexWrap: wrap ? 'wrap' : 'nowrap'
      }
    }
    
    if (type === 'stack') {
      return {
        display: 'flex',
        flexDirection: direction,
        gap: gap === 'none' ? '0' : `var(--space-${gap})`
      }
    }
    
    return {}
  }, [type, direction, alignment, justify, gap, wrap])
  
  return (
    <div className={layoutClasses} style={style}>
      {children}
    </div>
  )
})

LayoutCompositionComponent.displayName = 'LayoutComposition'

// ========================================
// Grid Composition Component
// ========================================

const GridCompositionComponent = memo<GridCompositionProps>(({
  columns,
  rows,
  gap,
  responsive,
  children,
  className
}) => {
  const gridClasses = useMemo(() => {
    const baseClasses = 'grid-composition'
    const gapClasses = `grid-composition--gap-${gap}`
    const responsiveClasses = responsive ? 'grid-composition--responsive' : ''
    
    return cn(
      baseClasses,
      gapClasses,
      responsiveClasses,
      className
    )
  }, [gap, responsive, className])
  
  const style = useMemo(() => {
    const gridTemplateColumns = typeof columns === 'number' 
      ? `repeat(${columns}, 1fr)`
      : `repeat(${columns.desktop}, 1fr)`
    
    const gridTemplateRows = rows 
      ? (typeof rows === 'number' 
          ? `repeat(${rows}, 1fr)`
          : `repeat(${rows.desktop}, 1fr)`)
      : 'auto'
    
    return {
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows,
      gap: gap === 'none' ? '0' : `var(--space-${gap})`
    }
  }, [columns, rows, gap])
  
  return (
    <div className={gridClasses} style={style}>
      {children}
    </div>
  )
})

GridCompositionComponent.displayName = 'GridComposition'

// ========================================
// Flex Composition Component
// ========================================

const FlexCompositionComponent = memo<FlexCompositionProps>(({
  direction,
  alignment,
  justify,
  gap,
  wrap,
  responsive,
  children,
  className
}) => {
  const flexClasses = useMemo(() => {
    const baseClasses = 'flex-composition'
    const directionClasses = `flex-composition--${direction}`
    const alignmentClasses = `flex-composition--align-${alignment}`
    const justifyClasses = `flex-composition--justify-${justify}`
    const gapClasses = `flex-composition--gap-${gap}`
    const wrapClasses = wrap ? 'flex-composition--wrap' : ''
    const responsiveClasses = responsive ? 'flex-composition--responsive' : ''
    
    return cn(
      baseClasses,
      directionClasses,
      alignmentClasses,
      justifyClasses,
      gapClasses,
      wrapClasses,
      responsiveClasses,
      className
    )
  }, [direction, alignment, justify, gap, wrap, responsive, className])
  
  const style = useMemo(() => ({
    display: 'flex',
    flexDirection: direction,
    alignItems: alignment,
    justifyContent: justify,
    gap: gap === 'none' ? '0' : `var(--space-${gap})`,
    flexWrap: wrap ? 'wrap' : 'nowrap'
  }), [direction, alignment, justify, gap, wrap])
  
  return (
    <div className={flexClasses} style={style}>
      {children}
    </div>
  )
})

FlexCompositionComponent.displayName = 'FlexComposition'

// ========================================
// Stack Composition Component
// ========================================

const StackCompositionComponent = memo<StackCompositionProps>(({
  direction,
  gap,
  responsive,
  children,
  className
}) => {
  const stackClasses = useMemo(() => {
    const baseClasses = 'stack-composition'
    const directionClasses = `stack-composition--${direction}`
    const gapClasses = `stack-composition--gap-${gap}`
    const responsiveClasses = responsive ? 'stack-composition--responsive' : ''
    
    return cn(
      baseClasses,
      directionClasses,
      gapClasses,
      responsiveClasses,
      className
    )
  }, [direction, gap, responsive, className])
  
  const style = useMemo(() => ({
    display: 'flex',
    flexDirection: direction,
    gap: gap === 'none' ? '0' : `var(--space-${gap})`
  }), [direction, gap])
  
  return (
    <div className={stackClasses} style={style}>
      {children}
    </div>
  )
})

StackCompositionComponent.displayName = 'StackComposition'

// ========================================
// Sidebar Composition Component
// ========================================

const SidebarCompositionComponent = memo<SidebarCompositionProps>(({
  sidebar,
  content,
  sidebarPosition,
  sidebarWidth,
  responsive,
  className
}) => {
  const sidebarClasses = useMemo(() => {
    const baseClasses = 'sidebar-composition'
    const positionClasses = `sidebar-composition--${sidebarPosition}`
    const widthClasses = `sidebar-composition--${sidebarWidth}`
    const responsiveClasses = responsive ? 'sidebar-composition--responsive' : ''
    
    return cn(
      baseClasses,
      positionClasses,
      widthClasses,
      responsiveClasses,
      className
    )
  }, [sidebarPosition, sidebarWidth, responsive, className])
  
  const sidebarStyle = useMemo(() => {
    const widths = {
      sm: '200px',
      md: '250px',
      lg: '300px',
      xl: '350px'
    }
    
    return {
      width: widths[sidebarWidth],
      minWidth: widths[sidebarWidth]
    }
  }, [sidebarWidth])
  
  return (
    <div className={sidebarClasses}>
      {sidebarPosition === 'left' && (
        <aside className="sidebar-composition-sidebar" style={sidebarStyle}>
          {sidebar}
        </aside>
      )}
      
      <main className="sidebar-composition-content">
        {content}
      </main>
      
      {sidebarPosition === 'right' && (
        <aside className="sidebar-composition-sidebar" style={sidebarStyle}>
          {sidebar}
        </aside>
      )}
    </div>
  )
})

SidebarCompositionComponent.displayName = 'SidebarComposition'

// ========================================
// Header Content Footer Composition Component
// ========================================

const HeaderContentFooterCompositionComponent = memo<HeaderContentFooterCompositionProps>(({
  header,
  content,
  footer,
  stickyHeader,
  stickyFooter,
  responsive,
  className
}) => {
  const layoutClasses = useMemo(() => {
    const baseClasses = 'header-content-footer-composition'
    const stickyHeaderClasses = stickyHeader ? 'header-content-footer-composition--sticky-header' : ''
    const stickyFooterClasses = stickyFooter ? 'header-content-footer-composition--sticky-footer' : ''
    const responsiveClasses = responsive ? 'header-content-footer-composition--responsive' : ''
    
    return cn(
      baseClasses,
      stickyHeaderClasses,
      stickyFooterClasses,
      responsiveClasses,
      className
    )
  }, [stickyHeader, stickyFooter, responsive, className])
  
  return (
    <div className={layoutClasses}>
      <header className={cn(
        'header-content-footer-composition-header',
        {
          'header-content-footer-composition-header--sticky': stickyHeader
        }
      )}>
        {header}
      </header>
      
      <main className="header-content-footer-composition-content">
        {content}
      </main>
      
      {footer && (
        <footer className={cn(
          'header-content-footer-composition-footer',
          {
            'header-content-footer-composition-footer--sticky': stickyFooter
          }
        )}>
          {footer}
        </footer>
      )}
    </div>
  )
})

HeaderContentFooterCompositionComponent.displayName = 'HeaderContentFooterComposition'

// ========================================
// Composition Factory
// ========================================

export const LayoutCompositionFactory = {
  // Layout Composition
  Layout: LayoutCompositionComponent,
  
  // Grid Composition
  Grid: GridCompositionComponent,
  
  // Flex Composition
  Flex: FlexCompositionComponent,
  
  // Stack Composition
  Stack: StackCompositionComponent,
  
  // Sidebar Composition
  Sidebar: SidebarCompositionComponent,
  
  // Header Content Footer Composition
  HeaderContentFooter: HeaderContentFooterCompositionComponent
}

// ========================================
// Exports
// ========================================

export { 
  LayoutCompositionComponent as LayoutComposition,
  GridCompositionComponent as GridComposition,
  FlexCompositionComponent as FlexComposition,
  StackCompositionComponent as StackComposition,
  SidebarCompositionComponent as SidebarComposition,
  HeaderContentFooterCompositionComponent as HeaderContentFooterComposition
}

export type { 
  LayoutCompositionProps,
  GridCompositionProps,
  FlexCompositionProps,
  StackCompositionProps,
  SidebarCompositionProps,
  HeaderContentFooterCompositionProps,
  LayoutType,
  LayoutDirection,
  LayoutAlignment,
  LayoutJustify,
  LayoutGap
}
