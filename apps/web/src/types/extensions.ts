/**
 * Frontend Extension Types;
 * Extends SDK types with frontend-specific computed fields;
 * 
 * These types add computed properties that don't exist in the API;
 * but are useful for frontend display and functionality;
 */

import type { 
  StoreResponse as SDKStoreResponse,
  UserResponse as SDKUserResponse,
  OrderResponse as SDKOrderResponse,
  ListItems200ResponseDataInner as SDKItemResponse,
  ListAddresss200ResponseDataInner as SDKAddressResponse,
  ListCarts200ResponseDataInnerItemsInner as SDKCartItemResponse
} from '@packages/sdk'

// ========================================
// Store Extensions
// ========================================

export interface StoreWithDistance extends SDKStoreResponse {
  distance?: number;
  deliveryFee?: number  // Computed from feesJson;
  minOrder?: number     // Computed from feesJson;
}

export interface StoreWithLocation extends SDKStoreResponse {
  city?: string    // Flattened from addressCity;
  state?: string   // Flattened from addressState;
  zipCode?: string // Flattened from addressZip;
}

export interface StoreWithFees extends SDKStoreResponse {
  deliveryFee: number;
  minOrder: number;
  serviceFeePercent: number;
}

// ========================================
// User Extensions;
// ========================================

export interface UserWithName extends SDKUserResponse {
  name: string  // Computed from firstName + lastName;
  displayName?: string // Formatted display name;
}

// ========================================
// Order Extensions;
// ========================================

export interface OrderWithDetails extends SDKOrderResponse {
  store?: { id: string; name: string }
  items?: OrderItem[]
  // addressSnapshot is already in SDKOrderResponse as { [key: string]: any | null; } | null
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
}

// ========================================
// Item Extensions;
// ========================================

export interface ItemWithStore extends SDKItemResponse {
  storeName?: string;
  storeSlug?: string;
}

// ========================================
// Address Extensions;
// ========================================

export interface AddressWithCoordinates extends SDKAddressResponse {
  lat?: number;
  lng?: number;
}

// ========================================
// Supporting Types;
// ========================================

// Use SDK cart item type as base for order items
// Note: Cart items become order items when order is created
export interface OrderItem extends Omit<SDKCartItemResponse, 'cartId'> {
  orderId: string; // Replace cartId with orderId for order context
  optionsSnapshot?: Record<string, unknown> // Rename optionsJson for consistency
}

// Use SDK address type as base for address snapshots
export interface AddressSnapshot extends Pick<SDKAddressResponse, 'line1' | 'line2' | 'city' | 'state' | 'postalCode' | 'country'> {
  // All required fields are already included from SDK type
}

// ========================================
// Type Guards;
// ========================================

export function isStoreWithDistance(store: SDKStoreResponse): store is StoreWithDistance {
  return 'distance' in store;
}

export function isStoreWithFees(store: SDKStoreResponse): store is StoreWithFees {
  return 'deliveryFee' in store && 'minOrder' in store;
}

export function isOrderWithDetails(order: SDKOrderResponse): order is OrderWithDetails {
  return 'store' in order || 'items' in order;
}
