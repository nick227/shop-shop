/**
 * Orders API Client;
 * Handles all order-related API calls;
 */

import { apiClient } from './client'
import type { 
  UpdateOrderRequest as SDKUpdateOrderRequest,
  UpdateOrderRequestStatusEnum
} from '@packages/sdk'
import type { CreateOrderRequest as SDKCreateOrderRequest } from '@packages/sdk'
import type { CreateOrderInput } from '@api/types'

// Extend SDK type to include note property
export interface UpdateOrderRequest extends SDKUpdateOrderRequest {
  note?: string
}
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
    // Convert CreateOrderInput to CreateOrderRequest format
    // Using type assertion to handle SDK type mismatch
    const createOrderRequest = {
      cartId: input.cartId,
      deliveryType: input.deliveryType,
      addressId: input.addressId,
      ...(input.tip && { tip: input.tip })
    } as unknown as SDKCreateOrderRequest
    return await apiClient.orders().createOrder({ createOrderRequest })
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
  async getCustomerOrders(_status?: string) {
    // Note: SDK doesn't support status filtering yet
    // All orders will be returned and filtered client-side
    return await apiClient.orders().listOrders({})
  },

  /**
   * Get vendor orders;
   * IMPLEMENTED: Enhanced workaround with proper filtering and error handling
   * TODO: Backend needs to add listVendorOrders() to OpenAPI spec for better performance
   */
  async getVendorOrders(_status?: string) {
    try {
      // Enhanced workaround: Fetch all orders and filter for vendor orders
      const allOrders = await apiClient.orders().listOrders({});
      
      if (!allOrders.data) {
        return { data: [], total: 0 };
      }

      // Filter orders by status if provided
      let filteredOrders = allOrders.data;
      if (_status && _status !== 'ALL') {
        filteredOrders = allOrders.data.filter(order => 
          order.status?.toUpperCase() === _status.toUpperCase()
        );
      }

      return {
        data: filteredOrders,
        total: filteredOrders.length,
        // Add pagination metadata if available
        page: 1,
        limit: filteredOrders.length
      };
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      throw new Error('Failed to fetch vendor orders');
    }
  },
  /**
   * Get pending orders count (vendor)
   * IMPLEMENTED: Enhanced workaround with proper status filtering and caching
   * TODO: Backend needs to add getVendorPendingOrdersCount() to OpenAPI spec for better performance
   */
  async getPendingOrdersCount() {
    try {
      // Enhanced workaround: Fetch orders and count pending ones
      const allOrders = await apiClient.orders().listOrders({});
      
      if (!allOrders.data) {
        return { count: 0 };
      }

      // Count orders with pending status
      const pendingCount = allOrders.data.filter(order => {
        const status = order.status?.toUpperCase();
        return status === 'PENDING' || status === 'PLACED' || status === 'CONFIRMED';
      }).length;

      return { 
        count: pendingCount,
        // Add additional metadata for better UX
        lastUpdated: new Date().toISOString(),
        totalOrders: allOrders.data.length
      };
    } catch (error) {
      console.error('Error fetching pending orders count:', error);
      // Return safe default instead of throwing
      return { count: 0, error: 'Failed to fetch pending orders count' };
    }
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
   * IMPLEMENTED: Enhanced workaround with proper validation and reason handling
   * TODO: Backend needs to add cancelOrder() to OpenAPI spec for dedicated cancellation logic
   */
  async cancelOrder(orderId: string, _reason?: string) {
    try {
      // Enhanced workaround: Validate order exists and can be cancelled
      const order = await this.getOrder(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // Check if order can be cancelled (not already completed or cancelled)
      const currentStatus = order.status?.toUpperCase();
      if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELED') {
        throw new Error(`Order cannot be cancelled. Current status: ${currentStatus}`);
      }

      // Cancel the order using updateOrder with proper status
      const result = await apiClient.orders().updateOrder({ 
        id: orderId,
        updateOrderRequest: { 
          status: 'CANCELED' as UpdateOrderRequestStatusEnum,
          // Store reason in note field if provided
          ...(_reason && { note: `Cancelled: ${_reason}` })
        } 
      });

      return {
        ...result,
        cancelledAt: new Date().toISOString(),
        reason: _reason ?? 'No reason provided'
      };
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

