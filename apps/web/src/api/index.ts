/**
 * API Module - Main Entry Point
 */

// Error handling
export * from './errors'

// API client
export { apiClient } from './client'

// Legacy wrapper (used by generated hooks)
export * as legacyApi from './apiWrapper'
