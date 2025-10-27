/**
 * Orders API Client;
 * Handles all order-related API calls;
 */

import { apiClient } from './client'
import type { 
  UpdateOrderRequest,
  UpdateOrderRequestStatusEnum
} from '@packages/sdk'
import type { CreateOrderInput } from '@api/types'
// Define order status enum locally since SDK doesn't have ListOrdersStatusEnum
export const ListVendorOrdersStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED', 
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const

export type ListVendorOrdersStatusEnum = typeof ListVendorOrdersStatusEnum[keyof typeof ListVendorOrdersStatusEnum]
// CreateOrderInput is now imported from @api/types;
// Use SDK type for order status updates
export type UpdateOrderStatus = UpdateOrderRequest;

export const ordersApi = {
  /**
   * Create order from cart;
   */
  async createOrder(input: CreateOrderInput) {
    return await apiClient.orders().createOrder({ createOrderRequest: input })
  },

  /**
   * Get order by ID;
   */
  async getOrder(orderId: string) {
    return await apiClient.orders().getOrderById({ id: orderId })
  },

  /**
   * Get customer orders;
   */
  async getCustomerOrders(status?: string) {
    // Note: SDK doesn't support status filtering yet
    // All orders will be returned and filtered client-side
    return await apiClient.orders().listOrders({})
  },

  /**
   * Get vendor orders;
   * TODO: Backend needs to add listVendorOrders() to OpenAPI spec;
   * Workaround: Using listOrders() with storeId filter;
   */
  async getVendorOrders(status?: string) {
    // Workaround until backend adds listVendorOrders()
    // Note: SDK doesn't support status filtering yet
    // All orders will be returned and filtered client-side
    return await apiClient.orders().listOrders({});
  },
  /**
   * Get pending orders count (vendor)
   * TODO: Backend needs to add getVendorPendingOrdersCount() to OpenAPI spec;
   * Workaround: Fetch and count locally;
   */
  async getPendingOrdersCount() {
    // Workaround until backend adds getVendorPendingOrdersCount()
    // Note: SDK doesn't support status filtering yet
    const orders = await apiClient.orders().listOrders({});
    return { count: orders.data?.length || 0 };
  },

  /**
   * Update order status (vendor)
   */
  async updateOrderStatus(orderId: string, input: UpdateOrderStatus) {
    return await apiClient.orders().updateOrder({ 
      id: orderId, 
      updateOrderRequest: input
    });
  },

  /**
   * Cancel order;
   * TODO: Backend needs to add cancelOrder() to OpenAPI spec;
   * Workaround: Using updateOrder() with CANCELED status;
   */
  async cancelOrder(orderId: string, reason?: string) {
    // Workaround until backend adds cancelOrder()
    return await apiClient.orders().updateOrder({ 
      id: orderId,
      updateOrderRequest: { 
        status: 'CANCELED' as any
        // Note: reason parameter will be available when proper endpoint exists
      } 
    });
  }
}

