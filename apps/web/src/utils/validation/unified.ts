/**
 * Unified Validation Service
 * Centralized validation logic for forms, locations, and data
 */
import { z } from 'zod'
import { UltraOptimizedPerformanceMonitor } from '../performance/ultra-optimized-loops'

// ============================================
// Core Validation Types
// ============================================

export interface ValidationResult<T = unknown> {
  valid: boolean
  data?: T
  error?: string
}

export interface ValidationConfig {
  enableMetrics: boolean
  enableLogging: boolean
  strictMode: boolean
}

// ============================================
// Location Validation Schemas
// ============================================

const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(0.1).max(100).optional()
})


const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMiles: z.number().min(0.1).max(100).optional(),
  displayName: z.string().optional(),
  source: z.enum(['search', 'geolocation', 'manual']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional()
})

// ============================================
// Location Validator Class
// ============================================

export class LocationValidator {
  private config: ValidationConfig = {
    enableMetrics: true,
    enableLogging: true,
    strictMode: false
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(
    latitude: number | string,
    longitude: number | string,
    radiusMiles?: number | string
  ): ValidationResult<{ latitude: number; longitude: number; radius: number }> {
    return UltraOptimizedPerformanceMonitor.track('validateCoordinates', () => {
      try {
        const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude
        const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude
        const radius = radiusMiles ? (typeof radiusMiles === 'string' ? parseFloat(radiusMiles) : radiusMiles) : 25

        const result = coordinateSchema.safeParse({ latitude: lat, longitude: lng, radius })
        
        if (!result.success) {
          return {
            valid: false,
            error: result.error.errors[0]?.message || 'Invalid coordinates'
          }
        }

        return {
          valid: true,
          data: {
            latitude: result.data.latitude,
            longitude: result.data.longitude,
            radius: result.data.radius || 25
          }
        }
      } catch (error: any) {
        return {
          valid: false,
          error: 'Invalid coordinate format'
        }
      }
    })
  }

  /**
   * Validate state code
   */
  validateState(state: string): ValidationResult<string> {
    const stateCode = state.toUpperCase()
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]

    if (!validStates.includes(stateCode)) {
      return {
        valid: false,
        error: 'Invalid state code'
      }
    }

    return {
      valid: true,
      data: stateCode
    }
  }

  /**
   * Validate ZIP code
   */
  validateZipCode(zip: string): ValidationResult<string> {
    const zipRegex = /^\d{5}(-\d{4})?$/
    
    if (!zipRegex.test(zip)) {
      return {
        valid: false,
        error: 'Invalid ZIP code format'
      }
    }

    return {
      valid: true,
      data: zip
    }
  }

  /**
   * Sanitize city name
   */
  sanitizeCityName(city: string): ValidationResult<string> {
    if (!city || typeof city !== 'string') {
      return {
        valid: false,
        error: 'City name is required'
      }
    }

    const sanitized = city.trim().replace(/[^a-zA-Z\s\-']/g, '')
    
    if (sanitized.length < 2) {
      return {
        valid: false,
        error: 'City name too short'
      }
    }

    if (sanitized.length > 100) {
      return {
        valid: false,
        error: 'City name too long'
      }
    }

    return {
      valid: true,
      data: sanitized
    }
  }

  /**
   * Validate complete location data
   */
  validateLocation(location: unknown): ValidationResult {
    try {
      const result = locationSchema.safeParse(location)
      
      if (!result.success) {
        return {
          valid: false,
          error: result.error.errors[0]?.message || 'Invalid location data'
        }
      }

      return {
        valid: true,
        data: result.data
      }
    } catch (error: any) {
      return {
        valid: false,
        error: 'Invalid location format'
      }
    }
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    const timings = UltraOptimizedPerformanceMonitor.getAllTimings()
    const times = Object.values(timings)
    return {
      averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      totalValidations: times.length,
      maxTime: times.length > 0 ? Math.max(...times) : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0
    }
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    UltraOptimizedPerformanceMonitor.clearTimings()
  }
}

// ============================================
// Form Validation Schemas
// ============================================

export const emailSchema = z.string().email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const phoneSchema = z
  .string()
  .regex(/^[\d\s()\-]+$/, 'Invalid phone number')
  .transform((val) => val.replace(/\D/g, ''))

export const nameSchema = z.string().min(2, 'Name must be at least 2 characters')
export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  country: z.string().length(2).default('US')
})

// ============================================
// Form Validator Class
// ============================================

export class FormValidator {

  /**
   * Validate form data
   */
  validateForm<T>(data: T, schema: z.ZodSchema<T>): ValidationResult<T> {
    return UltraOptimizedPerformanceMonitor.track('validateForm', () => {
      try {
        const result = schema.safeParse(data)
        
        if (!result.success) {
          return {
            valid: false,
            error: result.error.errors[0]?.message || 'Validation failed'
          }
        }

        return {
          valid: true,
          data: result.data
        }
      } catch (error: any) {
        return {
          valid: false,
          error: 'Validation error'
        }
      }
    })
  }

  /**
   * Validate email
   */
  validateEmail(email: string): ValidationResult<string> {
    return this.validateForm(email, emailSchema)
  }

  /**
   * Validate password
   */
  validatePassword(password: string): ValidationResult<string> {
    return this.validateForm(password, passwordSchema)
  }

  /**
   * Validate phone
   */
  validatePhone(phone: string): ValidationResult<string> {
    return this.validateForm(phone, phoneSchema)
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    const timings = UltraOptimizedPerformanceMonitor.getAllTimings()
    const times = Object.values(timings)
    return {
      averageTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      totalValidations: times.length,
      maxTime: times.length > 0 ? Math.max(...times) : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0
    }
  }
}

// ============================================
// Global Validator Instances
// ============================================

export const locationValidator = new LocationValidator()
export const formValidator = new FormValidator()

// ============================================
// Utility Functions
// ============================================

/**
 * Quick validation helpers
 */
export const validateEmail = (email: string) => formValidator.validateEmail(email)
export const validatePassword = (password: string) => formValidator.validatePassword(password)
export const validatePhone = (phone: string) => formValidator.validatePhone(phone)
export const validateCoordinates = (lat: number, lng: number, radius?: number) => 
  locationValidator.validateCoordinates(lat, lng, radius)
export const validateState = (state: string) => locationValidator.validateState(state)
export const validateZipCode = (zip: string) => locationValidator.validateZipCode(zip)
export const sanitizeCityName = (city: string) => locationValidator.sanitizeCityName(city)
