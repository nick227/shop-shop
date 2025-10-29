/**
 * Token-Based Utility Classes
 * 
 * This file provides utility classes that leverage the unified token system
 * instead of hardcoded values. This ensures consistency and maintainability.
 * 
 * Benefits:
 * - Single source of truth through tokens
 * - Automatic theme switching support
 * - Consistent spacing and colors
 * - Better maintainability
 * - Type safety with semantic naming
 */

export const tokenBased = {
  // ========================================
  // LAYOUT UTILITIES
  // ========================================
  
  layout: {
    // Container patterns
    container: 'max-w-7xl mx-auto px-container',
    containerSm: 'max-w-4xl mx-auto px-container',
    containerLg: 'max-w-8xl mx-auto px-container',
    
    // Section spacing
    section: 'py-section',
    sectionSm: 'py-6',
    sectionLg: 'py-12',
    
    // Page layout
    page: 'min-h-screen bg-background text-foreground',
    pageHeader: 'sticky top-0 z-sticky bg-background/80 backdrop-blur-sm border-b border-border',
    pageContent: 'flex-1 px-container py-section',
    pageFooter: 'mt-auto border-t border-border bg-muted/50',
  },
  
  // ========================================
  // COMPONENT UTILITIES
  // ========================================
  
  components: {
    // Card variants
    card: 'bg-surface-base rounded-card shadow-card border border-border',
    cardHover: 'card hover:shadow-card-hover transition-shadow duration-normal',
    cardElevated: 'card shadow-lg',
    cardFlat: 'card shadow-none',
    cardInteractive: 'cardHover cursor-pointer',
    
    // Card sections
    cardHeader: 'flex justify-between items-start mb-component',
    cardBody: 'space-y-element',
    cardFooter: 'flex justify-between items-center pt-component border-t border-border mt-component',
    cardActions: 'flex gap-gap',
    
    // Button variants
    button: 'inline-flex items-center justify-center rounded-button font-medium transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50 disabled:cursor-not-allowed',
    buttonSm: 'button h-button-sm px-3 py-2 text-sm',
    buttonMd: 'button h-button-md px-4 py-3 text-base',
    buttonLg: 'button h-button-lg px-6 py-4 text-lg',
    
    // Button styles
    buttonPrimary: 'button bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-hover active:bg-brand-primary-active',
    buttonSecondary: 'button bg-brand-secondary text-brand-secondary-foreground hover:bg-brand-secondary-hover',
    buttonDestructive: 'button bg-destructive text-destructive-foreground hover:bg-destructive-hover',
    buttonSuccess: 'button bg-success text-success-foreground hover:bg-success-hover',
    buttonWarning: 'button bg-warning text-warning-foreground hover:bg-warning-hover',
    buttonGhost: 'button bg-transparent hover:bg-hover text-foreground',
    buttonOutline: 'button border border-border bg-transparent hover:bg-hover text-foreground',
    
    // Input variants
    input: 'w-full h-input px-4 py-3 rounded-input border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-focus focus:ring-1 focus:ring-focus disabled:bg-disabled-bg disabled:text-disabled-text',
    inputError: 'input border-destructive focus:border-destructive focus:ring-destructive',
    inputSuccess: 'input border-success focus:border-success focus:ring-success',
    
    // Badge variants
    badge: 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
    badgePrimary: 'badge bg-brand-primary/10 text-brand-primary',
    badgeSecondary: 'badge bg-muted text-muted-foreground',
    badgeSuccess: 'badge bg-success/10 text-success',
    badgeWarning: 'badge bg-warning/10 text-warning',
    badgeDestructive: 'badge bg-destructive/10 text-destructive',
    badgeInfo: 'badge bg-info/10 text-info',
    
    // Modal variants
    modal: 'fixed inset-0 z-modal flex items-center justify-center p-4',
    modalBackdrop: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
    modalContent: 'relative bg-surface-base rounded-modal shadow-modal max-w-modal w-full max-h-[90vh] overflow-y-auto',
    modalHeader: 'flex justify-between items-center p-component border-b border-border',
    modalBody: 'p-component space-y-element',
    modalFooter: 'flex justify-end gap-gap p-component border-t border-border',
    
    // Navigation
    nav: 'flex items-center gap-gap',
    navItem: 'flex items-center gap-2 px-4 py-2 rounded-lg text-foreground hover:bg-hover transition-colors duration-normal',
    navItemActive: 'navItem bg-selected text-brand-primary font-medium',
    navLink: 'navItem cursor-pointer',
    navButton: 'navItem cursor-pointer',
  },
  
  // ========================================
  // TYPOGRAPHY UTILITIES
  // ========================================
  
  typography: {
    // Headings
    h1: 'text-5xl font-bold text-primary leading-tight tracking-tight',
    h2: 'text-4xl font-bold text-primary leading-tight tracking-tight',
    h3: 'text-3xl font-semibold text-primary leading-snug tracking-tight',
    h4: 'text-2xl font-semibold text-primary leading-snug',
    h5: 'text-xl font-medium text-primary leading-normal',
    h6: 'text-lg font-medium text-primary leading-normal',
    
    // Body text
    body: 'text-base text-foreground leading-normal',
    bodySm: 'text-sm text-foreground leading-normal',
    bodyLg: 'text-lg text-foreground leading-relaxed',
    
    // Text variants
    textPrimary: 'text-primary',
    textSecondary: 'text-secondary',
    textTertiary: 'text-tertiary',
    textDisabled: 'text-disabled',
    textLink: 'text-link hover:text-link-hover underline-offset-4 hover:underline',
    
    // Text alignment
    textLeft: 'text-left',
    textCenter: 'text-center',
    textRight: 'text-right',
    textJustify: 'text-justify',
    
    // Text weight
    fontThin: 'font-thin',
    fontLight: 'font-light',
    fontNormal: 'font-normal',
    fontMedium: 'font-medium',
    fontSemibold: 'font-semibold',
    fontBold: 'font-bold',
    fontExtrabold: 'font-extrabold',
    fontBlack: 'font-black',
  },
  
  // ========================================
  // SPACING UTILITIES
  // ========================================
  
  spacing: {
    // Padding
    pComponent: 'p-component',
    pSection: 'p-section',
    pPage: 'p-page',
    pElement: 'p-element',
    
    // Margin
    mComponent: 'm-component',
    mSection: 'm-section',
    mPage: 'm-page',
    mElement: 'm-element',
    
    // Gap
    gapComponent: 'gap-component',
    gapSection: 'gap-section',
    gapElement: 'gap-element',
    gapGap: 'gap-gap',
    
    // Space between
    spaceYComponent: 'space-y-component',
    spaceYSection: 'space-y-section',
    spaceYElement: 'space-y-element',
    spaceXComponent: 'space-x-component',
    spaceXSection: 'space-x-section',
    spaceXElement: 'space-x-element',
  },
  
  // ========================================
  // INTERACTIVE UTILITIES
  // ========================================
  
  interactive: {
    // Hover states
    hoverOverlay: 'hover:bg-hover transition-colors duration-normal',
    hoverScale: 'hover:scale-105 transition-transform duration-normal',
    hoverShadow: 'hover:shadow-lg transition-shadow duration-normal',
    
    // Active states
    activeScale: 'active:scale-95 transition-transform duration-fast',
    activeOverlay: 'active:bg-active transition-colors duration-fast',
    
    // Focus states
    focusRing: 'focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2',
    focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
    
    // Disabled states
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    
    // Selection states
    selected: 'bg-selected',
    selectedRing: 'ring-2 ring-brand-primary ring-offset-2',
  },
  
  // ========================================
  // LAYOUT PATTERNS
  // ========================================
  
  patterns: {
    // Flex patterns
    flexRow: 'flex flex-row items-center',
    flexCol: 'flex flex-col',
    flexCenter: 'flex items-center justify-center',
    flexBetween: 'flex items-center justify-between',
    flexStart: 'flex items-center justify-start',
    flexEnd: 'flex items-center justify-end',
    
    // Grid patterns
    grid2: 'grid grid-cols-1 md:grid-cols-2 gap-gap',
    grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gap',
    grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gap',
    gridAuto: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-gap',
    
    // Stack patterns
    stack: 'flex flex-col space-y-element',
    stackHorizontal: 'flex flex-row space-x-element',
    stackCenter: 'flex flex-col items-center space-y-element',
    stackBetween: 'flex flex-col justify-between space-y-element',
    
    // Cluster patterns
    cluster: 'flex flex-wrap gap-gap',
    clusterCenter: 'flex flex-wrap items-center justify-center gap-gap',
    clusterBetween: 'flex flex-wrap items-center justify-between gap-gap',
  },
  
  // ========================================
  // FEATURE-SPECIFIC UTILITIES
  // ========================================
  
  features: {
    // Store cards
    storeCard: 'cardHover p-component',
    storeCardHeader: 'flex justify-between items-start mb-element',
    storeCardTitle: 'text-xl font-semibold text-primary',
    storeCardDescription: 'text-secondary text-sm',
    storeCardMeta: 'flex items-center gap-2 text-tertiary text-xs',
    
    // Product cards
    productCard: 'cardHover p-component',
    productImage: 'w-full h-48 object-cover rounded-lg mb-element',
    productTitle: 'text-lg font-medium text-primary mb-1',
    productPrice: 'text-xl font-bold text-success',
    productMeta: 'flex items-center justify-between text-tertiary text-sm',
    
    // Order cards
    orderCard: 'card p-component',
    orderHeader: 'flex justify-between items-start mb-element',
    orderTitle: 'text-lg font-semibold text-primary',
    orderStatus: 'badge',
    orderItems: 'space-y-2 mb-element',
    orderTotal: 'text-right text-lg font-semibold text-primary',
    
    // Form patterns
    formGroup: 'space-y-2',
    formLabel: 'text-sm font-medium text-primary',
    formInput: 'input',
    formError: 'text-sm text-destructive',
    formHelp: 'text-sm text-tertiary',
    
    // Navigation patterns
    navMain: 'flex items-center gap-gap',
    navItem: 'navItem',
    navItemActive: 'navItemActive',
    navDropdown: 'absolute top-full left-0 mt-2 w-48 bg-surface-overlay rounded-lg shadow-dropdown border border-border z-dropdown',
    
    // Search patterns
    searchBar: 'relative flex items-center',
    searchInput: 'input pl-10 pr-4',
    searchIcon: 'absolute left-3 text-tertiary',
    searchResults: 'absolute top-full left-0 right-0 mt-2 bg-surface-overlay rounded-lg shadow-dropdown border border-border z-dropdown',
    
    // Map patterns
    mapContainer: 'w-full h-96 rounded-lg border border-border overflow-hidden',
    mapMarker: 'w-8 h-8 flex items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground cursor-pointer',
    mapPopup: 'min-w-64 p-4 bg-surface-base rounded-lg shadow-lg',
    
    // Stats patterns
    statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gap',
    statCard: 'card p-component text-center',
    statValue: 'text-3xl font-bold text-primary mb-1',
    statLabel: 'text-sm text-secondary uppercase tracking-wide',
    statIcon: 'text-4xl mb-element text-brand-primary',
  },
  
  // ========================================
  // RESPONSIVE UTILITIES
  // ========================================
  
  responsive: {
    // Mobile-first spacing
    spacingMobile: 'py-6 px-4',
    spacingTablet: 'py-8 px-6',
    spacingDesktop: 'py-12 px-8',
    
    // Responsive typography
    textHeroMobile: 'text-3xl',
    textHeroTablet: 'text-4xl',
    textHeroDesktop: 'text-5xl',
    
    // Responsive containers
    containerMobile: 'px-4',
    containerTablet: 'px-6',
    containerDesktop: 'px-8',
  },
  
  // ========================================
  // ACCESSIBILITY UTILITIES
  // ========================================
  
  accessibility: {
    // Screen reader only
    srOnly: 'sr-only',
    
    // Focus indicators
    focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
    
    // High contrast
    highContrast: 'border-2 border-foreground',
    
    // Reduced motion
    reduceMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
  },
}

// ========================================
// TYPE EXPORTS
// ========================================

export type TokenBasedStyles = typeof tokenBased
export type LayoutStyles = typeof tokenBased.layout
export type ComponentStyles = typeof tokenBased.components
export type TypographyStyles = typeof tokenBased.typography
export type SpacingStyles = typeof tokenBased.spacing
export type InteractiveStyles = typeof tokenBased.interactive
export type PatternStyles = typeof tokenBased.patterns
export type FeatureStyles = typeof tokenBased.features
export type ResponsiveStyles = typeof tokenBased.responsive
export type AccessibilityStyles = typeof tokenBased.accessibility
