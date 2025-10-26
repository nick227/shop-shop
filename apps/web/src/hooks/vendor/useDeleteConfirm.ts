/**
 * useDeleteConfirm - Reusable delete with confirmation;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'

export interface UseDeleteConfirmOptions {
  entityName: string;
  invalidateQueries: string[]
  deleteFn: (id: string) => Promise<void>
}

export function useDeleteConfirm({
  entityName,
  invalidateQueries,
  deleteFn}: UseDeleteConfirmOptions) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      for (const queryKey of invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      }
      toast.success('' + entityName + ' deleted successfully!')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error(appError.message)
    }})

  const confirmDelete = (id: string, name: string) => {
    if (window.confirm('Are you sure you want to delete "' + name + '"?')) {
      deleteMutation.mutate(id)
    }
  }

  return {
    confirmDelete,
    isDeleting: deleteMutation.isPending}
}

