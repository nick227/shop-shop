// @ts-nocheck
/**
 * useUpdateOrderStatus - Update order status with optimistic updates;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { toast } from 'sonner'
import { handleApiError } from '@api/errors'
import type { OrderStatus } from '@api/types'

export interface UpdateOrderStatusParams {
  orderId: string;
  status?: string;
  assignedToUserId?: string | null;
  note?: string;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateOrderStatusParams) => {
      return await apiClient.orders().updateOrder({
        id: params.orderId,
        updateOrderRequest: {
          ...(params.status ? { status: params.status as any } : {}),
          ...(params.assignedToUserId !== undefined ? { assignedToUserId: params.assignedToUserId } : {}),
        }})
    },
    onSuccess: (data, variables) => {
      // Invalidate queries;
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-pending-orders-count'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
      
      // Show success toast;
      const statusLabels: Record<string, string> = {
        ACCEPTED: 'Order accepted!',
        PREPARING: 'Started preparing order',
        READY: 'Order marked as ready',
        OUT_FOR_DELIVERY: 'Out for delivery',
        COMPLETED: 'Order delivered!',
        CANCELED: 'Order canceled'}
      
      toast.success(variables.status ? statusLabels[variables.status] || 'Order status updated' : 'Driver assignment updated')
    },
    onError: async (error) => {
      const appError = await handleApiError(error)
      toast.error('Failed to update order: ' + appError.message + '')
    }})
}
