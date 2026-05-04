// @ts-nocheck
/**
 * usePayments Hook - Stripe payment integration with standardized patterns
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@api/client'
import { createQueryErrorHandler, createMutationErrorHandler, createMutationOnError, queryRetryConfig, mutationRetryConfig } from './utils/errorHandling'
import type {
  CreatePaymentIntent200Response,
  InitiateStripeConnect200Response,
  GetStripeConnectStatus200Response} from '@api/types'

/**
 * Create a payment intent for an order;
 */
export function useCreatePaymentIntent() {
  return useMutation<CreatePaymentIntent200Response, any, string>({
    mutationFn: async (orderId: string) => {
      try {
        return await apiClient.payments().createPaymentIntent({
          createPaymentIntentRequest: { orderId }
        })
      } catch (error: any) {
        throw await createMutationErrorHandler()(error)
      }
    },
    onError: createMutationOnError(),
    ...mutationRetryConfig
  })
}

/**
 * Initiate Stripe Connect for a store;
 */
export function useStripeConnect() {
  return useMutation<InitiateStripeConnect200Response, any, string>({
    mutationFn: async (storeId: string) => {
      try {
        return await apiClient.payments().initiateStripeConnect({
          initiateStripeConnectRequest: { storeId }
        })
      } catch (error: any) {
        throw await createMutationErrorHandler()(error)
      }
    },
    onError: createMutationOnError(),
    ...mutationRetryConfig
  })
}

/**
 * Get Stripe Connect status for a store;
 */
export function useStripeConnectStatus(storeId: string) {
  return useQuery<GetStripeConnectStatus200Response, any>({
    queryKey: ['stripe-connect-status', storeId],
    queryFn: async () => {
      try {
        return await apiClient.payments().getStripeConnectStatus({ storeId })
      } catch (error: any) {
        throw await createQueryErrorHandler()(error)
      }
    },
    enabled: Boolean(storeId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...queryRetryConfig
  })
}

