#!/usr/bin/env tsx
/**
 * Improved API Wrapper Generator
 * 
 * Generates apps/web/src/api/apiWrapper.ts from SDK API classes
 * Provides type-safe bridge between SDK and createResourceHooks interface
 * 
 * Improvements:
 * - Better error handling and type safety
 * - Proper import resolution
 * - No duplicate declarations
 * - Comprehensive type checking
 * - Better code organization
 */

import { RESOURCE_CONFIGS, CUSTOM_INPUT_TYPES } from './resource-config.js'
import { PATHS, resolveFromWebSrc } from './paths.js'
import { logger, ProgressLogger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'

// Use shared resource configuration
const resources = RESOURCE_CONFIGS
const customInputTypes = CUSTOM_INPUT_TYPES

function generateWrapper(): string {
  const header = `/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes
 * 
 * To regenerate: pnpm gen:wrapper
 */

import { apiClient } from './client'
import { validators, ValidationError } from './validators'
import type { 
  Store, 
  Item, 
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  RiverPost,
  Bundle,
} from './backend-types'
${customInputTypes}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Helper: Wrap API calls with comprehensive error handling
 */
async function handleRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation Error:', error.message)
      throw error
    }
    
    // Handle API errors
    if (error && typeof error === 'object' && 'message' in error) {
      const apiError = error as { message: string; status?: number; code?: string }
      console.error('API Error:', apiError.message)
      throw new APIError(apiError.message, apiError.status, apiError.code)
    }
    
    console.error('Unknown Error:', error)
    throw new Error('An unexpected error occurred')
  }
}

/**
 * Type-safe response handler
 */
function handleResponse<T>(response: unknown, validator: (data: unknown) => T): T {
  try {
    return validator(response)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new ValidationError('Response validation failed', 'response', [])
  }
}

/**
 * Type-safe list response handler
 */
function handleListResponse<T>(response: unknown, validator: (data: unknown) => T[]): T[] {
  try {
    // Handle both direct arrays and wrapped responses
    const data = (response as { data?: unknown[] }).data ?? response
    if (!Array.isArray(data)) {
      throw new ValidationError('Expected array response', 'list', [])
    }
    return validator(data)
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new ValidationError('List response validation failed', 'list', [])
  }
}
`

  const sections = resources.map(resource => {
    const methodName = resource.name.charAt(0).toLowerCase() + resource.name.slice(1)
    const validatorName = resource.name === 'addresses' ? 'address' : resource.name.replace(/s$/, '')
    
    let methods = `  /**
   * List ${resource.name}
   */
  list: async (${resource.listParams || ''}): Promise<${resource.type}[]> => {
    const response = await handleRequest(() =>
      apiClient.${resource.apiClass.toLowerCase()}().${resource.sdkListMethod}(${resource.listParams ? 'params' : ''})
    )
    return handleListResponse(response, validators.${validatorName}List)
  },

  /**
   * Get ${resource.name.slice(0, -1)} by ID
   */
  getById: async (id: string): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.apiClass.toLowerCase()}().${resource.sdkGetMethod}({ id })
    )
    return handleResponse(result, validators.${validatorName})
  },`

    // Add create method if available
    if (resource.hasCreate && resource.sdkCreateMethod) {
      const createParam = resource.sdkCreateRequestParam || 'request'
      methods += `

  /**
   * Create ${resource.name.slice(0, -1)}
   */
  create: async (input: ${resource.createType}): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.apiClass.toLowerCase()}().${resource.sdkCreateMethod}({
        ${createParam}: input
      })
    )
    return handleResponse(result, validators.${validatorName})
  },`
    }

    // Add update method if available
    if (resource.hasUpdate && resource.sdkUpdateMethod) {
      if (resource.updateCustom) {
        methods += `\n${resource.updateCustom}`
      } else {
        const updateParam = resource.sdkUpdateRequestParam || 'request'
        methods += `

  /**
   * Update ${resource.name.slice(0, -1)}
   */
  update: async (id: string, input: ${resource.createType}): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.apiClass.toLowerCase()}().${resource.sdkUpdateMethod}({
        id,
        ${updateParam}: input
      })
    )
    return handleResponse(result, validators.${validatorName})
  },`
      }
    }

    // Add delete method if available
    if (resource.hasDelete && resource.sdkDeleteMethod) {
      methods += `

  /**
   * Delete ${resource.name.slice(0, -1)}
   */
  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.${resource.apiClass.toLowerCase()}().${resource.sdkDeleteMethod}({ id })
    )
  },`
    }

    return `export const ${resource.name} = {${methods}
}`
  })

  // Add special cart methods
  const cartMethods = `
export const cart = {
  /**
   * Get active cart for current user
   */
  getActive: async (): Promise<CartWithTotals | null> => {
    try {
      const carts = await handleRequest(() =>
        apiClient.carts().listCarts()
      )
      const activeCart = handleListResponse(carts, validators.cartList).find(cart => cart.isActive)
      return activeCart ?? null
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Add item to cart
   */
  addItem: async (input: AddCartItemInput): Promise<CartWithTotals> => {
    const result = await handleRequest(() =>
      apiClient.carts().createCart({
        createCartRequest: input
      })
    )
    return handleResponse(result, validators.cart)
  },

  /**
   * Update cart item
   */
  updateItem: async (itemId: string, input: UpdateCartItemInput): Promise<CartWithTotals> => {
    // TODO: Implement update cart item
    throw new Error('Update cart item not implemented')
  },

  /**
   * Remove item from cart
   */
  removeItem: async (itemId: string): Promise<void> => {
    // TODO: Implement remove cart item
    throw new Error('Remove cart item not implemented')
  },

  /**
   * Clear cart
   */
  clear: async (): Promise<void> => {
    // TODO: Implement clear cart
    throw new Error('Clear cart not implemented')
  }
}`

  return `${header}

${sections.join('\n\n')}

${cartMethods}

// Export all resources
export const api = {
  stores,
  items,
  carts,
  orders,
  addresses,
  posts,
  bundles,
  cart,
}

export default api
`
}

async function main() {
  const progress = new ProgressLogger('API Wrapper Generation')
  
  try {
    progress.start('Generating API wrapper...')
    
    const content = generateWrapper()
    const outputPath = resolveFromWebSrc('api/apiWrapper.ts')
    
    const transaction = new GenerationTransaction()
    await transaction.writeFile(outputPath, content)
    await transaction.commit()
    
    progress.complete(`Generated: ${outputPath}`)
    progress.info(`Resources: ${resources.map(r => r.name).join(', ')}`)
    progress.info(`Total methods: ${resources.reduce((sum, r) => sum + (r.methods?.length || 0), 0)}`)
    
  } catch (error) {
    progress.error('Generation failed:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { generateWrapper }
