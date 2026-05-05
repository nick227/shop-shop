/**
 * API Client - SOLID-Compliant Design
 * Single Responsibility: Orchestrating API access
 * Open/Closed: Extensible through dependency injection
 * Liskov Substitution: Uses abstractions
 * Interface Segregation: Clean, focused interfaces
 * Dependency Inversion: Depends on abstractions
 */
import {
  Configuration,
  type Middleware,
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
  BundlesApi,
} from '@packages/sdk'
import type { components, paths } from '../types/api'
import type { ApiError } from './types/api-contracts'

interface ApiErrorResponse {
  error?: string
  message?: string
  status?: number
  requestId?: string
}

type ContractRequestInit = Omit<RequestInit, 'method'> & {
  method?: 'GET' | 'POST'
  idempotencyKey?: string
  timeoutMs?: number
  enableAutoRetry?: boolean // Opt-in for automatic retry behavior
}

type CreateCheckoutSessionRequest = components['schemas']['CreateCheckoutSessionRequest']
type CreateCheckoutSessionResponse = components['schemas']['CreateCheckoutSessionResponse']
type CompleteCheckoutRequest = components['schemas']['CompleteCheckoutRequest']
type CompleteCheckoutResponse = components['schemas']['CompleteCheckoutResponse']
type CheckoutStatusResponse = components['schemas']['CheckoutStatusResponse']
type CheckoutPath = keyof paths
// Using unified ApiError from api-contracts
interface NormalizedApiError {
  error: string
  message: string
  status: number
  requestId?: string
  payload?: ApiErrorResponse | null
}

const CONTRACT_REQUEST_TIMEOUT_MS = 15_000
const CONTRACT_RETRY_DELAYS_MS = [250, 750]

let lastApiRequestId: string | undefined

/** Last `x-request-id` from a response (set by API middleware). For error reports and support. */
export function getLastApiRequestId(): string | undefined {
  return lastApiRequestId
}

export class ApiContractError extends Error {
  readonly status: number
  readonly error: string
  readonly requestId?: string

  constructor(input: {
    status: number
    error: string
    message: string
    requestId?: string
  }) {
    super(input.message)
    this.name = 'ApiContractError'
    Object.setPrototypeOf(this, ApiContractError.prototype)
    this.status = input.status
    this.error = input.error
    this.requestId = input.requestId
  }
}

class ApiClient {
  private config: Configuration | undefined = undefined
  private authConfig: Configuration | undefined = undefined
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
    
    // Development logging middleware
    if (import.meta.env.MODE === 'development') {
      this.middleware.push({
        pre: async (context) => {
          console.log('[API] → ' + context.init.method + ' ' + context.url)
          return context
        },
        post: async (context) => {
          console.log('[API] ← ' + context.response.status + ' ' + context.url)
          // Temporary SDK response logging for debugging
          if (context.response.status >= 400) {
            console.log('[API] Error response:', {
              status: context.response.status,
              url: context.url,
              headers: Object.fromEntries(context.response.headers.entries())
            })
          }
          return context.response
        },
      })
    }

    // Auth middleware - handle 401 for authenticated requests only
    this.middleware.push({
      post: async (context) => {
        const rid = context.response.headers.get('x-request-id')
        if (rid) {
          lastApiRequestId = rid
        }
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
        ([key, val]) => key.toLowerCase() === 'authorization' && Boolean(val)
      )
    }
    
    return false
  }

  private createIdempotencyKey(): string {
    const random =
      typeof crypto !== 'undefined' && 'getRandomValues' in crypto
        ? crypto.getRandomValues(new Uint32Array(2))
        : new Uint32Array([
            Math.floor(Math.random() * 0xFF_FF_FF_FF),
            Math.floor(Math.random() * 0xFF_FF_FF_FF),
          ])
    return `web_${Date.now()}_${random[0].toString(36)}${random[1].toString(36)}`
  }

  private assertValidIdempotencyKey(idempotencyKey: string): void {
    if (!/^[\w-]{8,64}$/.test(idempotencyKey)) {
      throw new ApiContractError({
        status: 0,
        error: 'Invalid Idempotency Key',
        message: 'Idempotency key must be 8-64 characters and contain only letters, numbers, underscores, or hyphens.',
      })
    }
  }

