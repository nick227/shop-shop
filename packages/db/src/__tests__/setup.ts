import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.NODE_ENV = 'test'

// Global test setup
beforeAll(async () => {
  // Setup runs once before all tests
  // In a real setup, you might initialize a test database here
})

afterAll(async () => {
  // Cleanup runs once after all tests
  // Close connections, clean up resources
})

beforeEach(async () => {
  // Runs before each test
  // Reset mocks, clear data, etc.
})

afterEach(async () => {
  // Runs after each test
  // Clean up per-test state
})

