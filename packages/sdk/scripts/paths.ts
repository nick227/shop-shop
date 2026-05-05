/**
 * Centralized Path Constants
 * 
 * Single source of truth for all file paths used by generators
 * Makes it easy to adapt to project structure changes
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Root directories
const SDK_ROOT = path.resolve(__dirname, '..')
const WEB_ROOT = path.resolve(SDK_ROOT, '../../apps/web')
const PACKAGES_ROOT = path.resolve(SDK_ROOT, '..')

/**
 * Centralized path configuration
 */
export const PATHS = {
  // SDK package paths
  sdk: {
    root: SDK_ROOT,
    scripts: path.join(SDK_ROOT, 'scripts'),
    src: path.join(SDK_ROOT, 'src'),
    generated: path.join(SDK_ROOT, 'generated'),
  },
  
  // Generated SDK files (raw OpenAPI output)
  generatedSdk: {
    root: path.join(SDK_ROOT, 'generated/sdk'),
    apis: path.join(SDK_ROOT, 'generated/sdk/apis'),
    models: path.join(SDK_ROOT, 'generated/sdk/models'),
    runtime: path.join(SDK_ROOT, 'generated/sdk/runtime'),
  },
  
  // Generated frontend files
  generatedFrontend: {
    root: path.join(SDK_ROOT, 'generated/frontend'),
    api: path.join(SDK_ROOT, 'generated/frontend/api'),
    types: path.join(SDK_ROOT, 'generated/frontend/types'),
    hooks: path.join(SDK_ROOT, 'generated/frontend/hooks'),
  },
  
  // Generated scripts/config
  generatedScripts: {
    root: path.join(SDK_ROOT, 'generated/scripts'),
  },
  
  // Web app paths
  web: {
    root: WEB_ROOT,
    src: path.join(WEB_ROOT, 'src'),
    api: path.join(WEB_ROOT, 'src/api'),
    hooks: path.join(WEB_ROOT, 'src/hooks'),
    components: path.join(WEB_ROOT, 'src/components'),
    features: path.join(WEB_ROOT, 'src/features'),
  },
  
  // Packages root
  packages: {
    root: PACKAGES_ROOT,
  },
} as const

/**
 * Helper to resolve paths relative to script directory
 */
export function resolveFromScripts(...segments: string[]): string {
  return path.resolve(PATHS.sdk.scripts, ...segments)
}

/**
 * Helper to resolve paths relative to web src directory
 */
export function resolveFromWebSrc(...segments: string[]): string {
  return path.resolve(PATHS.web.src, ...segments)
}

/**
 * Helper to resolve paths relative to generated SDK directory
 */
export function resolveFromGeneratedSdk(...segments: string[]): string {
  return path.resolve(PATHS.generatedSdk.root, ...segments)
}

/**
 * Helper to resolve paths relative to generated frontend directory
 */
export function resolveFromGeneratedFrontend(...segments: string[]): string {
  return path.resolve(PATHS.generatedFrontend.root, ...segments)
}

/**
 * Helper to resolve paths relative to generated scripts directory
 */
export function resolveFromGeneratedScripts(...segments: string[]): string {
  return path.resolve(PATHS.generatedScripts.root, ...segments)
}

