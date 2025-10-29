/**
 * useImageLoader Hook;
 * Manages image loading state and error handling;
 */
import { useState, useCallback, useEffect } from 'react'

export interface UseImageLoaderReturn {
  loading: boolean;
  error: boolean;
  handleLoad: () => void;
  handleError: () => void;
}

export function useImageLoader(src: string): UseImageLoaderReturn {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Reset state when src changes;
  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [src])

  const handleLoad = useCallback(() => {
    setLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setLoading(false)
    setError(true)
  }, [])

  return { loading, error, handleLoad, handleError }
}

