// ========================================
// Storage Adapter Interface
// Abstract interface for file storage (R2, S3, local, etc.)
// ========================================

import { LocalStorageAdapter } from './storage-local.adapter.js'

export interface StorageAdapter {
  upload(file: UploadFile): Promise<UploadResult>
  delete(key: string): Promise<void>
  getUrl(key: string): Promise<string>
  exists(key: string): Promise<boolean>
}

export interface UploadFile {
  filename: string
  mimetype: string
  buffer: Buffer
  size: number
  folder?: string // Optional folder/prefix (e.g., 'stores', 'items')
}

export interface UploadResult {
  key: string       // Storage key (e.g., 'stores/abc123.jpg')
  url: string       // Public URL
  size: number      // File size in bytes
  mimetype: string  // MIME type
}

// ========================================
// Storage Factory
// Returns configured storage adapter
// ========================================

let storageInstance: StorageAdapter | null = null
let initPromise: Promise<StorageAdapter> | null = null

/** R2 adapter is loaded with dynamic import() so CJS consumers never require() an ESM subgraph. */
export const getStorageAdapter = async (): Promise<StorageAdapter> => {
  if (storageInstance) {
    return storageInstance
  }
  if (initPromise) {
    return initPromise
  }

  const storageType = process.env.STORAGE_TYPE || 'local'

  initPromise = (async (): Promise<StorageAdapter> => {
    switch (storageType) {
      case 'r2':
      case 's3': {
        const { R2StorageAdapter } = await import('./storage-r2.adapter.js')
        storageInstance = new R2StorageAdapter()
        break
      }
      case 'local':
      default:
        storageInstance = new LocalStorageAdapter()
        break
    }
    if (!storageInstance) {
      throw new Error('Failed to initialize storage adapter')
    }
    return storageInstance
  })()

  return initPromise
}

// ========================================
// File Validation
// ========================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024  // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024  // 50MB

export interface ValidationResult {
  valid: boolean
  error?: string
}

export const validateImageFile = (mimetype: string, size: number): ValidationResult => {
  if (!ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    }
  }

  if (size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

export const validateVideoFile = (mimetype: string, size: number): ValidationResult => {
  if (!ALLOWED_VIDEO_TYPES.includes(mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
    }
  }

  if (size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

export const validateMediaFile = (mimetype: string, size: number): ValidationResult => {
  // Try image validation first
  const imageValidation = validateImageFile(mimetype, size)
  if (imageValidation.valid) {
    return imageValidation
  }

  // Try video validation
  const videoValidation = validateVideoFile(mimetype, size)
  if (videoValidation.valid) {
    return videoValidation
  }

  return {
    valid: false,
    error: 'Invalid file type. Must be image or video.',
  }
}

