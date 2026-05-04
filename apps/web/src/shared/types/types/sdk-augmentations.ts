// @ts-nocheck
/**
 * SDK Type Augmentations
 * Adds missing fields to SDK-generated types
 * This file extends the SDK types with essential fields that are missing
 */

import type {
  StoreResponse as SDKStoreResponse,
  UserResponse as SDKUserResponse,
  OrderResponse as SDKOrderResponse,
  ItemResponse as SDKItemResponse,
  AddressResponse as SDKAddressResponse,
  CartResponse as SDKCartResponse
} from '@api/types'

// ========================================
// Augmented SDK Types with Missing Fields
// ========================================

export interface StoreResponse extends SDKStoreResponse {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse extends SDKUserResponse {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderResponse extends SDKOrderResponse {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemResponse extends SDKItemResponse {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressResponse extends SDKAddressResponse {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartResponse extends SDKCartResponse {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ListStoreResponse = SDKStoreResponse
export type ListOrderResponse = SDKOrderResponse

// CartItemResponse - using a custom interface since SDK doesn't export the inner type
export interface CartItemResponse {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

// RiverPostResponse - using a custom interface since SDK doesn't export this type
export interface RiverPostResponse {
  id: string;
  content: string;
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

// MediaItemResponse - using a custom interface since SDK doesn't export this type
export interface MediaItemResponse {
  id: string;
  url: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// All types are already exported above
// ========================================
