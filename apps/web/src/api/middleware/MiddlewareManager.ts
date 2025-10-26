/**
 * Middleware Manager - Single Responsibility: Middleware Management
 * Follows SRP: Only responsible for setting up and managing middleware
 */

import type { Middleware } from '@packages/sdk'

export interface MiddlewareManagerConfig {
  isDevelopment: boolean
  onAuthLogout: () => void
  checkHasAuthHeader: (headers: any) => boolean
}

export class MiddlewareManager {
  private middleware: Middleware[] = []
  private readonly config: MiddlewareManagerConfig

  constructor(config: MiddlewareManagerConfig) {
    this.config = config
    this.setupMiddleware()
  }

  /**
   * Get all configured middleware
   */
  getMiddleware(): Middleware[] {
    return this.middleware
  }

  /**
   * Set up middleware based on configuration
   */
  private setupMiddleware(): void {
    // Development logging middleware
    if (this.config.isDevelopment) {
      this.middleware.push({
        pre: async (context) => {
          console.log('[API] → ' + context.init.method + ' ' + context.url)
          return context
        },
        post: async (context) => {
          console.log('[API] ← ' + context.response.status + ' ' + context.url)
          return context.response
        },
      })
    }

    // Auth middleware - handle 401 for authenticated requests only
    this.middleware.push({
      post: async (context) => {
        // Only logout if request had auth token (session expired)
        // Don't logout on failed login attempts (no auth header)
        const hasAuthHeader = this.config.checkHasAuthHeader(context.init.headers)
        
        if (context.response.status === 401 && hasAuthHeader) {
          this.config.onAuthLogout()
        }
        return context.response
      },
    })
  }

  /**
   * Add custom middleware
   */
  addMiddleware(middleware: Middleware): void {
    this.middleware.push(middleware)
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.middleware = []
  }
}
