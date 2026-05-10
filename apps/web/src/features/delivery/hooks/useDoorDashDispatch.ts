import { useState, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@stores/authStore'
import { toast } from 'sonner'
import type { OrderResponse } from '@api/types'

export interface DoorDashDispatchRequest {
  orderId: string
  storeId: string
  dropoffLatitude: number
  dropoffLongitude: number
}

export interface DoorDashDispatchResponse {
  success: boolean
  deliveryJobId: string
  providerExternalId: string
  trackingUrl: string
  providerStatus: string
  error?: string
}

export interface DeliveryJobStatus {
  deliveryJobId: string
  provider: string
  status: string
  providerExternalId: string
  trackingUrl: string
  providerStatus: string
  createdAt: string
  updatedAt: string
}

export function useDoorDashDispatch() {
  const token = useAuthStore((state) => state.token)
  const [isDispatching, setIsDispatching] = useState(false)

  // Dispatch DoorDash delivery
  const dispatchMutation = useMutation({
    mutationFn: async (request: DoorDashDispatchRequest): Promise<DoorDashDispatchResponse> => {
      const response = await fetch('/api/delivery/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to dispatch: ${response.status}`)
      }

      return await response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('DoorDash driver dispatched successfully!')
        console.log('DoorDash dispatched:', {
          deliveryJobId: data.deliveryJobId,
          providerExternalId: data.providerExternalId,
          trackingUrl: data.trackingUrl
        })
      } else {
        toast.error(data.error || 'Failed to dispatch DoorDash driver')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to dispatch DoorDash driver')
    },
    onSettled: () => {
      setIsDispatching(false)
    }
  })

  // Get delivery job status
  const getDeliveryJobStatus = useCallback(async (orderId: string): Promise<DeliveryJobStatus | null> => {
    if (!token) return null

    try {
      const response = await fetch(`/api/delivery/jobs/order/${orderId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.deliveryJob || null
    } catch (error) {
      console.error('Failed to get delivery job status:', error)
      return null
    }
  }, [token])

  // Cancel DoorDash delivery
  const cancelMutation = useMutation({
    mutationFn: async (deliveryJobId: string): Promise<{ success: boolean; error?: string }> => {
      const response = await fetch(`/api/delivery/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ deliveryJobId }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to cancel: ${response.status}`)
      }

      return await response.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('DoorDash delivery cancelled successfully')
      } else {
        toast.error(data.error || 'Failed to cancel DoorDash delivery')
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel DoorDash delivery')
    }
  })

  const dispatchDoorDash = useCallback((request: DoorDashDispatchRequest) => {
    setIsDispatching(true)
    dispatchMutation.mutate(request)
  }, [dispatchMutation])

  const cancelDoorDash = useCallback((deliveryJobId: string) => {
    cancelMutation.mutate(deliveryJobId)
  }, [cancelMutation])

  return {
    dispatchDoorDash,
    cancelDoorDash,
    getDeliveryJobStatus,
    isDispatching: isDispatching || dispatchMutation.isPending || cancelMutation.isPending,
    dispatchError: dispatchMutation.error,
    cancelError: cancelMutation.error
  }
}

export function useCanDispatchDoorDash(order: OrderResponse) {
  const token = useAuthStore((state) => state.token)
  
  return useQuery({
    queryKey: ['can-dispatch-doordash', order.id],
    queryFn: async (): Promise<{ canDispatch: boolean; reason?: string; quote?: any }> => {
      if (!token) return { canDispatch: false, reason: 'Not authenticated' }

      const response = await fetch(`/api/delivery/can-dispatch/${order.id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        return { canDispatch: false, reason: 'Failed to check dispatch eligibility' }
      }

      return await response.json()
    },
    enabled: !!token && !!order.id && order.status === 'READY' && order.deliveryMode === 'THIRD_PARTY_PROVIDER'
  })
}
