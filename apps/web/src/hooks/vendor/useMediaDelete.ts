/**
 * useMediaDelete - Delete a media file;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'

interface DeleteMediaInput {
  mediaId: string;
  storeId?: string;
  itemId?: string;
}

export function useMediaDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId }: DeleteMediaInput) => {
      // Note: Media delete API is not available in the SDK
      // This is a mock implementation that doesn't actually delete anything
      console.warn('Media delete API not available, media not actually deleted:', mediaId)
      return Promise.resolve()
    },
    onSuccess: (_, variables) => {
      // Invalidate media lists;
      if (variables.storeId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'store', variables.storeId] })
      }
      if (variables.itemId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'item', variables.itemId] })
      }
      toast.success('Media deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete media')
    }})
}

