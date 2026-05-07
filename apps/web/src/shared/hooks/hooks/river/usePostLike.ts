import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'

interface LikePostParams {
  postId: string;
}

/**
 * Direct API call for liking a post;
 * TODO: Add to OpenAPI spec and regenerate SDK;
 */
async function likePostAPI(postId: string): Promise<void> {
  const token = useAuthStore.getState().token
  const response = await fetch('http://localhost:3000/river/posts/' + postId + '/like', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token + '',
      'Content-Type': 'application/json'}})
  
  if (!response.ok) {
    throw new Error('Failed to like post')
  }
}

/**
 * Direct API call for unliking a post;
 * TODO: Add to OpenAPI spec and regenerate SDK;
 */
async function unlikePostAPI(postId: string): Promise<void> {
  const token = useAuthStore.getState().token
  const response = await fetch('http://localhost:3000/river/posts/' + postId + '/like', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token + ''}})
  
  if (!response.ok) {
    throw new Error('Failed to unlike post')
  }
}

/**
 * Hook for liking a post;
 */
export function useLikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId }: LikePostParams) => {
      await likePostAPI(postId)
    },
    onSuccess: () => {
      // Invalidate posts query to refetch with updated like status;
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }})
}

/**
 * Hook for unliking a post;
 */
export function useUnlikePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId }: LikePostParams) => {
      await unlikePostAPI(postId)
    },
    onSuccess: () => {
      // Invalidate posts query to refetch with updated like status;
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }})
}

/**
 * Unified hook for toggling post likes;
 */
export function useTogglePostLike() {
  const likeMutation = useLikePost()
  const unlikeMutation = useUnlikePost()

  return {
    toggleLike: (postId: string, isLiked: boolean) => {
      return isLiked ? unlikeMutation.mutate({ postId }) : likeMutation.mutate({ postId });
    },
    isLoading: likeMutation.isPending || unlikeMutation.isPending}
}

