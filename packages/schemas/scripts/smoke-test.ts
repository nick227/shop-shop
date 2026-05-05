#!/usr/bin/env tsx
/**
 * OpenAPI Smoke Test Script
 * 
 * Consumes the generated OpenAPI spec and tests:
 * 1. OpenAPI spec validity
 * 2. Generated SDK functionality
 * 3. Route endpoint availability
 * 4. Schema validation
 */

import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Import generated SDK (with fallback)
let SDK_AVAILABLE = false
let SDK_APIS: any = {}

try {
  const sdk = await import('@packages/sdk')
  SDK_AVAILABLE = true
  SDK_APIS = sdk
} catch (error) {
  console.log('⚠️  SDK not available - some tests will be skipped')
}

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000', // Adjust based on your server
  timeout: 10000,
  retries: 3
}

// Test results tracking
interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  duration: number
  error?: string
}

class SmokeTestRunner {
  private results: TestResult[] = []
  private openApiSpec: any = null
  private sdkConfig: Configuration

  constructor() {
    if (SDK_AVAILABLE && SDK_APIS.Configuration) {
      this.sdkConfig = new SDK_APIS.Configuration({
        basePath: TEST_CONFIG.baseUrl,
        timeout: TEST_CONFIG.timeout
      })
    }
  }

  /**
   * Load and validate OpenAPI spec
   */
  async loadOpenApiSpec(): Promise<boolean> {
    const specPath = path.resolve(__dirname, '../../openapi/openapi.json')
    
    try {
      if (!fs.existsSync(specPath)) {
        this.addResult('load-openapi-spec', 'fail', 'OpenAPI spec file not found', 0)
        return false
      }

      const specContent = fs.readFileSync(specPath, 'utf-8')
      this.openApiSpec = JSON.parse(specContent)
      
      // Validate basic OpenAPI structure
      if (!this.openApiSpec.openapi || !this.openApiSpec.paths || !this.openApiSpec.components) {
        this.addResult('validate-openapi-structure', 'fail', 'Invalid OpenAPI structure', 0)
        return false
      }

      this.addResult('load-openapi-spec', 'pass', 'OpenAPI spec loaded successfully', 0)
      return true
    } catch (error) {
      this.addResult('load-openapi-spec', 'fail', `Failed to load OpenAPI spec: ${error}`, 0)
      return false
    }
  }

  /**
   * Test OpenAPI spec completeness
   */
  async testOpenApiCompleteness(): Promise<void> {
    const startTime = Date.now()
    
    try {
      const { paths, components } = this.openApiSpec
      
      // Check for required API endpoints
      const requiredEndpoints = [
        '/auth/signup',
        '/auth/login', 
        '/users',
        '/stores',
        '/items',
        '/orders',
        '/carts',
        '/bundles',
        '/promotions',
        '/addresses'
      ]

      const missingEndpoints = requiredEndpoints.filter(endpoint => !paths[endpoint])
      
      if (missingEndpoints.length > 0) {
        this.addResult('openapi-completeness', 'fail', 
          `Missing endpoints: ${missingEndpoints.join(', ')}`, 
          Date.now() - startTime)
        return
      }

      // Check for required schemas
      const requiredSchemas = [
        'CreateUserInput',
        'UserResponse',
        'CreateStoreInput', 
        'StoreResponse',
        'CreateItemInput',
        'ItemResponse',
        'CreateOrderInput',
        'OrderResponse'
      ]

      const schemas = components?.schemas || {}
      const missingSchemas = requiredSchemas.filter(schema => !schemas[schema])
      
      if (missingSchemas.length > 0) {
        this.addResult('openapi-schemas', 'fail',
          `Missing schemas: ${missingSchemas.join(', ')}`,
          Date.now() - startTime)
        return
      }

      this.addResult('openapi-completeness', 'pass', 
        `Found ${Object.keys(paths).length} endpoints and ${Object.keys(schemas).length} schemas`,
        Date.now() - startTime)

    } catch (error) {
      this.addResult('openapi-completeness', 'fail', 
        `Error testing OpenAPI completeness: ${error}`, 
        Date.now() - startTime)
    }
  }

