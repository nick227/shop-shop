/**
 * Validation Service Configuration
 * Production-ready configuration for unified validation service
 */

// import type { any } from './unified' // Removed due to complex type issues

// ============================================
// Environment-based Configuration
// ============================================

const isDevelopment = import.meta.env.MODE === 'development'
const isProduction = import.meta.env.MODE === 'production'
const isTest = import.meta.env.MODE === 'test'

// ============================================
// Default Configuration
// ============================================

export const defaultany: any = {
  enableMetrics: true,
  enableLogging: !isProduction, // Disable logging in production for performance
  enableCaching: true,
  maxCacheSize: isProduction ? 2000 : 1000, // Larger cache in production
  logLevel: isDevelopment ? 'debug' : (isTest ? 'error' : 'info')
}

// ============================================
// Environment-specific Configurations
// ============================================

export const developmentConfig: Partial<any> = {
  enableMetrics: true,
  enableLogging: true,
  enableCaching: true,
  maxCacheSize: 500,
  logLevel: 'debug'
}

export const productionConfig: Partial<any> = {
  enableMetrics: true,
  enableLogging: false, // Disable console logging in production
  enableCaching: true,
  maxCacheSize: 2000,
  logLevel: 'error' // Only log errors in production
}

export const testConfig: Partial<any> = {
  enableMetrics: false, // Disable metrics in tests
  enableLogging: false, // Disable logging in tests
  enableCaching: false, // Disable caching in tests for consistency
  maxCacheSize: 0,
  logLevel: 'error'
}

// ============================================
// Configuration Factory
// ============================================

export function getany(): any {
  if (isTest) {
    return { ...defaultany, ...testConfig }
  }
  
  if (isProduction) {
    return { ...defaultany, ...productionConfig }
  }
  
  if (isDevelopment) {
    return { ...defaultany, ...developmentConfig }
  }
  
  return defaultany
}

// ============================================
// Feature Flags
// ============================================

export const validationFeatureFlags = {
  // Enable advanced validation features
  enableAdvancedValidation: isProduction,
  
  // Enable validation analytics
  enableAnalytics: isProduction,
  
  // Enable validation caching
  enableCaching: true,
  
  // Enable validation monitoring
  enableMonitoring: isProduction,
  
  // Enable validation error reporting
  enableErrorReporting: isProduction,
  
  // Enable validation performance tracking
  enablePerformanceTracking: isProduction
} as const

// ============================================
// Validation Limits
// ============================================

export const validationLimits = {
  // Maximum validation attempts per session
  maxValidationAttempts: 100,
  
  // Maximum validation errors before rate limiting
  maxValidationErrors: 10,
  
  // Validation timeout in milliseconds
  validationTimeout: 5000,
  
  // Maximum cache size for validation results
  maxCacheSize: isProduction ? 2000 : 1000,
  
  // Maximum validation history to keep
  maxValidationHistory: 100
} as const

// ============================================
// Error Messages
// ============================================

export const validationErrorMessages = {
  // Generic errors
  UNKNOWN_ERROR: 'An unknown validation error occurred',
  VALIDATION_TIMEOUT: 'Validation timed out',
  VALIDATION_LIMIT_EXCEEDED: 'Too many validation attempts',
  
  // Location validation errors
  INVALID_COORDINATES: 'Invalid coordinates provided',
  INVALID_STATE: 'Invalid state abbreviation',
  INVALID_ZIP: 'Invalid ZIP code format',
  INVALID_CITY: 'Invalid city name',
  
  // Form validation errors
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PASSWORD: 'Password does not meet requirements',
  INVALID_PHONE: 'Invalid phone number format',
  REQUIRED_FIELD: 'This field is required',
  
  // System errors
  CACHE_FULL: 'Validation cache is full',
  METRICS_DISABLED: 'Validation metrics are disabled',
  LOGGING_DISABLED: 'Validation logging is disabled'
} as const

// ============================================
// Performance Thresholds
// ============================================

export const performanceThresholds = {
  // Maximum acceptable validation time (ms)
  maxValidationTime: 100,
  
  // Maximum acceptable cache hit time (ms)
  maxCacheHitTime: 10,
  
  // Maximum acceptable error rate (%)
  maxErrorRate: 5,
  
  // Maximum acceptable memory usage (MB)
  maxMemoryUsage: 50
} as const

// ============================================
// Export Configuration
// ============================================

// export {
//   type any
// } from './unified' // Removed due to complex type issues
