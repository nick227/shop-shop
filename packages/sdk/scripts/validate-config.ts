#!/usr/bin/env tsx
/**
 * Resource Config Validation
 * 
 * Validates resource-config.ts for:
 * - Required fields present
 * - Type consistency
 * - No duplicates
 * - Valid method combinations
 * - Hook naming conventions
 * 
 * Single source of truth validation!
 */
import { RESOURCE_CONFIGS, type ResourceConfig } from './resource-config.js'
import { logger } from './logger.js'

interface ConfigValidationError {
  resource: string
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validate a single resource config
 */
function validateResourceConfig(config: ResourceConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = []
  
  // Required fields
  const required: (keyof ResourceConfig)[] = [
    'name',
    'type',
    'apiClass',
    'sdkType',
    'sdkListMethod',
    'sdkGetMethod',
  ]
  
  for (const field of required) {
    if (!config[field]) {
      errors.push({
        resource: config.name || 'unknown',
        field,
        message: `Missing required field: ${field}`,
        severity: 'error',
      })
    }
  }
  
  // CRUD consistency
  if (config.hasCreate && !config.sdkCreateMethod) {
    errors.push({
      resource: config.name,
      field: 'sdkCreateMethod',
      message: 'hasCreate is true but sdkCreateMethod is missing',
      severity: 'error',
    })
  }
  
  if (config.hasCreate && !config.createType) {
    errors.push({
      resource: config.name,
      field: 'createType',
      message: 'hasCreate is true but createType is missing',
      severity: 'warning',
    })
  }
  
  if (config.hasUpdate && !config.sdkUpdateMethod && !config.updateCustom) {
    errors.push({
      resource: config.name,
      field: 'sdkUpdateMethod',
      message: 'hasUpdate is true but sdkUpdateMethod/updateCustom is missing',
      severity: 'error',
    })
  }
  
  if (config.hasDelete && !config.sdkDeleteMethod) {
    errors.push({
      resource: config.name,
      field: 'sdkDeleteMethod',
      message: 'hasDelete is true but sdkDeleteMethod is missing',
      severity: 'error',
    })
  }
  
  // Explicit request params recommended
  if (config.hasCreate && !config.sdkCreateRequestParam) {
    errors.push({
      resource: config.name,
      field: 'sdkCreateRequestParam',
      message: 'Explicit sdkCreateRequestParam recommended to avoid brittle string matching',
      severity: 'warning',
    })
  }
  
  if (config.hasUpdate && !config.sdkUpdateRequestParam && !config.updateCustom) {
    errors.push({
      resource: config.name,
      field: 'sdkUpdateRequestParam',
      message: 'Explicit sdkUpdateRequestParam recommended to avoid brittle string matching',
      severity: 'warning',
    })
  }
  
  // Hook naming conventions
  if (config.hooks) {
    const { useList, useOne, useCreate, useUpdate, useDelete } = config.hooks
    
    if (useList && !useList.startsWith('use')) {
      errors.push({
        resource: config.name,
        field: 'hooks.useList',
        message: `Hook name should start with "use": ${useList}`,
        severity: 'warning',
      })
    }
    
    // Verify hooks match methods
    if (useCreate && !config.hasCreate) {
      errors.push({
        resource: config.name,
        field: 'hooks.useCreate',
        message: 'useCreate hook defined but hasCreate is false',
        severity: 'error',
      })
    }
    
    if (useUpdate && !config.hasUpdate) {
      errors.push({
        resource: config.name,
        field: 'hooks.useUpdate',
        message: 'useUpdate hook defined but hasUpdate is false',
        severity: 'error',
      })
    }
    
    if (useDelete && !config.hasDelete) {
      errors.push({
        resource: config.name,
        field: 'hooks.useDelete',
        message: 'useDelete hook defined but hasDelete is false',
        severity: 'error',
      })
    }
  }
  
  return errors
}

/**
 * Check for duplicate names
 */
function checkDuplicates(): ConfigValidationError[] {
  const errors: ConfigValidationError[] = []
  const names = new Set<string>()
  const types = new Set<string>()
  
  for (const config of RESOURCE_CONFIGS) {
    // Duplicate names
    if (names.has(config.name)) {
      errors.push({
        resource: config.name,
        field: 'name',
        message: `Duplicate resource name: ${config.name}`,
        severity: 'error',
      })
    }
    names.add(config.name)
    
    // Duplicate types
    if (types.has(config.type)) {
      errors.push({
        resource: config.name,
        field: 'type',
        message: `Duplicate type name: ${config.type}`,
        severity: 'error',
      })
    }
    types.add(config.type)
  }
  
  return errors
}

/**
 * Validate all resource configs
 */
export function validateConfigs(): {
  valid: boolean
  errors: ConfigValidationError[]
  warnings: ConfigValidationError[]
} {
  logger.section('Config Validation')
  
  const allErrors: ConfigValidationError[] = []
  
  // Validate each resource
  for (const config of RESOURCE_CONFIGS) {
    const resourceErrors = validateResourceConfig(config)
    allErrors.push(...resourceErrors)
  }
  
  // Check for duplicates
  const duplicateErrors = checkDuplicates()
  allErrors.push(...duplicateErrors)
  
  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error')
  const warnings = allErrors.filter(e => e.severity === 'warning')
  
  // Display results
  if (errors.length === 0 && warnings.length === 0) {
    logger.success(`✅ Config validation passed (${RESOURCE_CONFIGS.length} resources)`)
    return { valid: true, errors: [], warnings: [] }
  }
  
  // Display errors
  if (errors.length > 0) {
    logger.error(`\n❌ Found ${errors.length} error(s):`)
    for (const error of errors) {
      logger.error(`  ${error.resource}.${error.field}: ${error.message}`)
    }
  }
  
  // Display warnings
  if (warnings.length > 0) {
    logger.warn(`\n⚠️  Found ${warnings.length} warning(s):`)
    for (const warning of warnings) {
      logger.warn(`  ${warning.resource}.${warning.field}: ${warning.message}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Main function
 */
async function main() {
  const result = validateConfigs()
  
  if (!result.valid) {
    process.exit(1)
  }
  
  if (result.warnings.length > 0) {
    logger.warn('\n⚠️  Config has warnings but is valid')
  }
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

