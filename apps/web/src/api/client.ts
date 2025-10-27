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
import { ConfigurationManager } from './config/ConfigurationManager'
import { ApiCacheManager } from './cache/ApiCacheManager'
import { MiddlewareManager } from './middleware/MiddlewareManager'
import {
  AuthApiFactory,
  StoresApiFactory,
  ItemsApiFactory,
  CartsApiFactory,
  OrdersApiFactory,
  AddressesApiFactory,
  PromotionsApiFactory,
  PaymentsApiFactory,
  UsersApiFactory,
  MediaApiFactory,
  type ApiInstanceFactory,
} from './factory/ApiInstanceFactory'

class ApiClient {
  private readonly configManager: ConfigurationManager
  private readonly cacheManager: ApiCacheManager
  private readonly middlewareManager: MiddlewareManager
  private readonly apiFactories: Record<string, ApiInstanceFactory<unknown>>
  
  // Configuration and state properties
  private config: Configuration | undefined = undefined
  private token: string | undefined = undefined
  private lastToken: string | undefined = undefined
  private readonly baseUrl: string
  private readonly middleware: Middleware[] = []
  
  // API instance management
  private apiInstances: Record<string, unknown> = {}
  private isCreatingInstance = false
  private instanceVersions: Record<string, number> = {}
  private configVersion = 0
  
  // Cache management
  private cacheSize = 0
  private readonly maxCacheSize = 100

