import { z } from 'zod'

// ========================================
// Shared Validation Rules
// Centralized validators for consistency
// ========================================

// Regular Expressions
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/  // E.164 international format
export const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/  // Monetary decimals (e.g., 10.99)
export const SLUG_REGEX = /^[a-z0-9-]+$/  // URL-safe slugs
export const ZIP_REGEX = /^\d{5}(-\d{4})?$/  // US ZIP codes
export const PROMO_CODE_REGEX = /^[A-Z0-9_-]+$/  // Promotion codes
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/  // HH:MM format (24-hour)

// ========================================
// Basic Validators
// ========================================

export const phoneValidator = z.string()
  .regex(PHONE_REGEX, 'Must be valid phone number in E.164 format (e.g., +12025551234)')
  .describe('Phone number in E.164 international format')

export const emailValidator = z.string()
  .email('Invalid email format')
  .transform(val => val.toLowerCase().trim())
  .describe('Email address')

export const uuidValidator = z.string()
  .uuid('Must be a valid UUID')
  .describe('UUID identifier')

export const slugValidator = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(SLUG_REGEX, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .describe('URL-safe slug (lowercase, alphanumeric, hyphens only)')

export const zipValidator = z.string()
  .regex(ZIP_REGEX, 'Must be valid US ZIP code (e.g., 12345 or 12345-6789)')
  .describe('US ZIP code')

// ========================================
// Numeric Validators
// ========================================

export const decimalValidator = z.string()
  .regex(DECIMAL_REGEX, 'Must be valid decimal with up to 2 decimal places (e.g., 10.99)')
  .describe('Decimal number as string')

export const currencyValidator = z.string()
  .regex(DECIMAL_REGEX, 'Must be valid currency amount')
  .refine(val => {
    const num = parseFloat(val)
    return num >= 0 && num <= 999999.99
  }, 'Amount must be between $0.00 and $999,999.99')
  .describe('Currency amount in USD')

export const percentValidator = z.string()
  .regex(DECIMAL_REGEX, 'Must be valid percentage')
  .refine(val => {
    const num = parseFloat(val)
    return num >= 0 && num <= 100
  }, 'Percentage must be between 0 and 100')
  .describe('Percentage value (0-100)')

export const smallCurrencyValidator = z.string()
  .regex(DECIMAL_REGEX, 'Must be valid amount')
  .refine(val => {
    const num = parseFloat(val)
    return num >= 0 && num <= 9999.99
  }, 'Amount must be between $0.00 and $9,999.99')
  .describe('Small currency amount (tips, fees, etc.)')

export const quantityValidator = z.number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(99, 'Quantity cannot exceed 99')
  .describe('Item quantity (1-99)')

// ========================================
// Date/Time Validators
// ========================================

export const dateTimeValidator = z.string()
  .datetime({ message: 'Must be valid ISO 8601 datetime' })
  .describe('ISO 8601 datetime string')

export const timeValidator = z.string()
  .regex(TIME_REGEX, 'Must be valid time in HH:MM format (24-hour)')
  .describe('Time in HH:MM format')

/**
 * Validates that startDate is before endDate
 */
export function dateRangeValidator(
  schema: z.ZodObject<Record<string, z.ZodSchema>>
) {
  return schema.refine(
    data => new Date((data as { start: string }).start) < new Date((data as { end: string }).end),
    { message: 'Start date must be before end date', path: ['end'] }
  )
}

// ========================================
// Text Validators
// ========================================

export const shortTextValidator = z.string()
  .min(1, 'Field is required')
  .max(100, 'Must be at most 100 characters')
  .trim()
  .describe('Short text field (1-100 characters)')

export const mediumTextValidator = z.string()
  .min(1, 'Field is required')
  .max(500, 'Must be at most 500 characters')
  .trim()
  .describe('Medium text field (1-500 characters)')

export const longTextValidator = z.string()
  .max(1000, 'Must be at most 1000 characters')
  .trim()
  .describe('Long text field (up to 1000 characters)')

export const notesValidator = z.string()
  .max(500, 'Notes must be at most 500 characters')
  .trim()
  .describe('Optional notes or special instructions')

// ========================================
// Structured JSON Validators
// ========================================

/**
 * Store fees structure
 */
export const FeesJsonSchema = z.object({
  delivery: z.number().min(0).optional(),
  service: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
}).optional().describe('Store fee configuration')

/**
 * Store hours structure
 */
export const DayHoursSchema = z.object({
  open: timeValidator,
  close: timeValidator,
  closed: z.boolean().optional(),
}).refine(
  data => !data.closed && data.open < data.close,
  { message: 'Opening time must be before closing time' }
)

/**
 * Special hours for holidays/closures
 */
export const SpecialHoursSchema = z.object({
  closed: z.boolean(),
  open: timeValidator.optional(),
  close: timeValidator.optional(),
  reason: z.string().optional(),
})

/**
 * Enhanced store hours structure with timezone support
 */
export const HoursJsonSchema = z.object({
  timezone: z.string().optional().describe('IANA timezone identifier'),
  storeHours: z.record(
    z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    DayHoursSchema
  ).optional().describe('Store operating hours by day of week'),
  deliveryHours: z.record(
    z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    DayHoursSchema
  ).optional().describe('Delivery hours by day of week'),
  specialHours: z.record(
    z.string().date(),
    SpecialHoursSchema
  ).optional().describe('Special hours for holidays/closures')
}).optional().describe('Store hours with timezone and delivery support')

/**
 * Address JSON structure (for stores)
 */
export const AddressJsonSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  postalCode: zipValidator,
  country: z.string().length(2).default('US'),
}).optional().describe('Address structure')

