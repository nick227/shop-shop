/**
 * API Client - SOLID-Compliant Design
 * Single Responsibility: Orchestrating API access
 * Open/Closed: Extensible through dependency injection
 * Liskov Substitution: Uses abstractions
 * Interface Segregation: Clean, focused interfaces
 * Dependency Inversion: Depends on abstractions
 */
import { Configuration, type Middleware } from '@packages/sdk'
import type {
  AuthApi,
  StoresApi,
  ItemsApi,
  CartsApi,
  OrdersApi,
  AddresssApi,
  PromotionsApi,
  PaymentsApi,
  UsersApi,
  MediaApi,
  BundlesApi
} from '@packages/sdk'
import { createRequestValidationMiddleware } from './middleware/RequestValidationMiddleware'
import { getAllRequestValidationSchemas } from './schemas/RequestValidationSchemas'

class ApiClient {
  private config: Configuration | undefined = undefined
  private token: string | undefined = undefined
  private lastToken: string | undefined = undefined
  private readonly baseUrl: string
  private readonly middleware: Middleware[] = []
  
  // Simple API instance cache
  private apiInstances: Record<string, unknown> = {}

  constructor() {
    this.baseUrl = this.initializeBaseUrl()
    this.setupMiddleware()
  }

  /**
   * Initialize base URL with proper validation
   */
  private initializeBaseUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || ''
    
    if (!baseUrl && import.meta.env.PROD) {
      throw new Error('VITE_API_URL environment variable is required in production')
    }
    
    // Fallback for test environment
    return baseUrl || 'http://localhost:3005'
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Request validation middleware
    this.middleware.push(
      createRequestValidationMiddleware(getAllRequestValidationSchemas(), {
        enabled: true,
        onValidationError: (error, url, method) => {
          console.error('❌ [Request Validation] Invalid request:', {
            url,
            method,
            errors: error.errors
          })
        }
      })
    )

    // Development logging middleware
    if (import.meta.env.MODE === 'development') {
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
        const hasAuthHeader = this.checkHasAuthHeader(context.init.headers)
        
        if (context.response.status === 401 && hasAuthHeader) {
          this.setToken(undefined)
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        return context.response
      },
    })
  }

  /**
   * Get API instance with simple caching
   */
  private getApiInstance<T>(apiType: string, factory: (config: Configuration) => T): T {
    if (!this.apiInstances[apiType]) {
      this.apiInstances[apiType] = factory(this.getConfig())
    }
    return this.apiInstances[apiType] as T
  }

  /**
   * Check if request has Authorization header
   * Supports both Headers instance and plain object
   */
  private checkHasAuthHeader(headers: unknown): boolean {
    if (!headers) return false
    
    // Handle Headers instance (from Fetch API)
    if (headers instanceof Headers) {
      return headers.has('authorization')
    }
    
    // Handle plain object or Record<string, string>
    if (typeof headers === 'object') {
      return Object.entries(headers).some(
        ([key, val]) => key.toLowerCase() === 'authorization' && val
      )
    }
    
    return false
  }

  /**
   * Set authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token
    this.config = undefined // Force config recreation
    this.apiInstances = {} // Clear cached instances
  }

  /**
   * Get current token
   */
  getToken(): string | undefined {
    return this.token
  }

  /**
   * Get SDK configuration with auth headers and middleware
   */
  private getConfig(): Configuration {
    if (!this.config || this.token !== this.lastToken) {
      this.config = new Configuration({
        basePath: this.baseUrl,
        headers: this.token
          ? {
              Authorization: 'Bearer ' + this.token + '',
            }
          : {},
        middleware: this.middleware,
      })
      this.lastToken = this.token
    }
    return this.config
  }

  // ============================================
  // API Accessors - Direct SDK Instantiation
  // ============================================
  auth = (): AuthApi => this.getApiInstance('auth', (config) => new AuthApi(config))
  stores = (): StoresApi => this.getApiInstance('stores', (config) => new StoresApi(config))
  items = (): ItemsApi => this.getApiInstance('items', (config) => new ItemsApi(config))
  carts = (): CartsApi => this.getApiInstance('carts', (config) => new CartsApi(config))
  orders = (): OrdersApi => this.getApiInstance('orders', (config) => new OrdersApi(config))
  addresses = (): AddresssApi => this.getApiInstance('addresses', (config) => new AddresssApi(config))
  promotions = (): PromotionsApi => this.getApiInstance('promotions', (config) => new PromotionsApi(config))
  payments = (): PaymentsApi => this.getApiInstance('payments', (config) => new PaymentsApi(config))
  users = (): UsersApi => this.getApiInstance('users', (config) => new UsersApi(config))
  media = (): MediaApi => this.getApiInstance('media', (config) => new MediaApi(config))
  bundles = (): BundlesApi => this.getApiInstance('bundles', (config) => new BundlesApi(config))
  
  /**
   * Clear all cached API instances
   */
  clearCache(): void {
    this.apiInstances = {}
  }
}

// Singleton instance
export const apiClient = new ApiClient()

