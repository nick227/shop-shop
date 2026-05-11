import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',  // Exclude Playwright E2E tests from Vitest
      'tests/**', // Exclude Playwright specs under apps/web/tests
      '**/.{idea,git,cache,output,temp}/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'e2e/**',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/**'
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@features': path.resolve(__dirname, './src/features'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@api': path.resolve(__dirname, './src/api'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@components': path.resolve(__dirname, './src/components'),
      '@packages/realtime': path.resolve(__dirname, '../../packages/realtime/src'),
      '@packages/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@packages/sdk': path.resolve(__dirname, '../../packages/sdk/dist/src'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/dist'),
    },
  },
})
