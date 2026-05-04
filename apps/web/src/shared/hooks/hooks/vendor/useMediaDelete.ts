/**
 * useMediaDelete - Delete a media file;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005'

      const response = await fetch(apiUrl + '/media/' + mediaId, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token + '' } : {}),
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
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
