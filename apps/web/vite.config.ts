import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

const repoRoot = path.resolve(__dirname, '../..')

export default defineConfig(({ mode }) => {
  // Root `.env` `PORT` is what @apps/server listens on; proxy must match or you get ECONNREFUSED.
  const env = loadEnv(mode, repoRoot, '')
  const apiPort = env.PORT || '3005'
  const apiTarget = `http://127.0.0.1:${apiPort}`

  return {
    plugins: [react()],
  // Load `VITE_*` from monorepo root so PORT / VITE_API_URL stay aligned with apps/server
  envDir: repoRoot,
  preview: {
    allowedHosts: ['shop-shop.up.railway.app'],
  },
  server: { 
    port: Number(env.VITE_PORT) || 5177,
    headers: {
      // Avoid conditional requests returning 304 without a usable module MIME type in some browsers.
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/geocode': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/api/media': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/api/team': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      // River is served at /api/v1/river/* on the API — forward unchanged.
      '/api/v1/river': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      // All other /api/* routes are registered on the API with the `/api` prefix.
      '^/api(?!/v1/river|/search)': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      // Search routes - forward unchanged
      '/api/search': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    }
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
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // Alias `@packages/sdk` → compiled SDK entry (matches packages/sdk package.json after tsc emit).
    include: ['@packages/sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    chunkSizeWarningLimit: 1100,
  },
  }
})
