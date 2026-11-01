import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  resolve: { alias: {
    '@packages/db': path.resolve('packages/db/src'),
    '@packages/schemas': path.resolve('packages/schemas/src'),
    '@packages/domain': path.resolve('packages/domain/src'),
    '@packages/realtime': path.resolve('packages/realtime/src'),
  } },
  test: { environment: 'node', include: ['tests/vendor-access.runtime.test.ts'], testTimeout: 30000, hookTimeout: 30000 },
})
