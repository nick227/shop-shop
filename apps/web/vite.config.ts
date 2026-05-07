import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // Load `VITE_*` from monorepo root so PORT / VITE_API_URL stay aligned with apps/server
  envDir: path.resolve(__dirname, '../..'),
  server: { 
    port: Number(process.env.VITE_PORT) || 5177,
    headers: {
      // Avoid conditional requests returning 304 without a usable module MIME type in some browsers.
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      }
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
      '@packages/sdk': path.resolve(__dirname, '../../packages/sdk/dist'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/dist'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@packages/sdk'],
    exclude: ['@packages/sdk/dist'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    chunkSizeWarningLimit: 1100,
  },
})
