/**
 * useMediaDelete - Delete a media file;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authDelete } from '@shared/lib/auth/authFetch'

interface DeleteMediaInput {
  mediaId: string;
  storeId?: string;
  itemId?: string;
}

export function useMediaDelete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId }: DeleteMediaInput) => {
      const response = await authDelete(`/api/media/${mediaId}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(error.error || 'Delete failed')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] })
      toast.success('Media deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete media')
    }})
}
