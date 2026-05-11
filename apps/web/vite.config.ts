import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // Load `VITE_*` from monorepo root so PORT / VITE_API_URL stay aligned with apps/server
  envDir: path.resolve(__dirname, '../..'),
  preview: {
    allowedHosts: ['shop-shop.up.railway.app'],
  },
  server: { 
    port: Number(process.env.VITE_PORT) || 5177,
    headers: {
      // Avoid conditional requests returning 304 without a usable module MIME type in some browsers.
      'Cache-Control': 'no-store',
    },
    proxy: {
      // Media routes on the backend are registered at `/media/*` (not `/api/media/*`).
      // The web app calls `/api/media/*` so it is safely proxied (and doesn't hit Vite HTML fallback).
      // Rewrite `/api/media/*` -> `/media/*` at the proxy layer to match the server.
      '/api/media': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/media/, '/media'),
      },
      // Team routes are registered at `/team/*` (not under `/api/*`)
      '/api/team': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/team/, '/team'),
      },
      // River is served at /api/v1/river/* on the API — forward unchanged.
      '/api/v1/river': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
      },
      // All other /api/* (excluding /api/v1/river and /api/search, matched above)
      '^/api(?!/v1/river|/search)': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Search routes - forward unchanged
      '/api/search': {
        target: 'http://localhost:3005',
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
})
