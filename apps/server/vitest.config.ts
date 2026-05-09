import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
loadEnv({ path: path.join(repoRoot, '.env') })
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://root@localhost:3306/delivery_app'
}

export default defineConfig({
  resolve: {
    alias: {
      '@packages/schemas': path.join(repoRoot, 'packages/schemas/src'),
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