  constructor() {
    // Initialize base URL
    this.baseUrl = this.initializeBaseUrl()
    
    // Initialize middleware manager
    this.middlewareManager = new MiddlewareManager({
      isDevelopment: import.meta.env.MODE === 'development',
      onAuthLogout: () => {
        this.setToken(undefined)
        window.dispatchEvent(new CustomEvent('auth:logout'))
      },
      checkHasAuthHeader: this.checkHasAuthHeader.bind(this),
    })
    
    // Initialize middleware
    this.middleware = this.middlewareManager.getMiddleware()
    
    // Initialize configuration manager
    this.configManager = new ConfigurationManager({
      baseUrl: this.baseUrl,
      middleware: this.middleware,
    })
    
    // Initialize cache manager
    this.cacheManager = new ApiCacheManager(20)
    
    // Initialize config version
    this.configVersion = this.configManager.getConfigVersion()
    
    // Initialize API factories
    this.apiFactories = {
      auth: new AuthApiFactory(),
      stores: new StoresApiFactory(),
      items: new ItemsApiFactory(),
      carts: new CartsApiFactory(),
      orders: new OrdersApiFactory(),
      addresses: new AddressesApiFactory(),
      promotions: new PromotionsApiFactory(),
      payments: new PaymentsApiFactory(),
      users: new UsersApiFactory(),
      media: new MediaApiFactory(),
    }
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
   * Get API instance using cache and factory pattern (Optimized with Error Handling)
   */
  private getApiInstance<T>(apiType: string): T {
    try {
      return this.cacheManager.getOrCreate(
        apiType,
        () => {
          const factory = this.apiFactories[apiType]
          if (!factory) {
            throw new Error('Unknown API type: ${apiType}. Available types: ' + Object.keys(this.apiFactories).join(', ') + '')
          }
          
          try {
            return factory.create(this.configManager.getConfiguration())
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error('Failed to create ' + apiType + ' API instance: ' + errorMessage)
          }
        },
        this.configManager.getConfigVersion()
      ) as T
    } catch (error: unknown) {
      console.error('API Cache Error for ' + apiType + ':', error)
      throw error
    }
  }

  /**
   * Warm up cache with frequently used APIs
   */
  async warmupCache(apiTypes: string[] = ['auth', 'stores', 'items']): Promise<void> {
    await this.cacheManager.warmup(apiTypes, (type: string) => {
      const factory = this.apiFactories[type]
      if (!factory) {
        throw new Error('Unknown API type: ' + type + '')
      }
      return factory.create(this.configManager.getConfiguration())
    })
  }

  /**
   * Get comprehensive cache analytics
   */
  getCacheAnalytics(): {
    stats: unknown
    health: unknown
    recommendations: string[]
  } {
    const stats = this.cacheManager.getStats()
    const health = this.cacheManager.getHealthMetrics()
    
    return {
      stats,
      health,
      recommendations: health.recommendations
    }
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
   * Set authentication token (managed by auth store, no localStorage here)
   */
  setToken(token: string | undefined): void {
    this.token = token
    // eslint-disable-next-line
    const newConfigVersion = this.configManager.setToken(token ?? undefined)
    this.configVersion = newConfigVersion
    this.cacheManager.updateConfigVersion(newConfigVersion)
  }

  /**
   * Get current token
   */
  getToken(): string | undefined {
    const token = this.configManager.getToken()
    return token ?? undefined
  }

  /**
   * Get SDK configuration with auth headers and middleware
   * Cached to avoid recreating on every API call
   */
  private getConfig(): Configuration {
    // Only recreate config when token changes
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
  // Low-level API accessors - cached instances with thread safety
  // ============================================
  
  /**
   * Thread-safe API instance creation with configuration validation
   */
  private createApiInstance<T>(
    key: keyof typeof this.apiInstances,
    factory: (config: Configuration) => T
  ): T {
    const keyStr = String(key)
    
    // Double-check pattern to prevent race conditions
    const existing = this.apiInstances[key]
    if (existing && this.isInstanceValid(keyStr)) {
      return existing as T
    }
    
    // Prevent concurrent instance creation for the same key
    if (this.isCreatingInstance) {
      // Wait for current creation to complete, then retry
      return this.createApiInstance(key, factory)
    }
    
    this.isCreatingInstance = true
    
    try {
      // Double-check again after acquiring lock
      const existingAfterLock = this.apiInstances[key]
      if (existingAfterLock && this.isInstanceValid(keyStr)) {
        return existingAfterLock as T
      }
      
      // Cleanup cache only if needed
      this.cleanupCacheIfNeeded()
      
      // Create new instance with current configuration
      const config = this.getConfig()
      const instance = factory(config)
      
      // Cache the instance and track its version atomically
      this.apiInstances[key] = instance as unknown
      this.instanceVersions[keyStr] = this.configVersion
      this.cacheSize++
      
      return instance
    } finally {
      this.isCreatingInstance = false
    }
  }
  
  /**
   * Check if API instance is still valid (not stale)
   */
  private isInstanceValid(key: string): boolean {
    const instanceVersion = this.instanceVersions[key]
    return instanceVersion === this.configVersion
  }
  
  /**
   * Cleanup cache if it exceeds maximum size
   */
  private cleanupCacheIfNeeded(): void {
    // Only cleanup if cache is at or exceeds maximum size
    if (this.cacheSize >= this.maxCacheSize) {
      // Clear all instances and reset counters
      this.apiInstances = {}
      this.instanceVersions = {}
      this.cacheSize = 0
    }
  }

  // ============================================
  // API Accessors - SOLID-Compliant Implementation
  // ============================================
  auth = (): AuthApi => this.getApiInstance<AuthApi>('auth')
  stores = (): StoresApi => this.getApiInstance<StoresApi>('stores')
  items = (): ItemsApi => this.getApiInstance<ItemsApi>('items')
  carts = (): CartsApi => this.getApiInstance<CartsApi>('carts')
  orders = (): OrdersApi => this.getApiInstance<OrdersApi>('orders')
  addresses = (): AddresssApi => this.getApiInstance<AddresssApi>('addresses')
  promotions = (): PromotionsApi => this.getApiInstance<PromotionsApi>('promotions')
  payments = (): PaymentsApi => this.getApiInstance<PaymentsApi>('payments')
  users = (): UsersApi => this.getApiInstance<UsersApi>('users')
  media = (): MediaApi => this.getApiInstance<MediaApi>('media')
  bundles = (): BundlesApi => this.getApiInstance<BundlesApi>('bundles')
  
  /**
   * Clear all cached API instances (useful for memory management)
   */
  clearCache(): void {
    this.cacheManager.clear()
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cacheManager.getStats()
  }
  
  /**
   * Force refresh all API instances (useful for debugging)
   */
  refreshAllInstances(): void {
    this.configManager.refresh()
    this.configVersion = this.configManager.getConfigVersion()
    this.cacheManager.updateConfigVersion(this.configVersion)
  }
  
  /**
   * Clear only stale instances (more efficient than full refresh)
   */
  clearStaleInstances(): void {
    this.cacheManager.clearStale()
  }
}

// Singleton instance
export const apiClient = new ApiClient()

