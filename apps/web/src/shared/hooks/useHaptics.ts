import { useCallback } from 'react'

export function useHaptics() {
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator

  const light = useCallback(() => {
    if (!isSupported) return
    try {
      navigator.vibrate(10)
    } catch {
      // Ignore
    }
  }, [isSupported])

  const heavy = useCallback(() => {
    if (!isSupported) return
    try {
      navigator.vibrate([30, 50, 30])
    } catch {
      // Ignore
    }
  }, [isSupported])

  const success = useCallback(() => {
    if (!isSupported) return
    try {
      navigator.vibrate([10, 30, 20, 30, 40])
    } catch {
      // Ignore
    }
  }, [isSupported])

  const error = useCallback(() => {
    if (!isSupported) return
    try {
      navigator.vibrate([50, 30, 50])
    } catch {
      // Ignore
    }
  }, [isSupported])

  return { light, heavy, success, error, isSupported }
}
