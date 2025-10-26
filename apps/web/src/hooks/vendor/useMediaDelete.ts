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
      await apiClient.medias().deleteMedia({ id: mediaId })
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

