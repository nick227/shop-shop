/**
 * Orders API Client;
 * Handles all order-related API calls;
 */

import { apiClient } from './client'
import type { 
  ListOrdersStatusEnum,
  UpdateOrderRequest,
  UpdateOrderRequestStatusEnum
} from '@packages/sdk'
import type { CreateOrderInput } from '@api/types'
// ListVendorOrdersStatusEnum doesn't exist yet in SDK - using ListOrdersStatusEnum;
type ListVendorOrdersStatusEnum = ListOrdersStatusEnum;
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
    return await apiClient.orders().listOrders({ 
      status: status as ListOrdersStatusEnum
  })
  },

  /**
   * Get vendor orders;
   * TODO: Backend needs to add listVendorOrders() to OpenAPI spec;
   * Workaround: Using listOrders() with storeId filter;
   */
  async getVendorOrders(status?: string) {
    // Workaround until backend adds listVendorOrders()
    return await apiClient.orders().listOrders({ 
      status: status as ListOrdersStatusEnum
      // Note: Will need storeId parameter when implemented
    });
  },
  /**
   * Get pending orders count (vendor)
   * TODO: Backend needs to add getVendorPendingOrdersCount() to OpenAPI spec;
   * Workaround: Fetch and count locally;
   */
  async getPendingOrdersCount() {
    // Workaround until backend adds getVendorPendingOrdersCount()
    const orders = await apiClient.orders().listOrders({ 
      status: 'PLACED' as ListOrdersStatusEnum
    });
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

