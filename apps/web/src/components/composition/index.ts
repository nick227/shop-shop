/**
 * Composition System - Unified Component Architecture
 * 
 * Provides consistent composition patterns across the entire application.
 * Replaces multiple component implementations with a unified system.
 * 
 * Features:
 * - Unified page composition patterns
 * - Consistent card composition system
 * - Flexible layout composition primitives
 * - Responsive composition with breakpoint awareness
 * - Accessibility composition guidelines
 * - Performance optimized with proper memoization
 */

// ========================================
// Page Composition
// ========================================
export { 
  PageComposition, 
  PageCompositionFactory,
  useResponsivePageComposition,
  SidebarContent,
  TopNavContent,
  BottomNavContent
} from './PageComposition'

export type {
  PageCompositionProps,
  ResponsiveConfig,
  BreadcrumbItem,
  PageAction,
  PageSection
} from './PageComposition'

// ========================================
// Card Composition
// ========================================
export { 
  CardComposition, 
  CardCompositionFactory
} from './CardComposition'

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
} from './CardComposition'

// ========================================
// Layout Composition
// ========================================
export { 
  LayoutComposition,
  GridComposition,
  FlexComposition,
  StackComposition,
  SidebarComposition,
  HeaderContentFooterComposition,
  LayoutCompositionFactory
} from './LayoutComposition'

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
} from './LayoutComposition'

// ========================================
// Composition Factory
// ========================================
export const CompositionFactory = {
  // Page Composition
  Page: PageCompositionFactory,
  
  // Card Composition
  Card: CardCompositionFactory,
  
  // Layout Composition
  Layout: LayoutCompositionFactory
} as const

// ========================================
// Composition Hooks
// ========================================
export { useResponsivePageComposition } from './PageComposition'

// ========================================
// Composition Utilities
// ========================================
export const CompositionUtils = {
  // Create responsive configuration
  createResponsiveConfig: <T>(config: {
    mobile: T
    tablet: T
    desktop: T
  }) => config,
  
  // Create page section
  createPageSection: (id: string, title: string, children: React.ReactNode) => ({
    id,
    title,
    children
  }),
  
  // Create card features
  createCardFeatures: (features: Partial<CardFeatures>) => features,
  
  // Create layout configuration
  createLayoutConfig: (type: LayoutType, options: Partial<LayoutCompositionProps>) => ({
    type,
    ...options
  })
} as const

// ========================================
// Default Compositions
// ========================================
export const DefaultCompositions = {
  // Default page compositions
  AppPage: (props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionFactory.App {...props} />
  ),
  
  MarketingPage: (props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionFactory.Marketing {...props} />
  ),
  
  AuthPage: (props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionFactory.Auth {...props} />
  ),
  
  AdminPage: (props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionFactory.Admin {...props} />
  ),
  
  MobilePage: (props: Omit<PageCompositionProps, 'template'>) => (
    <PageCompositionFactory.Mobile {...props} />
  ),
  
  // Default card compositions
  ProductCard: (props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionFactory.Product {...props} />
  ),
  
  StoreCard: (props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionFactory.Store {...props} />
  ),
  
  OrderCard: (props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionFactory.Order {...props} />
  ),
  
  CustomCard: (props: Omit<CardCompositionProps, 'variant'>) => (
    <CardCompositionFactory.Custom {...props} />
  ),
  
  // Default layout compositions
  GridLayout: (props: GridCompositionProps) => (
    <LayoutCompositionFactory.Grid {...props} />
  ),
  
  FlexLayout: (props: FlexCompositionProps) => (
    <LayoutCompositionFactory.Flex {...props} />
  ),
  
  StackLayout: (props: StackCompositionProps) => (
    <LayoutCompositionFactory.Stack {...props} />
  ),
  
  SidebarLayout: (props: SidebarCompositionProps) => (
    <LayoutCompositionFactory.Sidebar {...props} />
  ),
  
  HeaderContentFooterLayout: (props: HeaderContentFooterCompositionProps) => (
    <LayoutCompositionFactory.HeaderContentFooter {...props} />
  )
} as const

// ========================================
// Composition Constants
// ========================================
export const CompositionConstants = {
  // Page templates
  PAGE_TEMPLATES: ['app', 'marketing', 'auth', 'admin', 'mobile'] as const,
  
  // Card variants
  CARD_VARIANTS: ['product', 'store', 'order', 'custom', 'base'] as const,
  
  // Layout types
  LAYOUT_TYPES: ['grid', 'flex', 'stack', 'sidebar', 'header-content-footer'] as const,
  
  // Layout directions
  LAYOUT_DIRECTIONS: ['row', 'column', 'row-reverse', 'column-reverse'] as const,
  
  // Layout alignments
  LAYOUT_ALIGNMENTS: ['start', 'center', 'end', 'stretch', 'baseline'] as const,
  
  // Layout justify options
  LAYOUT_JUSTIFY_OPTIONS: ['start', 'center', 'end', 'between', 'around', 'evenly'] as const,
  
  // Layout gaps
  LAYOUT_GAPS: ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const,
  
  // Card sizes
  CARD_SIZES: ['sm', 'md', 'lg', 'xl'] as const,
  
  // Card layouts
  CARD_LAYOUTS: ['horizontal', 'vertical', 'grid', 'list'] as const
} as const

// ========================================
// Type Exports
// ========================================
export type {
  PageTemplate,
  PageLayout,
  CardVariant,
  CardLayout,
  CardSize,
  LayoutType,
  LayoutDirection,
  LayoutAlignment,
  LayoutJustify,
  LayoutGap
} from './PageComposition'

export type {
  CardImageConfig,
  CardActionConfig,
  CardBadgeConfig,
  CardMetaConfig,
  CardFeatures
} from './CardComposition'

export type {
  GridCompositionProps,
  FlexCompositionProps,
  StackCompositionProps,
  SidebarCompositionProps,
  HeaderContentFooterCompositionProps
} from './LayoutComposition'
