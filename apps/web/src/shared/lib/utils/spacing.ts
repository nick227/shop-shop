/**
 * Unified Spacing System
 * 
 * Provides consistent spacing values across the entire application.
 * Replaces hardcoded spacing values with a unified scale.
 * 
 * Features:
 * - Consistent spacing scale
 * - Responsive spacing values
 * - Semantic spacing names
 * - Type-safe spacing utilities
 */

// ========================================
// Spacing Scale
// ========================================

export const spacing = {
  // Micro spacing (0-8px)
  '0': '0px',
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1.5': '0.375rem',  // 6px
  '2': '0.5rem',      // 8px
  
  // Small spacing (8-16px)
  '2.5': '0.625rem',  // 10px
  '3': '0.75rem',     // 12px
  '3.5': '0.875rem',  // 14px
  '4': '1rem',        // 16px
  
  // Medium spacing (16-32px)
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '7': '1.75rem',     // 28px
  '8': '2rem',        // 32px
  
  // Large spacing (32-64px)
  '9': '2.25rem',     // 36px
  '10': '2.5rem',     // 40px
  '11': '2.75rem',    // 44px
  '12': '3rem',       // 48px
  '14': '3.5rem',     // 56px
  '16': '4rem',       // 64px
  
  // Extra large spacing (64px+)
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
  '28': '7rem',       // 112px
  '32': '8rem',       // 128px
  '36': '9rem',       // 144px
  '40': '10rem',      // 160px
  '44': '11rem',      // 176px
  '48': '12rem',      // 192px
  '52': '13rem',      // 208px
  '56': '14rem',      // 224px
  '60': '15rem',      // 240px
  '64': '16rem',      // 256px
  '72': '18rem',      // 288px
  '80': '20rem',      // 320px
  '96': '24rem',      // 384px
} as const

// ========================================
// Semantic Spacing Names
// ========================================

export const semanticSpacing = {
  // Component spacing
  component: {
    padding: spacing['4'],      // 16px
    margin: spacing['2'],       // 8px
    gap: spacing['3'],          // 12px
  },
  
  // Layout spacing
  layout: {
    section: spacing['16'],     // 64px
    container: spacing['6'],    // 24px
    grid: spacing['4'],         // 16px
  },
  
  // Form spacing
  form: {
    field: spacing['4'],        // 16px
    group: spacing['6'],        // 24px
    section: spacing['8'],      // 32px
  },
  
  // Card spacing
  card: {
    padding: spacing['6'],      // 24px
    gap: spacing['4'],          // 16px
    margin: spacing['4'],       // 16px
  },
  
  // Button spacing
  button: {
    padding: spacing['4'],      // 16px
    gap: spacing['2'],          // 8px
    margin: spacing['2'],       // 8px
  },
  
  // List spacing
  list: {
    item: spacing['3'],         // 12px
    group: spacing['6'],        // 24px
    section: spacing['8'],      // 32px
  }
} as const

// ========================================
// Responsive Spacing
// ========================================

export const responsiveSpacing = {
  // Mobile-first responsive spacing
  mobile: {
    component: spacing['2'],    // 8px
    layout: spacing['4'],       // 16px
    section: spacing['8'],      // 32px
  },
  
  tablet: {
    component: spacing['3'],    // 12px
    layout: spacing['6'],       // 24px
    section: spacing['12'],     // 48px
  },
  
  desktop: {
    component: spacing['4'],    // 16px
    layout: spacing['8'],       // 32px
    section: spacing['16'],     // 64px
  },
  
  wide: {
    component: spacing['6'],    // 24px
    layout: spacing['12'],      // 48px
    section: spacing['20'],     // 80px
  }
} as const


// ========================================
// Type Definitions
// ========================================

export type SpacingKey = keyof typeof spacing
export type SemanticSpacingKey = keyof typeof semanticSpacing
export type ResponsiveSpacingKey = keyof typeof responsiveSpacing

// ========================================
// Helper Functions
// ========================================


// ========================================
// Exports
// ========================================

export default spacing
