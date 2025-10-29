/**
 * Posts Hooks - Custom Implementation
 * Since posts API is not available in the SDK, we provide custom hooks
 * that return mock data for now.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostResponse } from '@api/types'

// Mock posts data - replace with actual API calls when available
const mockPosts: PostResponse[] = [
  {
    id: '1',
    content: 'Check out our new menu items! 🍕',
    storeId: 'store1',
    mediaUrls: {},
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    content: 'Fresh ingredients delivered daily! 🥬',
    storeId: 'store1',
    mediaUrls: {},
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 86_400_000).toISOString()
  }
]

export interface UsePostsParams {
  storeId?: string
}

export interface CreatePostParams {
  storeId: string
  content: string
  mediaUrls?: string[]
}

/**
 * Fetch posts for a store
 */
export const usePosts = (params?: UsePostsParams) => {
  return useQuery({
    queryKey: ['posts', params?.storeId],
    queryFn: async (): Promise<PostResponse[]> => {
      // Mock implementation - filter by storeId if provided
      if (params?.storeId) {
        return mockPosts.filter(post => post.storeId === params.storeId)
      }
      return mockPosts
    },
    enabled: !!params?.storeId
  })
}

/**
 * Create a new post
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (params: CreatePostParams): Promise<PostResponse> => {
      // Mock implementation - create a new post
      const newPost: PostResponse = {
        id: Date.now().toString(),
        content: params.content,
        storeId: params.storeId,
        mediaUrls: params.mediaUrls ? Object.fromEntries(params.mediaUrls.map((url, index) => [index.toString(), url])) : {},
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // In a real implementation, this would make an API call
      // For now, we'll just return the mock post
      return new Promise(resolve => {
        setTimeout(() => resolve(newPost), 1000)
      })
    },
    onSuccess: (data) => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    }
  })
}
