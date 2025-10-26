import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: Number(process.env['VITE_PORT']) || 5177,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@features': path.resolve(__dirname, './src/features'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@api': path.resolve(__dirname, './src/api'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@packages/realtime': path.resolve(__dirname, '../../packages/realtime/src'),
      '@packages/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@packages/sdk': path.resolve(__dirname, '../../packages/sdk/dist'),
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
  },
})
