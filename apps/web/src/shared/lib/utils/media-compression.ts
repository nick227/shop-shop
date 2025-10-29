/**
 * Media Compression Utilities;
 * Client-side image optimization before upload;
 */
import imageCompression from 'browser-image-compression'

// Compression settings - single set of optimal defaults;
const COMPRESSION_CONFIG = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.85}

// Minimum compression ratio to show success message;
const MIN_COMPRESSION_RATIO = 10;
export interface CompressionResult {
  file: File;
  savedBytes: number;
  savedPercent: number;
}

/**
 * Compress an image file for optimal upload;
 * Returns original file if compression fails or makes file larger;
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_CONFIG)
    
    // Only use compressed version if it's actually smaller;
    if (compressedFile.size < originalSize) {
      const savedBytes = originalSize - compressedFile.size;
      const savedPercent = Math.round((savedBytes / originalSize) * 100)

      return {
        file: compressedFile,
        savedBytes,
        savedPercent}
    }
    
    // Return original if compression made it larger;
    return {
      file,
      savedBytes: 0,
      savedPercent: 0}
  } catch (error: any) {
    console.error('Image compression failed:', error)
    // Return original file on error;
    return {
      file,
      savedBytes: 0,
      savedPercent: 0}
  }
}

/**
 * Check if file should be compressed;
 */
export function shouldCompressFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Format bytes to human-readable size;
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Check if compression result is worth showing to user;
 */
export function isSignificantCompression(result: CompressionResult): boolean {
  return result.savedPercent >= MIN_COMPRESSION_RATIO;
}

