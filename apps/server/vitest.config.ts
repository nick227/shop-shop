import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  // Directory aliases so subpaths work (e.g. @packages/schemas/core, @packages/db/generated/client)
  resolve: {
    alias: {
      '@packages/db': path.join(repoRoot, 'packages/db/src'),
      // Directory (not `index.ts`) so subpaths like `@packages/schemas/core` resolve
      '@packages/schemas': path.join(repoRoot, 'packages/schemas/src'),
      /** Vitest only: barrel `@packages/schemas` drops some named exports; route imports this file */
      '@packages/schemas-river-dto': path.join(
        repoRoot,
        'packages/schemas/src/dtos/river.dto.ts',
      ),
      '@packages/sdk': path.join(repoRoot, 'packages/sdk/src'),
      '@packages/domain': path.join(repoRoot, 'packages/domain/src'),
      '@packages/realtime': path.join(repoRoot, 'packages/realtime/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**'],
  },
})

