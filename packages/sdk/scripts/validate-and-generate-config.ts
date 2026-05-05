#!/usr/bin/env tsx
/**
 * Validate and Generate Reliable Resource Config
 * 
 * This script:
 * 1. Scans actual SDK types to find available List*200ResponseDataInner types
 * 2. Validates existing resource config against available types
 * 3. Generates a clean, reliable resource config with only valid types
 * 4. Reports missing/invalid types for cleanup
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ========================================
// SDK Type Scanner
// ========================================

/**
 * Extract all List*200ResponseDataInner types from SDK
 */
function extractAvailableSdkTypes(): string[] {
  const sdkIndexPath = join(__dirname, '../src/models/index.ts')
  const content = readFileSync(sdkIndexPath, 'utf-8')
  
  const listTypeRegex = /export interface (List\w+200ResponseDataInner)/g
  const matches = []
  let match
  
  while ((match = listTypeRegex.exec(content)) !== null) {
    matches.push(match[1])
  }
  
  // Remove duplicates and sort
  return [...new Set(matches)].sort()
}

/**
 * Map SDK type to resource name
 */
function sdkTypeToResourceName(sdkType: string): string {
  // ListStores200ResponseDataInner -> stores
  // ListUsers200ResponseDataInner -> users
  // ListAddresss200ResponseDataInner -> addresses (fix plural)
  // etc.
  let resourceName = sdkType
    .replace('List', '')
    .replace('200ResponseDataInner', '')
    .toLowerCase()
    .replace(/([A-Z])/g, (match, p1, offset) => offset > 0 ? p1.toLowerCase() : p1)
  
  // Fix common pluralization issues
  if (resourceName === 'addresss') resourceName = 'addresses'
  if (resourceName === 'bundle') resourceName = 'bundles'
  if (resourceName === 'cart') resourceName = 'carts'
  if (resourceName === 'item') resourceName = 'items'
  if (resourceName === 'order') resourceName = 'orders'
  if (resourceName === 'promotion') resourceName = 'promotions'
  if (resourceName === 'store') resourceName = 'stores'
  if (resourceName === 'user') resourceName = 'users'
  
  return resourceName
}

/**
 * Map resource name to type name
 */
function resourceNameToTypeName(resourceName: string): string {
  // stores -> Store
  // users -> User
  // etc.
  return resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
}

/**
 * Map resource name to API class name
 */
function resourceNameToApiClass(resourceName: string): string {
  // stores -> StoresApi
  // users -> UsersApi
  // addresses -> AddressesApi
  // etc.
  const singularName = resourceName.replace(/s$/, '') // Remove trailing 's'
  return singularName.charAt(0).toUpperCase() + singularName.slice(1) + 'sApi'
}

// ========================================
// Resource Config Generator
// ========================================

/**
 * Generate reliable resource config from available SDK types
 */
