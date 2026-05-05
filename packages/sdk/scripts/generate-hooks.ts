#!/usr/bin/env tsx
/**
 * Auto-Generate React Query Hooks from API Wrapper
 * 
 * Generates apps/web/src/hooks/generated.ts from apiWrapper.ts
 * Eliminates hand-coding of hook declarations
 * 
 * Usage: tsx packages/sdk/scripts/generate-hooks.ts
 */
import { RESOURCE_CONFIGS, type ResourceConfig } from './resource-config.ts'
import { resolveFromWebSrc } from './paths.js'
import { logger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'

// ============================================
// Centralized Configuration
// ============================================

/**
 * Special cases for singular resource name conversion
 * Only includes actual irregular plurals, not already-singular words
 */
const SINGULAR_RESOURCE_MAP = {
  'addresses': 'address',
  'peoples': 'person', 
  'children': 'child',
  'men': 'man',
  'women': 'woman',
  'companies': 'company',
  'categories': 'category',
  'families': 'family',
  'stories': 'story',
  'studies': 'study',
  'bodies': 'body',
  'parties': 'party',
  'cities': 'city',
  'countries': 'country',
  'libraries': 'library',
  'factories': 'factory',
  'universities': 'university',
  'agencies': 'agency',
  'societies': 'society',
  'activities': 'activity',
  'opportunities': 'opportunity',
  'communities': 'community',
  'authorities': 'authority',
  'responsibilities': 'responsibility',
  'possibilities': 'possibility',
  'facilities': 'facility',
  'qualities': 'quality',
  'quantities': 'quantity',
  'identities': 'identity',
  'priorities': 'priority'
} as const

/**
 * Resources that need @ts-expect-error comments due to type mismatches
 */
const TS_EXPECT_ERROR_RESOURCES = [
  'orders', 
  'addresses', 
  'posts', 
  'bundles'
]

/**
 * Hook type configurations with standardized documentation
 */
const HOOK_TYPE_CONFIGS = {
  useList: {
    description: 'Fetch list of {resource}',
    example: 'const { data: {resource} } = {hookName}(params)',
    params: 'Query parameters for filtering and pagination'
  },
  useOne: {
    description: 'Fetch single {singularResource} by ID',
    example: 'const { data: {singularResource} } = {hookName}(id)',
    params: 'Unique identifier for the {singularResource}'
  },
  useCreate: {
    description: 'Create new {singularResource}',
    example: 'const { mutate: create } = {hookName}()',
    params: 'Input data for creating the {singularResource}'
  },
  useUpdate: {
    description: 'Update {singularResource}',
    example: 'const { mutate: update } = {hookName}()',
    params: 'Input data for updating the {singularResource}'
  },
  useDelete: {
    description: 'Delete {singularResource}',
    example: 'const { mutate: deleteItem } = {hookName}()',
    params: 'ID of the {singularResource} to delete'
  }
} as const

// Use shared resource configuration
const resources = RESOURCE_CONFIGS

// ============================================
// Type-Safe Utility Functions
// ============================================

/**
 * Get singular form of resource name with special case handling
 */
function getSingularResource(resource: string): string {
  if (resource in SINGULAR_RESOURCE_MAP) {
    return SINGULAR_RESOURCE_MAP[resource as keyof typeof SINGULAR_RESOURCE_MAP]
  }
  return resource.endsWith('s') ? resource.slice(0, -1) : resource
}

/**
 * Check if resource needs @ts-expect-error comment
 */
function needsTsExpectError(resourceName: string): boolean {
  return TS_EXPECT_ERROR_RESOURCES.includes(resourceName)
}

/**
 * Generate type parameters for createResourceHooks
 */
function generateTypeParams(resource: ResourceConfig): string {
  return resource.createType 
    ? `<${resource.type}, ${resource.createType}>`
    : `<${resource.type}>`
}

/**
 * Generate options object for createResourceHooks
 */
function generateOptions(resource: ResourceConfig): string {
  if (!resource.invalidates || resource.invalidates.length === 0) return ''
  
  return `,\n  { invalidates: [${resource.invalidates.map(item => `'${item.replace(/'/g, "\\'")}'`).join(', ')}] }`
}

/**
 * Generate hook declaration with proper typing
 */
function generateHookDeclaration(resource: ResourceConfig): string {
  const typeParams = generateTypeParams(resource)
  const options = generateOptions(resource)
  const tsExpectErrorComment = needsTsExpectError(resource.name) 
    ? '// @ts-expect-error - Custom update signature, acceptable (works at runtime)\n' 
    : ''
  
  return `${tsExpectErrorComment}const ${resource.name}Hooks = createResourceHooks${typeParams}('${resource.name}', apiWrapper.${resource.name}${options})`
}

