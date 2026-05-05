/**
 * Validation utilities for typegen pipeline
 * 
 * Ensures data integrity and catches issues before code generation.
 */

import { ResourceIR, TypegenIR } from './ir.js'

export interface ValidationError {
  resource: string
  field?: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

/**
 * Validate a single resource IR
 */
export function validateResource(resource: ResourceIR): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  
  // Check for duplicate field names
  if (resource.validation?.duplicateFields.length) {
    errors.push({
      resource: resource.name,
      message: `Duplicate field names: ${resource.validation.duplicateFields.join(', ')}`,
      severity: 'error'
    })
  }
  
  // Check for reserved field names
  if (resource.validation?.reservedNames.length) {
    errors.push({
      resource: resource.name,
      message: `Reserved field names: ${resource.validation.reservedNames.join(', ')}`,
      severity: 'error'
    })
  }
  
  // Check for empty field names
  const emptyFields = [
    ...resource.extensions,
    ...resource.computed
  ].filter(field => !field.name.trim())
  
  if (emptyFields.length) {
    errors.push({
      resource: resource.name,
      message: 'Empty field names found',
      severity: 'error'
    })
  }
  
  // Check for invalid TypeScript types
  const invalidTypes = [
    ...resource.extensions,
    ...resource.computed
  ].filter(field => !isValidTypeScriptType(field.tsType))
  
  if (invalidTypes.length) {
    errors.push({
      resource: resource.name,
      message: `Invalid TypeScript types: ${invalidTypes.map(f => f.name).join(', ')}`,
      severity: 'error'
    })
  }
  
  // Check for missing SDK type
  if (!resource.sdkType || resource.sdkType.trim() === '') {
    errors.push({
      resource: resource.name,
      message: 'Missing or empty SDK type',
      severity: 'error'
    })
  }
  
  // Check for missing API class
  if (!resource.apiClass || resource.apiClass.trim() === '') {
    errors.push({
      resource: resource.name,
      message: 'Missing or empty API class',
      severity: 'error'
    })
  }
  
  // Check for missing SDK methods
  if (!resource.sdkListMethod || resource.sdkListMethod.trim() === '') {
    errors.push({
      resource: resource.name,
      message: 'Missing or empty SDK list method',
      severity: 'error'
    })
  }
  
  if (!resource.sdkGetMethod || resource.sdkGetMethod.trim() === '') {
    errors.push({
      resource: resource.name,
      message: 'Missing or empty SDK get method',
      severity: 'error'
    })
  }
  
  // Check for computed fields without expressions
  const computedWithoutExpr = resource.computed.filter(field => !field.expr)
  if (computedWithoutExpr.length) {
    warnings.push({
      resource: resource.name,
      message: `Computed fields without expressions: ${computedWithoutExpr.map(f => f.name).join(', ')}`,
      severity: 'warning'
    })
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate the entire typegen IR
 */
export function validateTypegenIR(ir: TypegenIR): ValidationResult {
  const allErrors: ValidationError[] = []
  const allWarnings: ValidationError[] = []
  
  // Validate each resource
  for (const resource of ir.resources) {
    const result = validateResource(resource)
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  }
  
  // Check for duplicate resource names
  const resourceNames = ir.resources.map(r => r.name)
  const duplicateNames = resourceNames.filter((name, index) => resourceNames.indexOf(name) !== index)
  
  if (duplicateNames.length) {
    allErrors.push({
      resource: 'global',
      message: `Duplicate resource names: ${duplicateNames.join(', ')}`,
      severity: 'error'
    })
  }
  
  // Check for duplicate SDK types
  const sdkTypes = ir.resources.map(r => r.sdkType)
  const duplicateSdkTypes = sdkTypes.filter((type, index) => sdkTypes.indexOf(type) !== index)
  
  if (duplicateSdkTypes.length) {
    allErrors.push({
      resource: 'global',
      message: `Duplicate SDK types: ${duplicateSdkTypes.join(', ')}`,
      severity: 'error'
    })
  }
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
}

/**
 * Check if a string is a valid TypeScript type
 */
function isValidTypeScriptType(type: string): boolean {
  if (!type || type.trim() === '') return false
  
  // Basic validation - check for common TypeScript type patterns
  const validPatterns = [
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/, // Simple identifier
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*\[\]$/, // Array type
    /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*<.*>$/, // Generic type
    /^\{.*\}$/, // Object type
    /^\(.*\)\s*=>\s*.*$/, // Function type
    /^string\s*\|\s*number$/, // Union type
    /^string\s*\|\s*null$/, // Nullable type
    /^string\s*\|\s*undefined$/, // Optional type
    /^string\s*\|\s*number\s*\|\s*boolean$/, // Multiple union
    /^number\s*\|\s*undefined$/, // Optional number
    /^boolean\s*\|\s*undefined$/, // Optional boolean
    /^Record<.*>$/, // Record type
    /^Partial<.*>$/, // Partial type
    /^Pick<.*>$/, // Pick type
    /^Omit<.*>$/, // Omit type
  ]
  
  return validPatterns.some(pattern => pattern.test(type.trim()))
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) return 'Validation passed'
  
  const lines: string[] = []
  
  if (result.errors.length > 0) {
    lines.push('Errors:')
    for (const error of result.errors) {
      lines.push(`  ${error.resource}${error.field ? `.${error.field}` : ''}: ${error.message}`)
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('Warnings:')
    for (const warning of result.warnings) {
      lines.push(`  ${warning.resource}${warning.field ? `.${warning.field}` : ''}: ${warning.message}`)
    }
  }
  
  return lines.join('\n')
}
