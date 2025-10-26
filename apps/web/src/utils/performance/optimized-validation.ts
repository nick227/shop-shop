/**
 * Optimized Validation System - Control flow improvements
 * Focus: Early exit patterns, single-pass processing, batch operations
 */
import { internString } from './string-interning'

/**
 * Optimized validation result with early exit support
 */
export interface OptimizedValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fieldErrors: Record<string, string>
  performance: {
    validationTime: number
    fieldsChecked: number
    earlyExits: number
  }
}

/**
 * Optimized form validation with early exit patterns
 */
export class OptimizedFormValidator<T extends Record<string, any>> {
  private readonly fieldValidators = new Map<keyof T, (value: any) => string | null>()
  private readonly requiredFields = new Set<keyof T>()
  private readonly earlyExitFields = new Set<keyof T>()
  
  /**
   * Add field validator
   */
  addFieldValidator(
    field: keyof T, 
    validator: (value: any) => string | null,
    options: { required?: boolean; earlyExit?: boolean } = {}
  ): this {
    this.fieldValidators.set(field, validator)
    
    if (options.required) {
      this.requiredFields.add(field)
    }
    
    if (options.earlyExit) {
      this.earlyExitFields.add(field)
    }
    
    return this
  }
  
  /**
   * Validate form with early exit patterns
   */
  validate(data: T): OptimizedValidationResult {
    const startTime = performance.now()
    const errors: string[] = []
    const warnings: string[] = []
    const fieldErrors: Record<string, string> = {}
    let fieldsChecked = 0
    let earlyExits = 0
    
    // Early exit for empty data
    if (!data || Object.keys(data).length === 0) {
      return {
        isValid: false,
        errors: [internString('No data provided')],
        warnings: [],
        fieldErrors: {},
        performance: {
          validationTime: performance.now() - startTime,
          fieldsChecked: 0,
          earlyExits: 1
        }
      }
    }
    
    // Single-pass validation with early exit
    for (const [field, value] of Object.entries(data)) {
      fieldsChecked++
      
      // Check required fields first (early exit)
      if (this.requiredFields.has(field as keyof T) && (!value || (typeof value === 'string' && value.trim() === ''))) {
          const error = internString('' + field + ' is required')
          errors['push'](error)
          fieldErrors[field] = error
          
          if (this.earlyExitFields.has(field as keyof T)) {
            earlyExits++
            break // Early exit on critical field
          }
          continue
        }
      
      // Validate field if validator exists
      const validator = this.fieldValidators.get(field as keyof T)
      if (validator) {
        const error = validator(value)
        if (error) {
          const internedError = internString(error)
          errors['push'](internedError)
          fieldErrors[field] = internedError
          
          if (this.earlyExitFields.has(field as keyof T)) {
            earlyExits++
            break // Early exit on critical validation failure
          }
        }
      }
    }
    
    return {
      isValid: errors['length'] === 0,
      errors: errors['map'](internString),
      warnings: warnings.map(internString),
      fieldErrors,
      performance: {
        validationTime: performance.now() - startTime,
        fieldsChecked,
        earlyExits
      }
    }
  }
  
  /**
   * Batch validate multiple forms
   */
  batchValidate(forms: T[]): OptimizedValidationResult[] {
    const results: OptimizedValidationResult[] = []
    
    // Process in batches for better performance
    const batchSize = 10
    for (let i = 0; i < forms.length; i += batchSize) {
      const batch = forms.slice(i, i + batchSize)
      
      for (const form of batch) {
        results.push(this.validate(form))
      }
    }
    
    return results
  }
}

/**
 * Optimized array operations with early exit
 */
export class OptimizedArrayOperations {
  /**
   * Find first matching element with early exit
   */
  static findFirst<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): T | undefined {
    for (const [i, element] of array.entries()) {
      if (predicate(element, i)) {
        return element
      }
    }
    return undefined
  }
  
  /**
   * Check if any element matches with early exit
   */
  static any<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): boolean {
    for (const [i, element] of array.entries()) {
      if (predicate(element, i)) {
        return true
      }
    }
    return false
  }
  
  /**
   * Check if all elements match with early exit
   */
  static all<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean
  ): boolean {
    for (const [i, element] of array.entries()) {
      if (!predicate(element, i)) {
        return false
      }
    }
    return true
  }
  
  /**
   * Filter with early exit on condition
   */
  static filterWithLimit<T>(
    array: T[],
    predicate: (item: T, index: number) => boolean,
    limit: number
  ): T[] {
    const result: T[] = []
    
    for (let i = 0; i < array.length && result.length < limit; i++) {
      const item = array[i]
      if (item && predicate(item, i)) {
        result.push(item)
      }
    }
    
    return result
  }
}