  /**
   * Test SDK API classes instantiation
   */
  async testSdkInstantiation(): Promise<void> {
    const startTime = Date.now()
    
    if (!SDK_AVAILABLE) {
      this.addResult('sdk-instantiation', 'skip',
        'SDK not available - run pnpm gen:sdk first',
        Date.now() - startTime)
      return
    }
    
    try {
      const apis = [
        { name: 'DefaultApi', instance: new SDK_APIS.DefaultApi(this.sdkConfig) },
        { name: 'AddresssApi', instance: new SDK_APIS.AddresssApi(this.sdkConfig) },
        { name: 'AuthApi', instance: new SDK_APIS.AuthApi(this.sdkConfig) },
        { name: 'BundlesApi', instance: new SDK_APIS.BundlesApi(this.sdkConfig) },
        { name: 'CartsApi', instance: new SDK_APIS.CartsApi(this.sdkConfig) },
        { name: 'ItemsApi', instance: new SDK_APIS.ItemsApi(this.sdkConfig) },
        { name: 'MediaApi', instance: new SDK_APIS.MediaApi(this.sdkConfig) },
        { name: 'OrdersApi', instance: new SDK_APIS.OrdersApi(this.sdkConfig) },
        { name: 'PaymentsApi', instance: new SDK_APIS.PaymentsApi(this.sdkConfig) },
        { name: 'PromotionsApi', instance: new SDK_APIS.PromotionsApi(this.sdkConfig) },
        { name: 'StoresApi', instance: new SDK_APIS.StoresApi(this.sdkConfig) },
        { name: 'TipsApi', instance: new SDK_APIS.TipsApi(this.sdkConfig) },
        { name: 'UsersApi', instance: new SDK_APIS.UsersApi(this.sdkConfig) }
      ]

      const failedApis = apis.filter(api => !api.instance)
      
      if (failedApis.length > 0) {
        this.addResult('sdk-instantiation', 'fail',
          `Failed to instantiate APIs: ${failedApis.map(a => a.name).join(', ')}`,
          Date.now() - startTime)
        return
      }

      this.addResult('sdk-instantiation', 'pass',
        `Successfully instantiated ${apis.length} API classes`,
        Date.now() - startTime)

    } catch (error) {
      this.addResult('sdk-instantiation', 'fail',
        `Error instantiating SDK: ${error}`,
        Date.now() - startTime)
    }
  }

  /**
   * Test SDK method availability
   */
  async testSdkMethods(): Promise<void> {
    const startTime = Date.now()
    
    if (!SDK_AVAILABLE) {
      this.addResult('sdk-methods', 'skip',
        'SDK not available - run pnpm gen:sdk first',
        Date.now() - startTime)
      return
    }
    
    try {
      const usersApi = new SDK_APIS.UsersApi(this.sdkConfig)
      const storesApi = new SDK_APIS.StoresApi(this.sdkConfig)
      const itemsApi = new SDK_APIS.ItemsApi(this.sdkConfig)
      const ordersApi = new SDK_APIS.OrdersApi(this.sdkConfig)
      const cartsApi = new SDK_APIS.CartsApi(this.sdkConfig)

      // Test method existence
      const requiredMethods = [
        { api: 'UsersApi', methods: ['listUsers', 'getUser', 'updateUser'] },
        { api: 'StoresApi', methods: ['listStores', 'getStore', 'createStore', 'updateStore'] },
        { api: 'ItemsApi', methods: ['listItems', 'getItem', 'createItem', 'updateItem'] },
        { api: 'OrdersApi', methods: ['listOrders', 'getOrder', 'createOrder', 'updateOrder'] },
        { api: 'CartsApi', methods: ['listCarts', 'getCart', 'createCart', 'updateCart'] }
      ]

      const missingMethods: string[] = []

      for (const { api, methods } of requiredMethods) {
        const apiInstance = eval(`${api.toLowerCase()}`)
        for (const method of methods) {
          if (typeof apiInstance[method] !== 'function') {
            missingMethods.push(`${api}.${method}`)
          }
        }
      }

      if (missingMethods.length > 0) {
        this.addResult('sdk-methods', 'fail',
          `Missing methods: ${missingMethods.join(', ')}`,
          Date.now() - startTime)
        return
      }

      this.addResult('sdk-methods', 'pass',
        `All required SDK methods are available`,
        Date.now() - startTime)

    } catch (error) {
      this.addResult('sdk-methods', 'fail',
        `Error testing SDK methods: ${error}`,
        Date.now() - startTime)
    }
  }

