import { useState, useEffect } from 'react'
import type { MediaItem } from '../api/types'

/**
 * Reusable hook for detecting and parsing media URLs from text
 * Supports: YouTube, images, and general URLs
 */

interface DetectionOptions {
  autoDetect?: boolean
  debounceMs?: number
}

interface MediaDetectionResult {
  detectedMedia: MediaItem[]
  addMedia: (item: MediaItem) => void
  removeMedia: (index: number) => void
  clearMedia: () => void
  setMedia: (items: MediaItem[]) => void
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
]

// Image URL patterns
const IMAGE_PATTERNS = [
  /https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg|bmp|ico)(?:\?.*)?$/i,
]

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }
  return null
}

/**
 * Check if URL is an image
 */
function isImageUrl(url: string): boolean {
  return IMAGE_PATTERNS.some(pattern => pattern.test(url))
}

/**
 * Detect media from text content
 */
function detectMediaFromText(text: string): MediaItem[] {
  const detected: MediaItem[] = []
  const seenUrls = new Set<string>() // Deduplicate URLs
  
  // Extract URLs from text
  const urlPattern = /(https?:\/\/\S+)/g
  const urls = text.match(urlPattern) || []
  
  for (let url of urls) {
    // Clean URL (remove leading/trailing punctuation and wrappers)
    url = url.replace(/^["'(<[\]]+|[!"'),.:;>?\]]+$/g, '')
    
    // Skip duplicates
    if (seenUrls.has(url)) continue
    seenUrls.add(url)
    
    // Check for YouTube
    const youtubeId = extractYouTubeId(url)
    if (youtubeId) {
      detected.push({
        type: 'youtube',
        url: url,
        thumbnail: 'https://img.youtube.com/vi/' + youtubeId + '/hqdefault.jpg' // Use hqdefault (more reliable)
      } as MediaItem)
      continue
    }
    
    // Check for images
    if (isImageUrl(url)) {
      detected.push({
        type: 'image',
        url: url,
        thumbnail: url,
      } as MediaItem)
      continue
    }
  }
  
  return detected
}

/**
 * Hook for detecting media URLs in text
 */
export function useMediaDetection(
  text: string,
  options: DetectionOptions = {}
): MediaDetectionResult {
  const { autoDetect = true, debounceMs = 500 } = options
  
  const [detectedMedia, setDetectedMedia] = useState<MediaItem[]>([])
  const [userRemovedUrls, setUserRemovedUrls] = useState<Set<string>>(new Set())
  
  useEffect(() => {
    if (!autoDetect) return
    
    const timer = setTimeout(() => {
      const detected = detectMediaFromText(text)
      
      // Filter out URLs that user explicitly removed
      setDetectedMedia(prev => {
        const filtered = detected.filter(d => !userRemovedUrls.has(d.url))
        
        // Keep manually added items that aren't in detected
        const manualItems = prev.filter(p => !filtered.some(f => f.url === p.url))
        
        return [...manualItems, ...filtered]
      })
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [text, autoDetect, debounceMs, userRemovedUrls])
  
  const addMedia = (item: MediaItem) => {
    setDetectedMedia(prev => [...prev, item])
  }
  
  const removeMedia = (index: number) => {
    setDetectedMedia(prev => {
      const item = prev[index]
      if (item?.url) {
        // Track removed URL so it doesn't re-appear
        setUserRemovedUrls(s => new Set(s).add(item.url))
      }
      return prev.filter((_, i) => i !== index)
    })
  }
  
  const clearMedia = () => {
    setDetectedMedia([])
    setUserRemovedUrls(new Set()) // Reset removed tracking
  }
  
  return {
    detectedMedia,
    addMedia,
    removeMedia,
    clearMedia,
    setMedia: setDetectedMedia,
  }
}

/**
 * Utility: Get YouTube embed URL
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  return 'https://www.youtube.com/embed/' + videoId + ''
}

/**
 * Utility: Get YouTube thumbnail
 */
export function getYouTubeThumbnail(url: string, quality: 'default' | 'hq' | 'maxres' = 'maxres'): string | null {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  
  const qualityMap = {
    default: 'default',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  }
  
  return 'https://img.youtube.com/vi/${videoId}/' + qualityMap[quality] + '.jpg'
}

