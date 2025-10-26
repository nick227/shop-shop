/**
 * URL Parameter Validation Utilities
 * DEPRECATED: Use unified validation service instead
 * @deprecated Use @utils/validation/unified for new code
 */

// Re-export from unified validation service for backward compatibility
// export {
//   validateCoordinates,
//   validateState,
//   validateZipCode,
//   sanitizeCityName,
//   isUSCoordinates,
//   type ValidationResult,
//   type LocationValidationData
// } from './unified' // Removed due to complex type issues

// Legacy types for backward compatibility
export interface ValidatedCoordinates {
  latitude: number
  longitude: number
  radius: number
}

export interface ValidationError {
  field: string
  message: string
}

