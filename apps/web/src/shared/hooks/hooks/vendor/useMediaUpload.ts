/**
 * useMediaUpload - Upload media files for stores or items;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { MediaApiResponse } from '@api/types'
import { authPost } from '@shared/lib/auth/authFetch'

interface UploadMediaInput {
  file: File;
  storeId?: string;
  itemId?: string;
  altText?: string;
  sortIndex?: number;
}

export function useMediaUpload() {
  const queryClient = useQueryClient()

  return useMutation<MediaApiResponse, Error, UploadMediaInput>({
    mutationFn: async (input: UploadMediaInput): Promise<MediaApiResponse> => {
      const formData = new FormData()
      formData.append('file', input.file)
      
      if (input.storeId) {
        formData.append('storeId', input.storeId)
      }
      
      if (input.itemId) {
        formData.append('itemId', input.itemId)
      }
      
      if (input.altText) {
        formData.append('altText', input.altText)
      }
      
      if (input.sortIndex !== undefined) {
        formData.append('sortIndex', input.sortIndex.toString())
      }

      // Upload via authFetch since SDK doesn't handle multipart/form-data well;
      const response = await authPost('/api/media/upload', formData)

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Upload failed')
      }

      return response.json() as Promise<MediaApiResponse>
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['media', 'list'] })
      toast.success('Media uploaded successfully')
    },
    onError: (error) => {
      toast.error((error as any) instanceof Error && error !== undefined ? error.message : 'Upload failed')
    }})
}