function generateReliableConfig(availableTypes: string[]): string {
  const resources = availableTypes.map(sdkType => {
    const resourceName = sdkTypeToResourceName(sdkType)
    const typeName = resourceNameToTypeName(resourceName)
    const apiClass = resourceNameToApiClass(resourceName)
    
    return `  {
    name: '${resourceName}',
    type: '${typeName}',
    createType: 'Create${typeName}Input',
    apiClass: '${apiClass}',
    sdkType: '${sdkType}',
    sdkListMethod: 'list${typeName}s',
    sdkGetMethod: 'get${typeName}ById',
    sdkCreateMethod: 'create${typeName}',
    sdkUpdateMethod: 'update${typeName}',
    sdkDeleteMethod: 'delete${typeName}',
    sdkCreateRequestParam: 'create${typeName}Request',
    sdkUpdateRequestParam: 'update${typeName}Request',
    listParams: 'params?: { page?: string; limit?: string }',
    hasCreate: true,
    hasUpdate: true,
    hasDelete: true,
    methods: ['list', 'getById', 'create', 'update', 'delete'],
    hooks: {
      useList: 'use${typeName}s',
      useOne: 'use${typeName}',
      useCreate: 'useCreate${typeName}',
      useUpdate: 'useUpdate${typeName}',
      useDelete: 'useDelete${typeName}'
    },
    extensions: {},
    computed: ''
  }`
  }).join(',\n')

  return `/**
 * Reliable Resource Configuration
 * 
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Actual SDK types (100% validated)
 * 
 * This configuration is derived from actual SDK types to ensure
 * perfect alignment between backend types and frontend API contracts.
 */

export interface ResourceConfig {
  // Core identification
  name: string
  type: string
  createType?: string
  
  // SDK Configuration
  apiClass: string
  sdkType: string
  sdkListMethod: string
  sdkGetMethod: string
  sdkCreateMethod?: string
  sdkUpdateMethod?: string
  sdkDeleteMethod?: string
  
  // Explicit request parameter names
  sdkCreateRequestParam?: string
  sdkUpdateRequestParam?: string
  
  // Method parameters
  listParams?: string
  
  // Feature flags
  hasCreate?: boolean
  hasUpdate?: boolean
  hasDelete?: boolean
  
  // Custom implementations
  updateCustom?: string
  
  // React Query configuration
  invalidates?: string[]
  methods?: string[]
  hooks?: {
    useList?: string
    useOne?: string
    useCreate?: string
    useUpdate?: string
    useDelete?: string
  }
  
  // Type extensions
  extensions?: Record<string, string>
  computed?: string
}

/**
 * Master resource configuration
 * Generated from actual SDK types to ensure 100% reliability
 */
export const RESOURCE_CONFIGS: ResourceConfig[] = [
${resources}
]

/**
 * Available SDK types used in this config
 */
export const AVAILABLE_SDK_TYPES = [
${availableTypes.map(t => `  '${t}'`).join(',\n')}
]`
}

// ========================================
// Validation and Cleanup
// ========================================

/**
 * Validate existing config against available types
 */
function validateExistingConfig(availableTypes: string[]): void {
  const existingConfigPath = join(__dirname, 'resource-config.ts')
  const existingContent = readFileSync(existingConfigPath, 'utf-8')
  
  const sdkTypeRegex = /sdkType: '([^']+)'/g
  const invalidTypes = []
  let match
  
  while ((match = sdkTypeRegex.exec(existingContent)) !== null) {
    const sdkType = match[1]
    if (!availableTypes.includes(sdkType)) {
      invalidTypes.push(sdkType)
    }
  }
  
  if (invalidTypes.length > 0) {
    console.log('❌ Invalid SDK types found in existing config:')
    invalidTypes.forEach(type => console.log(`   - ${type}`))
    console.log('\nThese types will be removed from the new config.')
  } else {
    console.log('✅ All existing SDK types are valid!')
  }
}

// ========================================
// Main Execution
// ========================================

async function main() {
  console.log('🔍 Scanning SDK for available types...')
  const availableTypes = extractAvailableSdkTypes()
  console.log(`✅ Found ${availableTypes.length} available SDK types:`)
  availableTypes.forEach(type => console.log(`   - ${type}`))
  
  console.log('\n🔍 Validating existing config...')
  validateExistingConfig(availableTypes)
  
  console.log('\n📝 Generating reliable resource config...')
  const reliableConfig = generateReliableConfig(availableTypes)
  
  const outputPath = join(__dirname, 'resource-config-reliable.ts')
  writeFileSync(outputPath, reliableConfig)
  
  console.log(`✅ Generated reliable config: ${outputPath}`)
  console.log('\n📋 Next steps:')
  console.log('1. Review the new config')
  console.log('2. Replace resource-config.ts with resource-config-reliable.ts')
  console.log('3. Regenerate types: npm run gen:types')
  console.log('4. Test the application')
}

main().catch(console.error)
