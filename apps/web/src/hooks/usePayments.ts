/**
 * usePayments Hook - Stripe payment integration;
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { handleApiError, type AppError } from '@api/errors'
import type {
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response} from '@packages/sdk'

/**
 * Create a payment intent for an order;
 */
export function useCreatePaymentIntent() {
  return useMutation<CreatePaymentIntent200Response, AppError, string>({
    mutationFn: async (orderId: string) => {
      try {
        return await apiClient.payments().createPaymentIntent({
          createPaymentIntentRequest: { orderId }
        })
      } catch (error: any) {
        throw await handleApiError(error)
      }
    }
  })
}

/**
 * Initiate Stripe Connect for a store;
 */
export function useStripeConnect() {
  return useMutation<InitiateStripeConnect200Response, AppError, string>({
    mutationFn: async (storeId: string) => {
      try {
        return await apiClient.payments().initiateStripeConnect({
          initiateStripeConnectRequest: { storeId }
        })
      } catch (error: any) {
        throw await handleApiError(error)
      }
    }
  })
}

/**
 * Get Stripe Connect status for a store;
 */
export function useStripeConnectStatus(storeId: string) {
  return useQuery<GetStripeConnectStatus200Response, AppError>({
    queryKey: ['stripe-connect-status', storeId],
    queryFn: async () => {
      try {
        return await apiClient.payments().getStripeConnectStatus({ storeId })
      } catch (error: any) {
        throw await handleApiError(error)
      }
    },
    enabled: Boolean(storeId)
  })
}