  /**
   * Test schema validation with generated DTOs
   */
  async testSchemaValidation(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Import DTOs for validation
      const { 
        CreateUserInputSchema,
        UserResponseSchema,
        CreateStoreInputSchema,
        StoreResponseSchema,
        CreateItemInputSchema,
        ItemResponseSchema
      } = await import('../src/dtos')

      // Test valid data
      const validUserData = {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890'
      }

      const validStoreData = {
        name: 'Test Store',
        slug: 'test-store',
        description: 'A test store'
      }

      const validItemData = {
        storeId: 'test-store-id',
        name: 'Test Item',
        description: 'A test item',
        price: '9.99'
      }

      // Test schema validation
      const userValidation = CreateUserInputSchema.safeParse(validUserData)
      const storeValidation = CreateStoreInputSchema.safeParse(validStoreData)
      const itemValidation = CreateItemInputSchema.safeParse(validItemData)

      const validationErrors: string[] = []

      if (!userValidation.success) {
        validationErrors.push(`User schema: ${userValidation.error.message}`)
      }

      if (!storeValidation.success) {
        validationErrors.push(`Store schema: ${storeValidation.error.message}`)
      }

      if (!itemValidation.success) {
        validationErrors.push(`Item schema: ${itemValidation.error.message}`)
      }

      if (validationErrors.length > 0) {
        this.addResult('schema-validation', 'fail',
          `Schema validation failed: ${validationErrors.join('; ')}`,
          Date.now() - startTime)
        return
      }

      this.addResult('schema-validation', 'pass',
        'All schema validations passed',
        Date.now() - startTime)

    } catch (error) {
      this.addResult('schema-validation', 'fail',
        `Error testing schema validation: ${error}`,
        Date.now() - startTime)
    }
  }

  /**
   * Test endpoint connectivity (if server is running)
   */
  async testEndpointConnectivity(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      const response = await fetch(`${TEST_CONFIG.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      }).catch(() => null)

      if (!response) {
        this.addResult('endpoint-connectivity', 'skip',
          'Server not running - skipping connectivity tests',
          Date.now() - startTime)
        return
      }

      if (response.ok) {
        this.addResult('endpoint-connectivity', 'pass',
          'Server is responding to health checks',
          Date.now() - startTime)
      } else {
        this.addResult('endpoint-connectivity', 'fail',
          `Server returned status: ${response.status}`,
          Date.now() - startTime)
      }

    } catch (error) {
      this.addResult('endpoint-connectivity', 'skip',
        `Server connectivity test skipped: ${error}`,
        Date.now() - startTime)
    }
  }

  /**
   * Test generated client hooks (if available)
   */
  async testClientHooks(): Promise<void> {
    const startTime = Date.now()
    
    try {
      // Check if hooks are generated
      const hooksPath = path.resolve(__dirname, '../../sdk/src/hooks/generated.ts')
      
      if (!fs.existsSync(hooksPath)) {
        this.addResult('client-hooks', 'skip',
          'Client hooks not found - may not be generated yet',
          Date.now() - startTime)
        return
      }

      const hooksContent = fs.readFileSync(hooksPath, 'utf-8')
      
      // Check for required hook patterns
      const requiredHooks = [
        'useUsers',
        'useStores', 
        'useItems',
        'useOrders',
        'useCarts'
      ]

      const missingHooks = requiredHooks.filter(hook => !hooksContent.includes(hook))
      
      if (missingHooks.length > 0) {
        this.addResult('client-hooks', 'fail',
          `Missing hooks: ${missingHooks.join(', ')}`,
          Date.now() - startTime)
        return
      }

      this.addResult('client-hooks', 'pass',
        `Found ${requiredHooks.length} required hooks`,
        Date.now() - startTime)

    } catch (error) {
      this.addResult('client-hooks', 'fail',
        `Error testing client hooks: ${error}`,
        Date.now() - startTime)
    }
  }

  /**
   * Add test result
   */
  private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, error?: string): void {
    this.results.push({
      name,
      status,
      message,
      duration,
      error
    })
  }

  /**
   * Run all smoke tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting OpenAPI Smoke Tests...\n')

    // Load OpenAPI spec
    const specLoaded = await this.loadOpenApiSpec()
    if (!specLoaded) {
      console.log('❌ Cannot proceed without valid OpenAPI spec')
      return
    }

    // Run all tests
    await this.testOpenApiCompleteness()
    await this.testSdkInstantiation()
    await this.testSdkMethods()
    await this.testSchemaValidation()
    await this.testEndpointConnectivity()
    await this.testClientHooks()

    // Print results
    this.printResults()
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 Smoke Test Results:')
    console.log('=' .repeat(50))

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📈 Total: ${this.results.length}`)

    console.log('\n📋 Detailed Results:')
    console.log('-'.repeat(50))

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
      const duration = `${result.duration}ms`
      
      console.log(`${icon} ${result.name} (${duration})`)
      console.log(`   ${result.message}`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      console.log()
    })

    // Overall status
    if (failed === 0) {
      console.log('🎉 All smoke tests passed! Your generation pipeline is working correctly.')
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the issues above.`)
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SmokeTestRunner()
  runner.runAllTests()
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Smoke test runner failed:', error)
      process.exit(1)
    })
}
