/**
 * Shared Module - Main Entry Point
 * 
 * Cross-application primitives and utilities.
 * This is the single import point for all shared functionality.
 */

// UI Components
export * from './ui/primitives'
export * from './ui/composition'
export * from './ui/layout'
export * from './ui/cards'
export * from './ui/templates'
export { ErrorBoundary } from './ui/ErrorBoundary'

// Utilities and Helpers
export * from './lib'

// Types
export * from './types'

// Constants
export * from './constants'

// Form Utilities
export * from './form'

// Hooks
export * from './hooks'

// Guards
export * from './guards'
