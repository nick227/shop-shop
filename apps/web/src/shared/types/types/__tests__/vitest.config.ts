/**
 * Vitest Configuration for Type System Tests
 * Optimized for type testing and SDK integration
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.test.{ts,tsx}',
      '**/__tests__/**/*.spec.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    
    // Test timeout
    testTimeout: 10_000,
    
    // Setup files
    setupFiles: ['./src/types/__tests__/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        '../**/*.{ts,tsx}'
      ],
      exclude: [
        '../**/*.test.{ts,tsx}',
        '../**/*.spec.{ts,tsx}',
        '../**/__tests__/**',
        '../**/node_modules/**',
        '../**/dist/**',
        '../**/build/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    
    // Reporter configuration
    reporters: ['text']
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@api/types': resolve(__dirname, '../api/types'),
      '@packages/sdk': resolve(__dirname, '../../../../packages/sdk/src'),
      '@': resolve(__dirname, '../../')
    }
  },
  
  // Define configuration
  define: {
    'import.meta.vitest': 'undefined'
  }
})