/**
 * Product options (e.g., size, extras)
 */
export const OptionsJsonSchema = z.record(
  z.string(),  // Option name (e.g., "size", "extras")
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
).optional().describe('Product configuration options')

/**
 * Geographic coordinates
 */
export const GeoJsonSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  source: z.enum(['gps', 'geocode', 'manual']).optional(),
}).optional().describe('Geographic coordinates')

// ========================================
// Refinement Helpers
// ========================================

/**
 * Requires companyName when isCompany is true
 */
export function companyNameRequiredWhen(
  schema: z.ZodObject<Record<string, z.ZodSchema>>
) {
  return schema.refine(
    data => !(data as { isCompany?: boolean }).isCompany || !!(data as { companyName?: string }).companyName,
    { 
      message: 'Company name is required for business accounts', 
      path: ['companyName'] 
    }
  )
}

/**
 * Ensures at least one field is provided (for update operations)
 */
export function requireAtLeastOneField(
  schema: z.ZodObject<Record<string, z.ZodSchema>>
) {
  return schema.refine(
    data => Object.keys(data).length > 0,
    'At least one field must be provided'
  )
}

/**
 * Validates promotion date range
 */
export function promotionDateRangeValidator(
  schema: z.ZodObject<Record<string, z.ZodSchema>>
) {
  return schema.refine(
    data => new Date((data as { validFrom: string }).validFrom) < new Date((data as { validUntil: string }).validUntil),
    { message: 'Valid from date must be before valid until date', path: ['validUntil'] }
  )
}

// ========================================
// Type Exports
// ========================================

export type FeesJson = z.infer<typeof FeesJsonSchema>
export type HoursJson = z.infer<typeof HoursJsonSchema>
export type DayHours = z.infer<typeof DayHoursSchema>
export type SpecialHours = z.infer<typeof SpecialHoursSchema>
export type AddressJson = z.infer<typeof AddressJsonSchema>
export type OptionsJson = z.infer<typeof OptionsJsonSchema>
export type GeoJson = z.infer<typeof GeoJsonSchema>

