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
  AddressesApi,
  PromotionsApi,
  PaymentsApi,
  UsersApi,
  MediaApi,
  BundlesApi,
} from '@packages/sdk'
import type { components, paths } from '../types/api'

function assertSdkConstructor(name: string, Ctor: unknown): asserts Ctor is new (config: Configuration) => unknown {
  if (typeof Ctor !== 'function') {
    throw new TypeError(
      `[api/client] ${name} failed to load from @packages/sdk (got ${typeof Ctor}). Build the SDK: pnpm --filter @packages/sdk build`,
    )
  }
}

assertSdkConstructor('AuthApi', AuthApi)
assertSdkConstructor('StoresApi', StoresApi)
assertSdkConstructor('ItemsApi', ItemsApi)
assertSdkConstructor('CartsApi', CartsApi)
assertSdkConstructor('OrdersApi', OrdersApi)
assertSdkConstructor('AddressesApi', AddressesApi)
assertSdkConstructor('PromotionsApi', PromotionsApi)
assertSdkConstructor('PaymentsApi', PaymentsApi)
assertSdkConstructor('UsersApi', UsersApi)
assertSdkConstructor('MediaApi', MediaApi)
assertSdkConstructor('BundlesApi', BundlesApi)
import type { ApiError } from './types/api-contracts'
import { useAuthStore } from '@stores/authStore'

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

type ContractAttemptResult<T> =
  | { kind: 'success'; data: T }
  | { kind: 'retry'; error: ApiContractError }

interface PreparedContractRequest {
  headers: Headers
  hasIdempotencyKey: boolean
  method: string
  requestInit: RequestInit
  signal?: AbortSignal
  timeoutMs?: number
}

interface ContractAttemptSignal {
  cleanup: () => void
  signal: AbortSignal
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

        // Only auto-logout on 401 if token is actually invalid/expired, not for other auth failures
        if (context.response.status === 401 && hasAuthHeader) {
          const currentToken = useAuthStore.getState().token
          if (currentToken) {
            // Check error message to determine if token is actually invalid
            try {
              const responseClone = context.response.clone()
              const errorData = await responseClone.json().catch(() => ({}))
              const errorMessage = errorData.error || errorData.message || ''
              
                          } catch {
              console.log('[ApiClient] Error parsing 401 response')
              // If we can't parse error, be conservative and don't logout
            }
          }
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
      const created = factory(this.getConfig())
      if (created === undefined || created === null) {
        throw new Error(`[api/client] SDK factory for "${apiType}" returned ${String(created)}`)
      }
      this.apiInstances[apiType] = created
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
      const value = headers.get('authorization') ?? headers.get('Authorization')
      return typeof value === 'string' && /^bearer\s+\S+$/i.test(value.trim())
    }
    
