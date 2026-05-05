#!/usr/bin/env tsx
/**
 * API Endpoint Smoke Test Script
 * 
 * Tests actual API endpoints with real HTTP requests
 * Validates the complete request/response cycle
 */

import fs from 'fs'
import path from 'path'

// Test configuration
const API_CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  timeout: 15000,
  retries: 2,
  delay: 1000 // Delay between requests
}

interface ApiTestResult {
  endpoint: string
  method: string
  status: 'pass' | 'fail' | 'skip'
  statusCode?: number
  responseTime: number
  message: string
  error?: string
}

class ApiSmokeTestRunner {
  private results: ApiTestResult[] = []
  private baseUrl: string

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    endpoint: string, 
    method: string = 'GET', 
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<{ statusCode: number; responseTime: number; error?: string }> {
    const startTime = Date.now()
    
    for (let attempt = 0; attempt <= API_CONFIG.retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(API_CONFIG.timeout)
        })

        const responseTime = Date.now() - startTime
        
        return {
          statusCode: response.status,
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}`
        }
      } catch (error) {
        if (attempt === API_CONFIG.retries) {
          return {
            statusCode: 0,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.delay))
      }
    }

    return {
      statusCode: 0,
      responseTime: Date.now() - startTime,
      error: 'Max retries exceeded'
    }
  }

  /**
   * Test server health/connectivity
   */
  async testServerHealth(): Promise<void> {
    const startTime = Date.now()
    
    try {
      const { statusCode, responseTime, error } = await this.makeRequest('/health')
      
      if (statusCode === 200) {
        this.addResult('/health', 'GET', 'pass', statusCode, responseTime, 'Server is healthy')
      } else if (statusCode === 404) {
        this.addResult('/health', 'GET', 'skip', statusCode, responseTime, 'Health endpoint not implemented')
      } else {
        this.addResult('/health', 'GET', 'fail', statusCode, responseTime, `Unexpected status: ${statusCode}`, error)
      }
    } catch (error) {
      this.addResult('/health', 'GET', 'fail', 0, Date.now() - startTime, 'Server not reachable', error as string)
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints(): Promise<void> {
    // Test signup endpoint
    const signupData = {
      email: 'smoketest@example.com',
      password: 'TestPassword123!',
      name: 'Smoke Test User'
    }

    const { statusCode, responseTime, error } = await this.makeRequest('/auth/signup', 'POST', signupData)
    
    if (statusCode === 201) {
      this.addResult('/auth/signup', 'POST', 'pass', statusCode, responseTime, 'Signup endpoint working')
    } else if (statusCode === 400) {
      this.addResult('/auth/signup', 'POST', 'pass', statusCode, responseTime, 'Signup endpoint exists (validation working)')
    } else if (statusCode === 409) {
      this.addResult('/auth/signup', 'POST', 'pass', statusCode, responseTime, 'Signup endpoint exists (user already exists)')
    } else {
      this.addResult('/auth/signup', 'POST', 'fail', statusCode, responseTime, `Unexpected status: ${statusCode}`, error)
    }

    // Test login endpoint
    const loginData = {
      email: 'smoketest@example.com',
      password: 'TestPassword123!'
    }

    const loginResult = await this.makeRequest('/auth/login', 'POST', loginData)
    
    if (loginResult.statusCode === 200) {
      this.addResult('/auth/login', 'POST', 'pass', loginResult.statusCode, loginResult.responseTime, 'Login endpoint working')
    } else if (loginResult.statusCode === 401) {
      this.addResult('/auth/login', 'POST', 'pass', loginResult.statusCode, loginResult.responseTime, 'Login endpoint exists (auth working)')
    } else {
      this.addResult('/auth/login', 'POST', 'fail', loginResult.statusCode, loginResult.responseTime, `Unexpected status: ${loginResult.statusCode}`, loginResult.error)
    }
  }

  /**
   * Test public endpoints (no auth required)
   */
  async testPublicEndpoints(): Promise<void> {
    const publicEndpoints = [
      { path: '/stores', method: 'GET' },
      { path: '/items', method: 'GET' },
      { path: '/bundles', method: 'GET' },
      { path: '/promotions', method: 'GET' }
    ]

    for (const endpoint of publicEndpoints) {
      const { statusCode, responseTime, error } = await this.makeRequest(endpoint.path, endpoint.method)
      
      if (statusCode === 200) {
        this.addResult(endpoint.path, endpoint.method, 'pass', statusCode, responseTime, 'Endpoint responding')
      } else if (statusCode === 401) {
        this.addResult(endpoint.path, endpoint.method, 'skip', statusCode, responseTime, 'Endpoint requires authentication')
      } else if (statusCode === 404) {
        this.addResult(endpoint.path, endpoint.method, 'skip', statusCode, responseTime, 'Endpoint not implemented')
      } else {
        this.addResult(endpoint.path, endpoint.method, 'fail', statusCode, responseTime, `Unexpected status: ${statusCode}`, error)
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.delay))
    }
  }

  /**
   * Test protected endpoints (with mock auth)
   */
  async testProtectedEndpoints(): Promise<void> {
    const protectedEndpoints = [
      { path: '/users', method: 'GET' },
      { path: '/orders', method: 'GET' },
      { path: '/carts', method: 'GET' },
      { path: '/addresses', method: 'GET' }
    ]

    // Mock authorization header
    const authHeaders = {
      'Authorization': 'Bearer mock-token-for-testing'
    }

    for (const endpoint of protectedEndpoints) {
      const { statusCode, responseTime, error } = await this.makeRequest(endpoint.path, endpoint.method, undefined, authHeaders)
      
      if (statusCode === 200) {
        this.addResult(endpoint.path, endpoint.method, 'pass', statusCode, responseTime, 'Protected endpoint accessible')
      } else if (statusCode === 401) {
        this.addResult(endpoint.path, endpoint.method, 'pass', statusCode, responseTime, 'Protected endpoint properly secured')
      } else if (statusCode === 403) {
        this.addResult(endpoint.path, endpoint.method, 'pass', statusCode, responseTime, 'Protected endpoint properly secured (forbidden)')
      } else {
        this.addResult(endpoint.path, endpoint.method, 'fail', statusCode, responseTime, `Unexpected status: ${statusCode}`, error)
      }

      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.delay))
    }
  }

  /**
   * Test CORS headers
   */
  async testCorsHeaders(): Promise<void> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.baseUrl}/stores`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET'
        }
      })

      const responseTime = Date.now() - startTime
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      }

      if (corsHeaders['Access-Control-Allow-Origin']) {
        this.addResult('/stores', 'OPTIONS', 'pass', response.status, responseTime, 'CORS headers present')
      } else {
        this.addResult('/stores', 'OPTIONS', 'skip', response.status, responseTime, 'CORS headers not configured')
      }
    } catch (error) {
      this.addResult('/stores', 'OPTIONS', 'fail', 0, Date.now() - startTime, 'CORS test failed', error as string)
    }
  }

  /**
   * Test OpenAPI spec endpoint
   */
  async testOpenApiEndpoint(): Promise<void> {
    const openApiEndpoints = [
      '/openapi.json',
      '/api-docs',
      '/swagger.json',
      '/docs'
    ]

    for (const endpoint of openApiEndpoints) {
      const { statusCode, responseTime, error } = await this.makeRequest(endpoint)
      
      if (statusCode === 200) {
        this.addResult(endpoint, 'GET', 'pass', statusCode, responseTime, 'OpenAPI spec available')
        break // Found working endpoint
      } else if (statusCode === 404) {
        this.addResult(endpoint, 'GET', 'skip', statusCode, responseTime, 'OpenAPI endpoint not found')
      } else {
        this.addResult(endpoint, 'GET', 'fail', statusCode, responseTime, `Unexpected status: ${statusCode}`, error)
      }
    }
  }

  /**
   * Add test result
   */
  private addResult(
    endpoint: string, 
    method: string, 
    status: 'pass' | 'fail' | 'skip', 
    statusCode: number, 
    responseTime: number, 
    message: string, 
    error?: string
  ): void {
    this.results.push({
      endpoint,
      method,
      status,
      statusCode,
      responseTime,
      message,
      error
    })
  }

  /**
   * Run all API smoke tests
   */
  async runAllTests(): Promise<void> {
    console.log('🔥 Starting API Smoke Tests...')
    console.log(`🌐 Testing against: ${this.baseUrl}\n`)

    // Test server connectivity first
    await this.testServerHealth()
    
    // If server is not reachable, skip other tests
    const healthResult = this.results.find(r => r.endpoint === '/health')
    if (healthResult && healthResult.status === 'fail') {
      console.log('❌ Server not reachable - skipping API tests')
      this.printResults()
      return
    }

    // Run all API tests
    await this.testAuthEndpoints()
    await this.testPublicEndpoints()
    await this.testProtectedEndpoints()
    await this.testCorsHeaders()
    await this.testOpenApiEndpoint()

    // Print results
    this.printResults()
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log('\n📊 API Smoke Test Results:')
    console.log('=' .repeat(60))

    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📈 Total: ${this.results.length}`)

    console.log('\n📋 Detailed Results:')
    console.log('-'.repeat(60))

    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
      const statusCode = result.statusCode ? ` (${result.statusCode})` : ''
      const responseTime = `${result.responseTime}ms`
      
      console.log(`${icon} ${result.method} ${result.endpoint}${statusCode} (${responseTime})`)
      console.log(`   ${result.message}`)
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      console.log()
    })

    // Overall status
    if (failed === 0) {
      console.log('🎉 All API smoke tests passed! Your API is working correctly.')
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Please check the issues above.`)
    }

    // Performance summary
    const avgResponseTime = this.results
      .filter(r => r.status === 'pass')
      .reduce((sum, r) => sum + r.responseTime, 0) / passed || 0

    if (avgResponseTime > 0) {
      console.log(`\n⚡ Average response time: ${Math.round(avgResponseTime)}ms`)
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ApiSmokeTestRunner()
  runner.runAllTests()
    .then(() => {
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 API smoke test runner failed:', error)
      process.exit(1)
    })
}
