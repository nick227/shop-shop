/**
 * Frontend Extension Types;
 * Extends SDK types with frontend-specific computed fields;
 * 
 * These types add computed properties that don't exist in the API;
 * but are useful for frontend display and functionality;
 */

import type { 
  StoreResponse,
  StoreWithDistance,
  UserResponse,
  ItemResponse,
  AddressResponse
} from '../api/backend-types'

// Note: SDK types are not directly used in this file
// All interfaces are defined independently for frontend-specific needs

// ========================================
// Store Extensions
// ========================================

// StoreWithDistance is now imported from backend-types
export type { StoreWithDistance }

export interface StoreWithLocation extends StoreResponse {
  city?: string    // Flattened from addressCity;
  state?: string   // Flattened from addressState;
  zipCode?: string // Flattened from addressZip;
}

export interface StoreWithFees extends StoreResponse {
  deliveryFee: number;
  minOrder: number;
  serviceFeePercent: number;
}

// ========================================
// User Extensions;
// ========================================

export interface UserWithName extends UserResponse {
  name: string  // Computed from firstName + lastName;
  displayName?: string // Formatted display name;
}

// ========================================
// Order Extensions;
// ========================================

export interface OrderWithDetails {
  // Base order properties
  id: string;
  userId: string;
  storeId: string;
  cartId: string | null;
  status: string;
  deliveryType: string;
  paymentStatus: string;
  subtotal: string;
  fees: string;
  tax: string;
  tip: string;
  total: string;
  serviceFeePercent: string;
  serviceFeeAmount: string;
  netToVendor: string;
  createdAt: string;
  updatedAt?: string;
  
  // Extended properties
  store?: { id: string; name: string }
  user?: { name?: string; phone?: string; email?: string }
  items?: OrderItem[]
  totalAmount?: number
  addressSnapshot?: AddressSnapshot
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
}

// ========================================
// Item Extensions;
// ========================================

export interface ItemWithStore extends ItemResponse {
  storeName?: string;
  storeSlug?: string;
}

// ========================================
// Address Extensions;
// ========================================

export interface AddressWithCoordinates extends AddressResponse {
  lat?: number;
  lng?: number;
}

// ========================================
// Supporting Types;
// ========================================

// Order item interface for order details
// Note: Cart items become order items when order is created
export interface OrderItem {
  id: string;
  orderId: string; // Replace cartId with orderId for order context
  itemId: string;
  quantity: number;
  unitPrice: string;
  titleSnapshot?: string;
  optionsSnapshot?: Record<string, unknown> // Rename optionsJson for consistency
  weight?: number;
}

// Address snapshot interface for order details
export interface AddressSnapshot {
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// ========================================
// Type Guards;
// ========================================

export function isStoreWithDistance(store: StoreResponse): store is StoreWithDistance {
  return 'distance' in store;
}

export function isStoreWithFees(store: StoreResponse): store is StoreWithFees {
  return 'deliveryFee' in store && 'minOrder' in store;
}

export function isOrderWithDetails(order: unknown): order is OrderWithDetails {
  return (
    order !== null &&
    typeof order === 'object' &&
    'id' in order &&
    'userId' in order &&
    'storeId' in order &&
    'status' in order
  );
}