    // Handle plain object or Record<string, string>
    if (typeof headers === 'object') {
      return Object.entries(headers).some(([key, val]) => {
        if (key.toLowerCase() !== 'authorization') return false
        if (typeof val !== 'string') return false
        return /^bearer\s+\S+$/i.test(val.trim())
      })
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
    const messageFromPayload =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.error === 'string'
          ? payload.error
          : undefined

    return {
      error: typeof payload?.error === 'string' ? payload.error : input.fallbackError,
      message: messageFromPayload ?? input.fallbackMessage,
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

  private createContractHeaders(init: ContractRequestInit, method: string): Headers {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // Read token from useAuthStore at request time
    const currentToken = useAuthStore.getState().token
    if (currentToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${currentToken}`)
    }

    if (method !== 'GET' && (init.idempotencyKey || init.enableAutoRetry)) {
      const idempotencyKey = init.idempotencyKey ?? this.createIdempotencyKey()
      this.assertValidIdempotencyKey(idempotencyKey)
      headers.set('X-Idempotency-Key', idempotencyKey)
    }

    return headers
  }

  private prepareContractRequest(init: ContractRequestInit): PreparedContractRequest {
    const method = init.method?.toUpperCase() ?? 'GET'
    const headers = this.createContractHeaders(init, method)
    const requestInit: RequestInit = { ...init }
    delete (requestInit as Partial<ContractRequestInit>).enableAutoRetry
    delete (requestInit as Partial<ContractRequestInit>).idempotencyKey
    delete requestInit.signal
    delete (requestInit as Partial<ContractRequestInit>).timeoutMs

    return {
      headers,
      hasIdempotencyKey: method !== 'GET' && headers.has('X-Idempotency-Key'),
      method,
      requestInit,
      signal: init.signal ?? undefined,
      timeoutMs: init.timeoutMs,
    }
  }

  private createContractAttemptSignal(input: PreparedContractRequest): ContractAttemptSignal {
    const timeoutController = new AbortController()
    const onAbort = () => timeoutController.abort(input.signal?.reason)
    const timeout = window.setTimeout(
      () => timeoutController.abort(new DOMException('API request timed out.', 'TimeoutError')),
      input.timeoutMs ?? CONTRACT_REQUEST_TIMEOUT_MS,
    )

    if (input.signal?.aborted) {
      timeoutController.abort(input.signal.reason)
    } else {
      input.signal?.addEventListener('abort', onAbort, { once: true })
    }

    return {
      cleanup: () => {
        window.clearTimeout(timeout)
        input.signal?.removeEventListener('abort', onAbort)
      },
      signal: timeoutController.signal,
    }
  }

  private recordContractRequestId(response: Response): string | undefined {
    const requestId = response.headers.get('x-request-id') ?? undefined
    if (requestId) {
      lastApiRequestId = requestId
    }
    return requestId
  }

  private async handleUnauthorizedContractResponse(response: Response, headers: Headers): Promise<void> {
    if (response.status === 401 && headers.has('Authorization')) {
      const currentToken = useAuthStore.getState().token
      if (currentToken) {
        // Check error message to determine if token is actually invalid
        try {
          const errorData = await response.clone().json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.message || ''
          
          // Only logout for specific token invalidation errors
          const lower = errorMessage.toLowerCase()
          const isTokenInvalid = lower.includes('invalid token') ||
                             lower.includes('token invalid') ||
                             lower.includes('expired token') ||
                             lower.includes('token expired') ||
                             lower.includes('jwt expired') ||
                             lower.includes('jwt malformed')
          
          // Be more conservative - only logout for clear token invalidation
          // Also check if error message is not just a generic "Unauthorized"
          const isGenericUnauthorized = lower === 'unauthorized' || lower === 'authentication required'
          
          if (isTokenInvalid && !isGenericUnauthorized) {
            this.setToken(undefined)
            useAuthStore.getState().clearAuth()
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }
        } catch {
          // If we can't parse error, be conservative and don't logout
        }
      }
    }
  }

  private createContractResponseError(response: Response, payload: unknown, requestId?: string): ApiContractError {
    return this.createContractError({
      status: response.status,
      fallbackError: response.statusText || 'API Error',
      fallbackMessage: `API request failed with status ${response.status}`,
      payload,
      requestId,
    })
  }

  private createContractNetworkError(error: unknown): ApiContractError {
    const isAbortError = this.isAbortError(error)
    let fallbackMessage = 'API request failed before receiving a response.'

    if (isAbortError) {
      fallbackMessage = 'API request timed out before receiving a response.'
    } else if (error instanceof Error) {
      fallbackMessage = error.message
    }

    return this.createContractError({
      status: 0,
      fallbackError: isAbortError ? 'Request Timeout' : 'Network Error',
      fallbackMessage,
    })
  }

  private async handleContractErrorRetry(error: ApiContractError, input: {
    attempt: number
    hasIdempotencyKey: boolean
    method: string
    status?: number
  }): Promise<ContractAttemptResult<never>> {
    if (this.shouldRetryContractRequest(input)) {
      await this.delay(CONTRACT_RETRY_DELAYS_MS[input.attempt])
      return { kind: 'retry', error }
    }

    throw error
  }

  private async handleContractResponse<T>(
    response: Response,
    request: PreparedContractRequest,
    attempt: number,
  ): Promise<ContractAttemptResult<T>> {
    const requestId = this.recordContractRequestId(response)
    const payload = await this.parseContractResponse(response)

    if (!response.ok) {
      await this.handleUnauthorizedContractResponse(response, request.headers)
      return this.handleContractErrorRetry(
        this.createContractResponseError(response, payload, requestId),
        {
          attempt,
          hasIdempotencyKey: request.hasIdempotencyKey,
          method: request.method,
          status: response.status,
        },
      )
    }

    if (payload === null) {
      throw this.createContractError({
        status: response.status,
        fallbackError: 'Invalid Response',
        fallbackMessage: 'Expected JSON response body from API contract endpoint.',
        requestId,
      })
    }

    return { kind: 'success', data: payload as T }
  }

  private async handleContractThrownError(
    error: unknown,
    request: PreparedContractRequest,
    attempt: number,
  ): Promise<ContractAttemptResult<never>> {
    if (error instanceof ApiContractError) {
      throw error
    }

    return this.handleContractErrorRetry(
      this.createContractNetworkError(error),
      {
        attempt,
        hasIdempotencyKey: request.hasIdempotencyKey,
        method: request.method,
      },
    )
  }

  private async executeContractAttempt<T>(
    apiPath: CheckoutPath,
    request: PreparedContractRequest,
    attempt: number,
  ): Promise<ContractAttemptResult<T>> {
    const attemptSignal = this.createContractAttemptSignal(request)

    try {
      const response = await fetch(this.buildContractUrl(apiPath), {
        ...request.requestInit,
        headers: request.headers,
        signal: attemptSignal.signal,
      })

      return await this.handleContractResponse<T>(response, request, attempt)
    } catch (error) {
      return await this.handleContractThrownError(error, request, attempt)
    } finally {
      attemptSignal.cleanup()
    }
  }

  private async requestContract<T>(
    apiPath: CheckoutPath,
    init: ContractRequestInit = {},
  ): Promise<T> {
    const request = this.prepareContractRequest(init)
    let lastError: ApiContractError | undefined

    for (let attempt = 0; attempt <= CONTRACT_RETRY_DELAYS_MS.length; attempt += 1) {
      const result = await this.executeContractAttempt<T>(apiPath, request, attempt)
      if (result.kind === 'retry') {
        lastError = result.error
        continue
      }

      return result.data
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
    const storeToken = useAuthStore.getState().token
    const effectiveToken = this.token ?? storeToken

    if (!this.config || effectiveToken !== this.lastToken) {
      // If token changes outside of apiClient.setToken (e.g. store hydration),
      // ensure we rebuild SDK API instances with new config.
      if (effectiveToken !== this.lastToken) {
        this.apiInstances = {}
      }
      this.config = new Configuration({
        basePath: this.baseUrl.replace(/\/$/, ''), // Generated SDK paths are server-rooted: /stores, /orders, /payments, etc.
        headers: effectiveToken
          ? {
              Authorization: 'Bearer ' + effectiveToken + '',
            }
          : {},
        middleware: this.middleware,
      })
      this.lastToken = effectiveToken
    }
    return this.config
  }

  /**
   * Get SDK configuration for auth endpoints (uses /auth/v1 prefix)
   */
  private getAuthConfig(): Configuration {
    const storeToken = useAuthStore.getState().token
    const effectiveToken = this.token ?? storeToken

    if (!this.authConfig || effectiveToken !== this.lastToken) {
      if (effectiveToken !== this.lastToken) {
        this.apiInstances = {}
      }
      this.authConfig = new Configuration({
        basePath: `${this.baseUrl.replace(/\/$/, '')}/auth/v1`, // Auth endpoints use /auth/v1 prefix
        headers: effectiveToken
          ? {
              Authorization: 'Bearer ' + effectiveToken + '',
            }
          : {},
        middleware: this.middleware,
      })
      this.lastToken = effectiveToken
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
  addresses = (): AddressesApi => this.getApiInstance('addresses', (config) => new AddressesApi(config))
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
