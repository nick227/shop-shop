/**
 * Request Validation Middleware
 * Validates outgoing API requests using Zod schemas
 */

import type { Middleware } from '@packages/sdk'
import { z } from 'zod'

export interface RequestValidationConfig {
  enabled: boolean
  schemas: Record<string, z.ZodSchema>
  onValidationError?: (error: z.ZodError, url: string, method: string) => void
}

export class RequestValidationMiddleware {
  private readonly config: RequestValidationConfig

  constructor(config: RequestValidationConfig) {
    this.config = config
  }

  /**
   * Create middleware for request validation
   */
  createMiddleware(): Middleware {
    return {
      pre: async (context) => {
        if (!this.config.enabled) {
          return context
        }

        const schema = this.getSchemaForRequest(context.url, context.init.method || 'GET')
        if (!schema) {
          return context
        }

        try {
          // Validate request body if present
          if (context.init.body && typeof context.init.body === 'object') {
            const validatedBody = schema.parse(context.init.body)
            
            // Create new context with validated body
            return {
              ...context,
              init: {
                ...context.init,
                body: validatedBody
              }
            }
          }

          return context
        } catch (error) {
          if (error instanceof z.ZodError) {
            this.config.onValidationError?.(error, context.url, context.init.method || 'GET')
            
            // In development, log the error but don't block the request
            if (import.meta.env.MODE === 'development') {
              console.warn('⚠️ [Request Validation] Invalid request data:', {
                url: context.url,
                method: context.init.method,
                errors: error.errors
              })
            }
          }
          
          return context
        }
      }
    }
  }

  /**
   * Get schema for a specific request
   */
  private getSchemaForRequest(url: string, method: string): z.ZodSchema | null {
    // Extract endpoint from URL (remove query params and base path)
    const endpoint = this.extractEndpoint(url)
    
    // Look for schema based on endpoint and method
    const schemaKey = `${method.toUpperCase()}_${endpoint}`
    return this.config.schemas[schemaKey] || null
  }

  /**
   * Extract endpoint from full URL
   */
  private extractEndpoint(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      
      // Remove leading slash and convert to endpoint format
      return pathname.replace(/^\//, '').replaceAll('/', '_')
    } catch {
      return url
    }
  }

  /**
   * Add schema for specific endpoint
   */
  addSchema(endpoint: string, method: string, schema: z.ZodSchema): void {
    const key = `${method.toUpperCase()}_${endpoint}`
    this.config.schemas[key] = schema
  }

  /**
   * Remove schema for specific endpoint
   */
  removeSchema(endpoint: string, method: string): void {
    const key = `${method.toUpperCase()}_${endpoint}`
    delete this.config.schemas[key]
  }
}

/**
 * Create request validation middleware with common schemas
 */
export function createRequestValidationMiddleware(
  schemas: Record<string, z.ZodSchema> = {},
  options: Partial<RequestValidationConfig> = {}
): Middleware {
  const config: RequestValidationConfig = {
    enabled: true,
    schemas,
    onValidationError: (error, url, method) => {
      console.error('❌ [Request Validation] Invalid request:', {
        url,
        method,
        errors: error.errors
      })
    },
    ...options
  }

  const middleware = new RequestValidationMiddleware(config)
  return middleware.createMiddleware()
}