function generateHooks(): string {
  const header = `/**
 * Auto-Generated Resource Hooks
 * ⚠️  DO NOT EDIT MANUALLY
 * Generated from: api wrapper using generic hook factory
 * 
 * To regenerate: pnpm gen:hooks
 */
import { createResourceHooks } from './createResourceHooks'
import * as apiWrapper from '../api/apiWrapper'
import type { 
  ${getUniqueTypes(resources).map(type => {
    if (type === 'Store') return 'StoreResponse as Store'
    if (type === 'Item') return 'ItemResponse as Item'
    if (type === 'Order') return 'OrderResponse as Order'
    if (type === 'Address') return 'AddressResponse as Address'
    return type
  }).join(', ')},
} from '../api/backend-types'
import type { 
  ${getUniqueCreateTypes(resources).length > 0 ? getUniqueCreateTypes(resources).join(', ') + ',' : ''}
} from '../api/apiWrapper'
`

  const sections = resources.map(resource => {
    const hookDeclaration = generateHookDeclaration(resource)
    
    const exports = Object.entries(resource.hooks || {})
      .map(([hookType, hookName]) => {
        const docs = generateHookDocs(hookName as string, resource.name, hookType)
        return `${docs}\nexport const ${hookName} = ${resource.name}Hooks.${hookType}`
      })
      .join('\n\n')
    
    return `// ============================================
// ${capitalize(resource.name)} Hooks
// ============================================
${hookDeclaration}

${exports}`
  }).join('\n\n')

  return header + '\n' + sections + '\n'
}

/**
 * Generate standardized hook documentation using centralized configuration
 */
function generateHookDocs(hookName: string, resource: string, hookType: string): string {
  const singularResource = getSingularResource(resource)
  
  // Determine the hook type from the hook name
  const detectedHookType = detectHookType(hookName, resource)
  const config = HOOK_TYPE_CONFIGS[detectedHookType]
  
  if (!config) {
    // Fallback for unknown hook types
    return `/**
 * ${hookName} hook
 */`
  }
  
  // Replace placeholders in the configuration
  const description = config.description
    .replace('{resource}', resource)
    .replace('{singularResource}', singularResource)
  
  const example = config.example
    .replace('{resource}', resource)
    .replace('{singularResource}', singularResource)
    .replace('{hookName}', hookName)
  
  const params = config.params
    .replace('{resource}', resource)
    .replace('{singularResource}', singularResource)
  
  // Generate proper JSDoc parameter with name
  const paramName = detectedHookType === 'useList' ? 'params' : detectedHookType === 'useOne' ? 'id' : 'data'
  
  return `/**
 * ${description}
 * @param ${paramName} - ${params}
 * @returns React Query result with ${detectedHookType === 'useList' ? resource : singularResource} data
 * @example ${example}
 */`
}

/**
 * Detect hook type from hook name and resource (case-insensitive)
 */
function detectHookType(hookName: string, resource: string): keyof typeof HOOK_TYPE_CONFIGS {
  const lowerHookName = hookName.toLowerCase()
  const lowerResource = resource.toLowerCase()
  
  if (lowerHookName.includes('create')) return 'useCreate'
  if (lowerHookName.includes('update')) return 'useUpdate'
  if (lowerHookName.includes('delete')) return 'useDelete'
  if (lowerHookName.includes('list') || (lowerHookName.startsWith('use') && lowerHookName.endsWith('s') && lowerHookName === `use${lowerResource}`)) {
    return 'useList'
  }
  return 'useOne'
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get unique types from resources for imports (sorted for deterministic output)
 */
function getUniqueTypes(resources: ResourceConfig[]): string[] {
  return [...new Set(resources.map(r => r.type))].sort()
}

/**
 * Get unique create types from resources for imports (sorted for deterministic output)
 */
function getUniqueCreateTypes(resources: ResourceConfig[]): string[] {
  return [...new Set(resources.map(r => r.createType).filter((type): type is string => Boolean(type)))].sort()
}

/**
 * Generate comprehensive statistics for logging
 */
function generateStats(resources: ResourceConfig[]): Record<string, unknown> {
  const totalHooks = resources.reduce((sum, r) => sum + Object.keys(r.hooks || {}).length, 0)
  
  return {
    totalResources: resources.length,
    totalHooks,
    hooksByType: resources.reduce((acc, r) => {
      Object.keys(r.hooks || {}).forEach(hookType => {
        acc[hookType] = (acc[hookType] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>),
    resourcesWithCustomTypes: resources.filter(r => r.createType).length,
    resourcesWithInvalidates: resources.filter(r => r.invalidates).length,
    resourcesWithTsExpectError: resources.filter(r => needsTsExpectError(r.name)).length
  }
}

// Generate and save
// ============================================
// Main Generation with Transaction Support
// ============================================
async function main() {
  const transaction = new GenerationTransaction()
  
  try {
    logger.section('React Hooks Generation')
    
    // Generate code
    logger.info('Generating React Query hooks...')
    const hooksCode = generateHooks()
    const outputPath = resolveFromWebSrc('hooks/generated.ts')
    
    // Write with transaction support
    await transaction.write(outputPath, hooksCode)
    
    // Generate comprehensive statistics
    const stats = generateStats(resources)
    
    // Commit transaction
    transaction.commit()
    
    // Success output with detailed stats
    logger.success(`Generated: hooks/generated.ts`)
    logger.stats('Resources', resources.map(r => r.name).join(', '))
    logger.stats('Total hooks', String(stats.totalHooks))
    logger.stats('Resources with custom types', String(stats.resourcesWithCustomTypes))
    logger.stats('Resources with invalidation', String(stats.resourcesWithInvalidates))
    logger.stats('Resources with type overrides', String(stats.resourcesWithTsExpectError))
    
  } catch (error) {
    logger.error('Generation failed:')
    logger.error(String(error))
    transaction.rollback()
    process.exit(1)
  }
}

// Run generation
main().catch(console.error)

