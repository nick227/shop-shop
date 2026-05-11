import { useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { apiClient } from '@api/client'

export interface UseRiverPostActionsOptions {
  readonly storeId?: string
  readonly onOpenComments: (postId: string) => void
}

function invalidateRiverFeeds(
  qc: ReturnType<typeof useQueryClient>,
  storeId: string | undefined,
): void {
  void qc.invalidateQueries({ queryKey: ['river-feed'] })
  if (storeId) {
    void qc.invalidateQueries({ queryKey: ['store-feed', storeId] })
  } else {
    void qc.invalidateQueries({ queryKey: ['store-feed'] })
  }
}

export function useRiverPostActions({ storeId, onOpenComments }: UseRiverPostActionsOptions) {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const redirectToLogin = useCallback(() => {
    navigate('/login', { state: { from: location.pathname + location.search } })
  }, [navigate, location.pathname, location.search])

  const ensureAuthenticated = useCallback((): boolean => {
    if (!isAuthenticated) {
      redirectToLogin()
      return false
    }
    return true
  }, [isAuthenticated, redirectToLogin])

  const invalidate = useCallback(() => {
    invalidateRiverFeeds(queryClient, storeId)
  }, [queryClient, storeId])

  const like = useCallback(
    async (postId: string, currentlyLiked: boolean) => {
      if (!ensureAuthenticated()) return
      if (currentlyLiked) {
        await apiClient.river.unlikePost(postId)
      } else {
        await apiClient.river.likePost(postId)
      }
      invalidate()
    },
    [ensureAuthenticated, invalidate],
  )

  const save = useCallback(
    async (postId: string, currentlySaved: boolean) => {
      if (!ensureAuthenticated()) return
      if (currentlySaved) {
        await apiClient.river.unsavePost(postId)
      } else {
        await apiClient.river.savePost(postId)
      }
      invalidate()
    },
    [ensureAuthenticated, invalidate],
  )

  const comment = useCallback(
    (postId: string) => {
      if (!ensureAuthenticated()) return
      onOpenComments(postId)
    },
    [ensureAuthenticated, onOpenComments],
  )

  const share = useCallback(
    async (postId: string) => {
      const url = `${window.location.origin}/river?post=${encodeURIComponent(postId)}`
      let delivered = false

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'Shop River', url })
          delivered = true
        } catch (e) {
          const name = e instanceof Error ? e.name : ''
          if (name === 'AbortError') {
            return
          }
        }
      }

      if (
        !delivered &&
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard?.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(url)
          delivered = true
        } catch {
          // non-secure context or permission denied
        }
      }

      if (!delivered) {
        return
      }

      try {
        await apiClient.river.recordShare(postId)
      } catch {
        // count may drift; still refresh lists
      }
      invalidate()
    },
    [invalidate],
  )

  return useMemo(
    () => ({
      like,
      save,
      comment,
      share,
      isAuthenticated,
      redirectToLogin,
      ensureAuthenticated,
    }),
    [
      like,
      save,
      comment,
      share,
      isAuthenticated,
      redirectToLogin,
      ensureAuthenticated,
    ],
  )
}
