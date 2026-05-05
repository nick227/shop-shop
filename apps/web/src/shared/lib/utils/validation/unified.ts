import { VALIDATION } from '@shared/constants'

interface ValidationResult<T> {
  valid: boolean
  data?: T
  error?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[\d\s()\-]+$/
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/
const STATE_REGEX = /^[A-Z]{2}$/

const toNumber = (value: string | number | undefined): number | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export const formValidator = {
  validateEmail: (value: string): string | undefined => {
    if (!value) return 'Email is required'
    return EMAIL_REGEX.test(value) ? undefined : 'Enter a valid email address'
  },
  validatePhone: (value: string): string | undefined => {
    if (!value) return 'Phone is required'
    return PHONE_REGEX.test(value) ? undefined : 'Enter a valid phone number'
  },
  validatePassword: (value: string): string | undefined => {
    if (!value) return 'Password is required'
    if (value.length < VALIDATION.PASSWORD.MIN_LENGTH) {
      return 'Password must be at least ' + VALIDATION.PASSWORD.MIN_LENGTH + ' characters'
    }
    if (VALIDATION.PASSWORD.REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
      return 'Password must include an uppercase letter'
    }
    if (VALIDATION.PASSWORD.REQUIRE_LOWERCASE && !/[a-z]/.test(value)) {
      return 'Password must include a lowercase letter'
    }
    if (VALIDATION.PASSWORD.REQUIRE_NUMBERS && !/\d/.test(value)) {
      return 'Password must include a number'
    }
    if (VALIDATION.PASSWORD.REQUIRE_SPECIAL && !/[^\dA-Za-z]/.test(value)) {
      return 'Password must include a special character'
    }
    return undefined
  },
} as const

export const locationValidator = {
  validateCoordinates: (
    latitude: string | number,
    longitude: string | number,
    radiusMiles?: string | number
  ): ValidationResult<{ latitude: number; longitude: number; radius: number }> => {
    const lat = toNumber(latitude)
    const lng = toNumber(longitude)
    const radius = toNumber(radiusMiles) ?? 25

    if (lat === undefined || lng === undefined) {
      return { valid: false, error: 'Latitude and longitude are required' }
    }
    if (lat < -90 || lat > 90) {
      return { valid: false, error: 'Latitude must be between -90 and 90' }
    }
    if (lng < -180 || lng > 180) {
      return { valid: false, error: 'Longitude must be between -180 and 180' }
    }
    if (radius <= 0) {
      return { valid: false, error: 'Radius must be greater than 0' }
    }

    return {
      valid: true,
      data: { latitude: lat, longitude: lng, radius }
    }
  },
  validateState: (state: string): ValidationResult<string> => {
    const value = state.trim().toUpperCase()
    if (!value) return { valid: false, error: 'State is required' }
    if (!STATE_REGEX.test(value)) {
      return { valid: false, error: 'Use a 2-letter state code' }
    }
    return { valid: true, data: value }
  },
  validateZipCode: (zip: string): ValidationResult<string> => {
    const value = zip.trim()
    if (!value) return { valid: false, error: 'ZIP code is required' }
    if (!ZIP_REGEX.test(value)) {
      return { valid: false, error: 'Enter a valid ZIP code' }
    }
    return { valid: true, data: value }
  },
  sanitizeCityName: (city: string): ValidationResult<string> => {
    const value = city.trim().replaceAll(/\s+/g, ' ')
    if (!value) return { valid: false, error: 'City is required' }
    return { valid: true, data: value }
  },
} as const
