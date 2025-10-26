/**
 * usePayment Hook - Payment intent creation and handling;
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { handleApiError } from '@api/errors'

export interface CreatePaymentIntentParams {
  orderId: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  status: string;
}

export function usePayment() {
  const queryClient = useQueryClient()

  const createPaymentIntent = useMutation({
    mutationFn: async (params: CreatePaymentIntentParams): Promise<PaymentIntentResult> => {
      try {
        const response = await apiClient.payments().createPaymentIntent({
          createPaymentIntentRequest: params
        })
        return response as PaymentIntentResult;
      } catch (error: any) {
        throw await handleApiError(error)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }})

  return {
    createPaymentIntent: createPaymentIntent.mutate,
    createPaymentIntentAsync: createPaymentIntent.mutateAsync,
    isCreatingIntent: createPaymentIntent.isPending,
    paymentError: createPaymentIntent.error}
}