/**
 * Optimized DOM operations with batching
 */
export class OptimizedDOMOperations {
  private static readonly batchQueue: (() => void)[] = []
  private static batchTimer: number | null = null
  
  /**
   * Batch DOM operations for better performance
   */
  static batch(operation: () => void): void {
    this.batchQueue.push(operation)
    
    if (this.batchTimer === null) {
      this.batchTimer = requestAnimationFrame(() => {
        this.flushBatch()
      })
    }
  }
  
  /**
   * Flush batched operations
   */
  private static flushBatch(): void {
    const operations = this.batchQueue.splice(0)
    this.batchTimer = null
    
    // Execute all operations
    for (const operation of operations) {
      try {
        operation()
      } catch (error: any) {
        console.error('Batch operation failed:', error)
      }
    }
  }
  
  /**
   * Batch element updates
   */
  static batchElementUpdates(
    elements: HTMLElement[],
    updates: (element: HTMLElement) => void
  ): void {
    this.batch(() => {
      elements.forEach(updates)
    })
  }
  
  /**
   * Batch class updates
   */
  static batchClassUpdates(
    elements: HTMLElement[],
    className: string,
    add: boolean
  ): void {
    this.batch(() => {
      for (const element of elements) {
        if (add) {
          element.classList.add(className)
        } else {
          element.classList.remove(className)
        }
      }
    })
  }
}

/**
 * Optimized validation patterns
 */
export class ValidationPatterns {
  /**
   * Email validation with early exit
   */
  static validateEmail(email: string): string | null {
    if (!email) return internString('Email is required')
    if (email.length > 254) return internString('Email too long')
    if (!email.includes('@')) return internString('Invalid email format')
    
    const [local, domain] = email.split('@')
    if (!local || !domain) return internString('Invalid email format')
    if (local.length > 64) return internString('Email local part too long')
    if (domain.length > 253) return internString('Email domain too long')
    
    return null
  }
  
  /**
   * Phone validation with early exit
   */
  static validatePhone(phone: string): string | null {
    if (!phone) return internString('Phone is required')
    
    const cleaned = phone.replaceAll(/\D/g, '')
    if (cleaned.length < 10) return internString('Phone number too short')
    if (cleaned.length > 15) return internString('Phone number too long')
    
    return null
  }
  
  /**
   * Password validation with early exit
   */
  static validatePassword(password: string): string | null {
    if (!password) return internString('Password is required')
    if (password.length < 8) return internString('Password too short')
    if (password.length > 128) return internString('Password too long')
    
    // Check for common patterns
    if (password === 'password' || password === '12345678') {
      return internString('Password too common')
    }
    
    return null
  }
  
  /**
   * Coordinate validation with early exit
   */
  static validateCoordinates(lat: number, lng: number): string | null {
    if (isNaN(lat) || isNaN(lng)) return internString('Invalid coordinates')
    if (lat < -90 || lat > 90) return internString('Latitude out of range')
    if (lng < -180 || lng > 180) return internString('Longitude out of range')
    
    return null
  }
}

/**
 * Performance monitoring for validation
 */
export class ValidationPerformanceMonitor {
  private static readonly metrics = new Map<string, {
    totalTime: number
    callCount: number
    averageTime: number
  }>()
  
  /**
   * Track validation performance
   */
  static track(operation: string, fn: () => any): any {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    
    const duration = endTime - startTime
    const existing = this.metrics.get(operation) || {
      totalTime: 0,
      callCount: 0,
      averageTime: 0
    }
    
    existing.totalTime += duration
    existing.callCount++
    existing.averageTime = existing.totalTime / existing.callCount
    
    this.metrics.set(operation, existing)
    
    return result
  }
  
  /**
   * Get performance metrics
   */
  static getMetrics(): Record<string, {
    totalTime: number
    callCount: number
    averageTime: number
  }> {
    return Object.fromEntries(this.metrics)
  }
  
  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics.clear()
  }
}
