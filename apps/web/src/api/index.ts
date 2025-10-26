/**
 * API Module - Main Entry Point;
 * Provides unified access to API client, validation, and types;
 */

// Core API client (low-level SDK access)
export { apiClient } from './client'

// Enhanced API with automatic validation (recommended)
export * as api from './apiWrapper'

// Types and validation;
export * from './types'
export * from './validation'
export * from './errors'

