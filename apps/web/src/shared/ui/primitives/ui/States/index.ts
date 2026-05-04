// @ts-nocheck
/**
 * Unified State Management System
 * 
 * Exports all state management components for consistent UI patterns.
 * Provides loading states, error states, and empty states across the application.
 */

// Loading States
export { LoadingStates, default as LoadingStatesDefault } from './LoadingStates'
export type { 
  LoadingConfig, 
  SkeletonConfig, 
  LoadingSize, 
  LoadingVariant, 
  SkeletonVariant 
} from './LoadingStates'

// Error States
export { ErrorStates, default as ErrorStatesDefault } from './ErrorStates'
export type { 
  ErrorConfig, 
  ErrorSeverity, 
  ErrorVariant, 
  ErrorSize 
} from './ErrorStates'

// Re-export for convenience
export { LoadingStates as Loading, ErrorStates as Error }