  private buildContractUrl(apiPath: CheckoutPath): string {
    return `${this.baseUrl.replace(/\/$/, '')}/api/v1${apiPath}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  private shouldRetryContractRequest(input: {
    method: string
    hasIdempotencyKey: boolean
    attempt: number
    status?: number
  }): boolean {
    if (input.attempt >= CONTRACT_RETRY_DELAYS_MS.length) {
      return false
    }

    const isSafeMethod = input.method === 'GET'
    const isIdempotentPost = input.method === 'POST' && input.hasIdempotencyKey
    if (!isSafeMethod && !isIdempotentPost) {
      return false
    }

    return input.status === undefined || input.status === 408 || input.status === 429 || input.status >= 500
  }

  private normalizeApiError(input: {
    fallbackError: string
    fallbackMessage: string
    payload?: unknown
    requestId?: string
    status?: number
  }): NormalizedApiError {
    const payload = input.payload && typeof input.payload === 'object'
      ? (input.payload as { error?: string; message?: string; requestId?: string })
      : null
    return {
      error: typeof payload?.error === 'string' ? payload.error : input.fallbackError,
      message: typeof payload?.message === 'string' ? payload.message : input.fallbackMessage,
      status: input.status ?? 0,
      requestId: typeof payload?.requestId === 'string' ? payload.requestId : input.requestId,
      payload,
    }
  }

  private createContractError(input: {
    status: number
    fallbackError: string
    fallbackMessage: string
    payload?: unknown
    requestId?: string
  }): ApiContractError {
    const normalized = this.normalizeApiError({
      fallbackError: input.fallbackError,
      fallbackMessage: input.fallbackMessage,
      payload: input.payload,
      requestId: input.requestId,
      status: input.status,
    })

    return new ApiContractError({
      status: input.status,
      error: normalized.error,
      message: normalized.message,
      requestId: normalized.requestId,
    })
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException
      ? error.name === 'AbortError' || error.name === 'TimeoutError'
      : error instanceof Error && error.name === 'AbortError'
  }

  private async requestContract<T>(
    apiPath: CheckoutPath,
    init: ContractRequestInit = {},
  ): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }

    const method = init.method?.toUpperCase() ?? 'GET'
    if (method !== 'GET' && (init.idempotencyKey || init.enableAutoRetry)) {
      const idempotencyKey = init.idempotencyKey ?? this.createIdempotencyKey()
      this.assertValidIdempotencyKey(idempotencyKey)
      headers.set('X-Idempotency-Key', idempotencyKey)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { idempotencyKey: _idempotencyKey, timeoutMs, signal, ...requestInit } = init
    const hasIdempotencyKey = method !== 'GET' && headers.has('X-Idempotency-Key')
    let lastError: ApiContractError | undefined

    for (let attempt = 0; attempt <= CONTRACT_RETRY_DELAYS_MS.length; attempt += 1) {
      const timeoutController = new AbortController()
      const onAbort = () => timeoutController.abort(signal?.reason)
      const timeout = window.setTimeout(
        () => timeoutController.abort(new DOMException('API request timed out.', 'TimeoutError')),
        timeoutMs ?? CONTRACT_REQUEST_TIMEOUT_MS,
      )

      if (signal) {
        if (signal.aborted) {
          timeoutController.abort(signal.reason)
        } else {
          signal.addEventListener('abort', onAbort, { once: true })
        }
      }

      try {
        const response = await fetch(this.buildContractUrl(apiPath), {
          ...requestInit,
          headers,
          signal: timeoutController.signal,
        })

        const requestId = response.headers.get('x-request-id') ?? undefined
        if (requestId) {
          lastApiRequestId = requestId
        }

        const payload = await this.parseContractResponse(response)

        if (!response.ok) {
          if (response.status === 401 && headers.has('Authorization')) {
            this.setToken(undefined)
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }

          lastError = this.createContractError({
            status: response.status,
            fallbackError: response.statusText || 'API Error',
            fallbackMessage: `API request failed with status ${response.status}`,
            payload,
            requestId,
          })

          if (this.shouldRetryContractRequest({ method, hasIdempotencyKey, attempt, status: response.status })) {
            await this.delay(CONTRACT_RETRY_DELAYS_MS[attempt])
            continue
          }

          throw lastError
        }

        if (payload === null) {
          throw this.createContractError({
            status: response.status,
            fallbackError: 'Invalid Response',
            fallbackMessage: 'Expected JSON response body from API contract endpoint.',
            requestId,
          })
        }

        // Return typed success response
        return payload as T
      } catch (error) {
        if (error instanceof ApiContractError) {
          throw error
        }

        lastError = this.createContractError({
          status: 0,
          fallbackError: this.isAbortError(error) ? 'Request Timeout' : 'Network Error',
          fallbackMessage: this.isAbortError(error)
            ? 'API request timed out before receiving a response.'
            : (error instanceof Error
              ? error.message
              : 'API request failed before receiving a response.'),
          payload: null,
        })

        if (this.shouldRetryContractRequest({ method, hasIdempotencyKey, attempt })) {
          await this.delay(CONTRACT_RETRY_DELAYS_MS[attempt])
          continue
        }

        throw lastError
      } finally {
        window.clearTimeout(timeout)
        signal?.removeEventListener('abort', onAbort)
      }
    }

    throw lastError ?? this.createContractError({
      status: 0,
      fallbackError: 'API Error',
      fallbackMessage: 'API request failed.',
      payload: null,
    })
  }

  private async parseContractResponse<T>(response: Response): Promise<T | null> {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return null
    }
    return (await response.json().catch(() => null)) as T
  }

  /**
   * Set authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token
    this.config = undefined // Force config recreation
    this.authConfig = undefined // Force auth config recreation
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
        basePath: this.baseUrl.replace(/\/$/, ''), // Generated SDK paths are server-rooted: /stores, /orders, /payments, etc.
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

  /**
   * Get SDK configuration for auth endpoints (uses /auth/v1 prefix)
   */
  private getAuthConfig(): Configuration {
    if (!this.authConfig || this.token !== this.lastToken) {
      this.authConfig = new Configuration({
        basePath: `${this.baseUrl.replace(/\/$/, '')}/auth/v1`, // Auth endpoints use /auth/v1 prefix
        headers: this.token
          ? {
              Authorization: 'Bearer ' + this.token + '',
            }
          : {},
        middleware: this.middleware,
      })
      this.lastToken = this.token
    }
    return this.authConfig
  }

  // ============================================
  // API Accessors - Direct SDK Instantiation
  // Note: Auth uses /auth/v1, checkout uses /api/v1, generated resource APIs are server-rooted.
  // ============================================
  auth = (): AuthApi => this.getApiInstance('auth', (config) => new AuthApi(this.getAuthConfig()))
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

  checkout = {
    createSession: (
      input: CreateCheckoutSessionRequest,
      options?: { idempotencyKey?: string },
    ): Promise<CreateCheckoutSessionResponse> =>
      this.requestContract<CreateCheckoutSessionResponse>('/checkout/session', {
        method: 'POST',
        body: JSON.stringify(input),
        idempotencyKey: options?.idempotencyKey,
        enableAutoRetry: true, // Checkout endpoints are safe to retry
      }),

    complete: (
      input: CompleteCheckoutRequest,
      options?: { idempotencyKey?: string },
    ): Promise<CompleteCheckoutResponse> =>
      this.requestContract<CompleteCheckoutResponse>('/checkout/complete', {
        method: 'POST',
        body: JSON.stringify(input),
        idempotencyKey: options?.idempotencyKey,
        enableAutoRetry: true, // Checkout endpoints are safe to retry
      }),

    getStatus: (sessionId: string): Promise<CheckoutStatusResponse> =>
      this.requestContract<CheckoutStatusResponse>(
        `/checkout/status/${encodeURIComponent(sessionId)}` as CheckoutPath,
      ),
  }
  
  /**
   * Clear all cached API instances
   */
  clearCache(): void {
    this.apiInstances = {}
  }
}

// Singleton instance
export const apiClient = new ApiClient()
