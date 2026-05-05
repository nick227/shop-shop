#!/usr/bin/env tsx
/**
 * API Wrapper Generator
 *
 * Generates apps/web/src/api/apiWrapper.ts from resource-config.ts + actual SDK.
 * Run with: pnpm gen:wrapper  (from the sdk package)
 */

import { RESOURCE_CONFIGS } from './resource-config.js'
import { resolveFromGeneratedFrontend } from './paths.js'
import { logger } from './logger.js'
import { GenerationTransaction } from './file-utils.js'

const resources = RESOURCE_CONFIGS

// ─── Template helpers ──────────────────────────────────────────────────────

function getSingularResource(resource: string): string {
  const MAP: Record<string, string> = {
    addresses: 'address',
    companies: 'company',
    categories: 'category',
    families: 'family',
    stories: 'story',
    cities: 'city',
    countries: 'country',
    libraries: 'library',
    factories: 'factory',
    universities: 'university',
    agencies: 'agency',
    priorities: 'priority',
  }
  if (resource in MAP) return MAP[resource]
  return resource.endsWith('s') ? resource.slice(0, -1) : resource
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Header (imports + shared helpers) ────────────────────────────────────

function generateHeader(): string {
  return `/**
 * API Wrapper with Type Validation
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: SDK API classes via packages/sdk/scripts/generate-api-wrapper.ts
 *
 * To regenerate: pnpm gen:wrapper
 */
/* eslint-disable */

import { apiClient } from './client'
import type {
  StoreResponse as Store,
  ItemResponse as Item,
  CartWithTotals,
  OrderResponse as Order,
  AddressResponse as Address,
  PromotionResponse as Promotion,
  UserResponse as User,
  Bundle,
  CreateAddressInput,
  UpdateAddressInput,
  CreateStoreInput,
  UpdateStoreInput,
  CreateItemInput,
  UpdateItemInput,
  CreatePromotionInput,
  UpdatePromotionInput,
  UpdateOrderInput,
  UpdateUserInput,
} from './backend-types'

// Cart item types (not yet in OpenAPI spec)
interface AddCartItemInput { itemId: string; quantity: number; notes?: string }
interface UpdateCartItemInput { quantity?: number; notes?: string }
const CART_NOT_IMPLEMENTED_MESSAGE = 'Cart API methods not yet in OpenAPI spec'

// ─── Error class ──────────────────────────────────────────────────────────

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: unknown,
    options?: { cause?: unknown }
  ) {
    super(message)
    this.name = 'APIError'
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

// ─── Response helpers ─────────────────────────────────────────────────────

function unwrapData<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

function isResponseError(error: unknown): error is { status: number; statusText: string; message?: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    'statusText' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    typeof (error as { statusText: unknown }).statusText === 'string'
  )
}

function isAxiosError(error: unknown): error is {
  response?: { status: number; data?: { message?: string } }
  message?: string
} {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    ((error as { response: unknown }).response === undefined ||
      (typeof (error as { response: unknown }).response === 'object' &&
        typeof ((error as { response: { status: unknown } }).response)?.status === 'number'))
  )
}

function isGenericError(error: unknown): error is { message: string; status?: number; code?: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  )
}

async function handleRequest<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error: unknown) {
    if (error instanceof APIError) throw error

    if (isResponseError(error)) {
      throw new APIError(error.message ?? error.statusText, error.status, 'HTTP_ERROR', error, { cause: error })
    }

    if (isAxiosError(error)) {
      const status = error.response?.status
      const message = error.response?.data?.message ?? error.message ?? 'Request failed'
      throw new APIError(message, status, 'HTTP_ERROR', error, { cause: error })
    }

    if (isGenericError(error)) {
      throw new APIError(error.message, error.status, error.code ?? 'UNKNOWN_ERROR', error, { cause: error })
    }

    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    throw new APIError(message, undefined, 'UNKNOWN_ERROR', error, { cause: error })
  }
}
`
}

// ─── Resource sections ─────────────────────────────────────────────────────

function generateResourceSection(resource: (typeof resources)[number]): string {
  const exportName = resource.name.charAt(0).toLowerCase() + resource.name.slice(1)
  const singular = getSingularResource(resource.name)
  const listArg = resource.listParams ? 'params' : 'undefined'
  const listParam = resource.listParams ? resource.listParams + ' ' : ''

  let methods = resource.listCustom ?? `  list: async (${listParam}): Promise<${resource.type}[]> => {
    const response = await handleRequest(() =>
      apiClient.${resource.name}().${resource.sdkListMethod}(${listArg})
    )
    return unwrapData<${resource.type}[]>(response)
  },`

  methods += `

  getById: async (id: string): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.name}().${resource.sdkGetMethod}({ ${resource.sdkGetIdParam ?? 'id'}: id })
    )
    return unwrapData<${resource.type}>(result)
  },`

  if (resource.hasCreate && resource.sdkCreateMethod) {
    const param = resource.sdkCreateRequestParam ?? `${resource.sdkCreateMethod}Request`
    methods += `

  create: async (input: ${resource.createType ?? 'unknown'}): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.name}().${resource.sdkCreateMethod}({
        ${param}: input as never,
      })
    )
    return unwrapData<${resource.type}>(result)
  },`
  }

  if (resource.hasUpdate) {
    if (resource.updateCustom) {
      methods += `\n\n${resource.updateCustom}`
    } else if (resource.sdkUpdateMethod) {
      const param = resource.sdkUpdateRequestParam ?? 'updateRequest'
      const inputType = resource.updateType ?? resource.createType ?? 'unknown'
      methods += `

  update: async (id: string, input: ${inputType}): Promise<${resource.type}> => {
    const result = await handleRequest(() =>
      apiClient.${resource.name}().${resource.sdkUpdateMethod}({
        id,
        ${param}: input as never,
      })
    )
    return unwrapData<${resource.type}>(result)
  },`
    }
  }

  if (resource.hasDelete && resource.sdkDeleteMethod) {
    methods += `

  delete: async (id: string): Promise<void> => {
    await handleRequest(() =>
      apiClient.${resource.name}().${resource.sdkDeleteMethod}({ ${resource.sdkDeleteIdParam ?? 'id'}: id })
    )
  },`
  }

  return `// ============================================
// ${capitalize(resource.name)} API
// ============================================
export const ${exportName} = {
${methods}
}`
}

// ─── Cart stub section (not in OpenAPI spec) ───────────────────────────────

function generateCartSection(): string {
  return `// ============================================
// Cart API (Custom - not fully in SDK)
// ============================================
// NOTE: The real media upload/list/delete for vendors lives in
// src/shared/hooks/hooks/vendor/* and uses apiClient.media() directly.
// These stubs satisfy generated hook imports during bundling.

export const cart = {
  getActive: (): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  addItem: (_input: AddCartItemInput): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  updateItem: (_itemId: string, _input: UpdateCartItemInput): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  removeItem: (_itemId: string): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),

  clear: (): Promise<CartWithTotals> => Promise.reject(
    new APIError(CART_NOT_IMPLEMENTED_MESSAGE, undefined, 'NOT_IMPLEMENTED')
  ),
}

// ============================================
// Media Assets API (stub — real impl in vendor hooks)
// ============================================
export const mediaAssets = {
  list: (): Promise<unknown[]> => Promise.resolve([]),
  getById: (_id: string): Promise<unknown> => Promise.reject(
    new APIError('MediaAssets.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  create: (_input: unknown): Promise<unknown> => Promise.reject(
    new APIError('MediaAssets.create not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  update: (_id: string, _input: unknown): Promise<unknown> => Promise.reject(
    new APIError('MediaAssets.update not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  delete: (_id: string): Promise<void> => Promise.reject(
    new APIError('MediaAssets.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
}

// ============================================
// Posts API (stub — real impl in river hooks)
// ============================================
export const posts = {
  list: (): Promise<unknown[]> => Promise.resolve([]),
  getById: (_id: string): Promise<unknown> => Promise.reject(
    new APIError('Posts.getById not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  create: (_input: unknown): Promise<unknown> => Promise.reject(
    new APIError('Posts.create not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  update: (_id: string, _input: unknown): Promise<unknown> => Promise.reject(
    new APIError('Posts.update not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
  delete: (_id: string): Promise<void> => Promise.reject(
    new APIError('Posts.delete not implemented', undefined, 'NOT_IMPLEMENTED')
  ),
}
`
}

// ─── Main ──────────────────────────────────────────────────────────────────

function generateWrapper(): string {
  const sorted = [...resources].sort((a, b) => a.name.localeCompare(b.name))
  const sections = sorted.map(generateResourceSection).join('\n\n')
  return generateHeader() + '\n' + sections + '\n\n' + generateCartSection()
}

async function main() {
  const transaction = new GenerationTransaction()

  try {
    logger.section('API Wrapper Generation')
    logger.info('Generating API wrapper...')

    const wrapperCode = generateWrapper()
    const outputPath = resolveFromGeneratedFrontend('api/apiWrapper.ts')
    await transaction.write(outputPath, wrapperCode)

    const totalMethods = resources.reduce((sum, r) => {
      let count = 2 // list + getById
      if (r.hasCreate) count++
      if (r.hasUpdate) count++
      if (r.hasDelete) count++
      return sum + count
    }, 0)

    transaction.commit()

    logger.success('Generated: api/apiWrapper.ts')
    logger.stats('Resources', resources.map((r) => r.name).join(', '))
    logger.stats('Total methods', String(totalMethods))
  } catch (error) {
    logger.error('Generation failed:')
    logger.error(String(error))
    transaction.rollback()
    process.exit(1)
  }
}

main().catch(console.error)
