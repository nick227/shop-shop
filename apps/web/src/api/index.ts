/**
 * API Module - Main Entry Point
 * 
 * Provides unified access to API operations through a clean, SDK-first interface.
 * All features should import from this module, never directly from @packages/sdk.
 */

// Main API client adapter (recommended for all operations)
export { api } from './client-adapter'

// Query and mutation functions
export * from './queries'
export * from './mutations'

// React Query hooks
export * from './hooks'

// Validation schemas and adapters
export * from './adapters'

// Error handling
export * from './errors'

// Legacy exports (for backward compatibility during migration)
export { apiClient } from './client'
export * as legacyApi from './apiWrapper'

