/**
 * API Client Adapter - SDK Wrapper
 * 
 * Single import point for all API operations.
 * Wraps the generated SDK with consistent error handling,
 * validation, and type safety.
 * 
 * Usage:
 *   import { api } from '@api/client-adapter'
 *   const stores = await api.stores.getAll()
 */

import { apiClient } from './client'
import type {
  AuthApi,
  StoresApi,
  ItemsApi,
  CartsApi,
  OrdersApi,
  AddresssApi,
  PromotionsApi,
  PaymentsApi,
  UsersApi,
  MediaApi,
  BundlesApi
} from '@packages/sdk'

/**
 * Centralized API access point
 * All features should import from this adapter, never directly from @packages/sdk
 */
export const api = {
  // Authentication
  auth: apiClient.getAuthApi(),
  
  // Core business entities
  stores: apiClient.getStoresApi(),
  items: apiClient.getItemsApi(),
  bundles: apiClient.getBundlesApi(),
  
  // E-commerce
  carts: apiClient.getCartsApi(),
  orders: apiClient.getOrdersApi(),
  payments: apiClient.getPaymentsApi(),
  
  // User management
  users: apiClient.getUsersApi(),
  addresses: apiClient.getAddresssApi(),
  
  // Content & media
  media: apiClient.getMediaApi(),
  
  // Promotions
  promotions: apiClient.getPromotionsApi(),
} as const

// Re-export types for convenience
export type {
  AuthApi,
  StoresApi,
  ItemsApi,
  CartsApi,
  OrdersApi,
  AddresssApi,
  PromotionsApi,
  PaymentsApi,
  UsersApi,
  MediaApi,
  BundlesApi
} from '@packages/sdk'

// Re-export the client for advanced use cases
export { apiClient } from './client'
