/**
 * useMediaUpload - Upload media files for stores or items;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { MediaResponse } from '@api/types'

interface UploadMediaInput {
  file: File;
  storeId?: string;
  itemId?: string;
  altText?: string;
  sortIndex?: number;
}

export function useMediaUpload() {
  const queryClient = useQueryClient()

  return useMutation<MediaResponse, Error, UploadMediaInput>({
    mutationFn: async (input: UploadMediaInput) => {
      const formData = new FormData()
      formData['append']('file', input.file)
      
      if (input.storeId) {
        formData['append']('storeId', input.storeId)
      }
      
      if (input.itemId) {
        formData['append']('itemId', input.itemId)
      }
      
      if (input.altText) {
        formData['append']('altText', input.altText)
      }
      
      if (input.sortIndex !== undefined) {
        formData['append']('sortIndex', input.sortIndex.toString())
      }

      // Upload via fetch since SDK doesn't handle multipart/form-data well;
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005'
      
      const response = await fetch('' + apiUrl + '/media/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token + '' } : {})},
        body: formData})

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate media lists;
      if (variables.storeId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'store', variables.storeId] })
      }
      if (variables.itemId) {
        queryClient.invalidateQueries({ queryKey: ['media', 'item', variables.itemId] })
      }
      toast.success('Media uploaded successfully')
    },
    onError: (error) => {
      toast.error((error as any) instanceof Error && error !== null ? error.message : 'Upload failed')
    }})
}

