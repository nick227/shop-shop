/**
 * Data Transformers
 * 
 * Functions to transform data between API and application formats.
 * Handles data normalization and formatting.
 */

import type { StoreResponse, ItemResponse, Bundle, CartWithTotals, OrderResponse } from '@packages/sdk'

/**
 * Transform store data for display
 */
export function transformStoreForDisplay(store: StoreResponse) {
  return {
    ...store,
    displayName: store.name,
    fullAddress: `${store.address}, ${store.city || ''}, ${store.state || ''} ${store.zipCode || ''}`.trim(),
    isOpen: checkStoreHours(store),
    distance: store.distance || 0,
  }
}

/**
 * Transform item data for display
 */
export function transformItemForDisplay(item: ItemResponse) {
  return {
    ...item,
    displayPrice: formatPrice(item.price),
    isAvailable: item.inStock && item.quantity > 0,
    imageUrl: item.imageUrl || '/placeholder-item.jpg',
  }
}

/**
 * Transform bundle data for display
 */
export function transformBundleForDisplay(bundle: Bundle) {
  return {
    ...bundle,
    displayPrice: formatPrice(bundle.price),
    savings: calculateBundleSavings(bundle),
    itemCount: bundle.itemIds?.length || 0,
  }
}

/**
 * Transform cart data for display
 */
export function transformCartForDisplay(cart: CartWithTotals) {
  return {
    ...cart,
    displaySubtotal: formatPrice(cart.subtotal),
    displayTax: formatPrice(cart.tax),
    displayTotal: formatPrice(cart.total),
    itemCount: cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
  }
}

/**
 * Transform order data for display
 */
export function transformOrderForDisplay(order: OrderResponse) {
  return {
    ...order,
    displayTotal: formatPrice(order.total),
    displayStatus: formatOrderStatus(order.status),
    displayDate: formatOrderDate(order.createdAt),
  }
}

// Helper functions
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

function checkStoreHours(store: StoreResponse): boolean {
  // Simple implementation - in real app, would check actual hours
  const now = new Date()
  const hour = now.getHours()
  return hour >= 8 && hour <= 22
}

function calculateBundleSavings(bundle: Bundle): number {
  // Calculate savings based on individual item prices vs bundle price
  // This would need actual item data in a real implementation
  return 0
}

function formatOrderStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function formatOrderDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
