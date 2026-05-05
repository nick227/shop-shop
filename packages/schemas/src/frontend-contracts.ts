/**
 * Frontend API Contracts
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: Prisma schemas (100% schema-driven, parallel processing)
 * 
 * These are simplified, frontend-focused interfaces derived from
 * our comprehensive Prisma schemas. This ensures alignment while
 * providing a clean API for frontend consumption.
 */

// ========================================
// User Contracts
// ========================================

export interface CreateUserContract {
  role: unknown
  email: string
  unique: unknown
  String: unknown
  phone?: string
  isCompany: boolean
  companyName?: string
  addresses: unknown
  carts: unknown
  orders: unknown
  storesOwned: unknown
  paymentMethods: unknown
  promotionsCreated: unknown
  postLikes: unknown
  comments: unknown
  affiliate?: unknown
  vendorVerification?: unknown
  teamMemberships: unknown
  invitationsSent: unknown
  invitationsReceived: unknown
  FavoriteItem: unknown
}

// ========================================
// UserResponse Contracts
// ========================================

export interface UserResponseContract {
  id: string
  role: unknown
  email: string
  unique: unknown
  String: unknown
  phone?: string
  isCompany: boolean
  companyName?: string
  addresses: unknown
  carts: unknown
  orders: unknown
  storesOwned: unknown
  paymentMethods: unknown
  promotionsCreated: unknown
  postLikes: unknown
  comments: unknown
  affiliate?: unknown
  vendorVerification?: unknown
  teamMemberships: unknown
  invitationsSent: unknown
  invitationsReceived: unknown
  createdAt: string
  updatedAt: string
  FavoriteItem: unknown
}

// ========================================
// Store Contracts
// ========================================

export interface CreateStoreContract {
}

// ========================================
// StoreResponse Contracts
// ========================================

export interface StoreResponseContract {
}

// ========================================
// GeocodingCache Contracts
// ========================================

export interface CreateGeocodingCacheContract {
}

// ========================================
// GeocodingCacheResponse Contracts
// ========================================

export interface GeocodingCacheResponseContract {
}

// ========================================
// Item Contracts
// ========================================

export interface CreateItemContract {
}

// ========================================
// ItemResponse Contracts
// ========================================

export interface ItemResponseContract {
}

// ========================================
// MediaAsset Contracts
// ========================================

export interface CreateMediaAssetContract {
}

// ========================================
// MediaAssetResponse Contracts
// ========================================

export interface MediaAssetResponseContract {
}

// ========================================
// Cart Contracts
// ========================================

export interface CreateCartContract {
}

// ========================================
// CartResponse Contracts
// ========================================

export interface CartResponseContract {
}

// ========================================
// CartItem Contracts
// ========================================

export interface CreateCartItemContract {
}

// ========================================
// CartItemResponse Contracts
// ========================================

export interface CartItemResponseContract {
}

// ========================================
// Order Contracts
// ========================================

export interface CreateOrderContract {
}

// ========================================
// OrderResponse Contracts
// ========================================

export interface OrderResponseContract {
}

// ========================================
// OrderItem Contracts
// ========================================

export interface CreateOrderItemContract {
}

// ========================================
// OrderItemResponse Contracts
// ========================================

export interface OrderItemResponseContract {
}

// ========================================
// OrderEvent Contracts
// ========================================

export interface CreateOrderEventContract {
}

// ========================================
// OrderEventResponse Contracts
// ========================================

export interface OrderEventResponseContract {
}

// ========================================
// Tip Contracts
// ========================================

export interface CreateTipContract {
}

// ========================================
// TipResponse Contracts
// ========================================

export interface TipResponseContract {
}

// ========================================
// Address Contracts
// ========================================

export interface CreateAddressContract {
}

// ========================================
// AddressResponse Contracts
// ========================================

export interface AddressResponseContract {
}

// ========================================
// SystemSetting Contracts
// ========================================

export interface CreateSystemSettingContract {
}

// ========================================
// SystemSettingResponse Contracts
// ========================================

export interface SystemSettingResponseContract {
}

// ========================================
// PaymentWebhook Contracts
// ========================================

export interface CreatePaymentWebhookContract {
  provider: string
  eventId?: string
  unique: unknown
  String: unknown
  Json: unknown
}

// ========================================
// PaymentWebhookResponse Contracts
// ========================================

export interface PaymentWebhookResponseContract {
  id: string
  provider: string
  eventId: string
  unique: unknown
  String: unknown
  Json: unknown
  createdAt: string
  updatedAt: string
}

// ========================================
// PaymentMethod Contracts
// ========================================

export interface CreatePaymentMethodContract {
}

// ========================================
// PaymentMethodResponse Contracts
// ========================================

export interface PaymentMethodResponseContract {
}

// ========================================
// Promotion Contracts
// ========================================

export interface CreatePromotionContract {
}

// ========================================
// PromotionResponse Contracts
// ========================================

export interface PromotionResponseContract {
}

// ========================================
// PromotionRedemption Contracts
// ========================================

export interface CreatePromotionRedemptionContract {
}

// ========================================
// PromotionRedemptionResponse Contracts
// ========================================

export interface PromotionRedemptionResponseContract {
}

// ========================================
// Post Contracts
// ========================================

export interface CreatePostContract {
  storeId?: string
  store: unknown
  content?: string
  Text: unknown
}

// ========================================
// PostResponse Contracts
// ========================================

export interface PostResponseContract {
  id: string
  storeId: string
  store: unknown
  content?: string
  Text: unknown
}

// ========================================
// PostLike Contracts
// ========================================

export interface CreatePostLikeContract {
}

// ========================================
// PostLikeResponse Contracts
// ========================================

export interface PostLikeResponseContract {
}

// ========================================
// Comment Contracts
// ========================================

export interface CreateCommentContract {
}

// ========================================
// CommentResponse Contracts
// ========================================

export interface CommentResponseContract {
}

// ========================================
// Affiliate Contracts
// ========================================

export interface CreateAffiliateContract {
}

// ========================================
// AffiliateResponse Contracts
// ========================================

export interface AffiliateResponseContract {
}

// ========================================
// Commission Contracts
// ========================================

export interface CreateCommissionContract {
}

// ========================================
// CommissionResponse Contracts
// ========================================

export interface CommissionResponseContract {
}

// ========================================
// AffiliatePayout Contracts
// ========================================

export interface CreateAffiliatePayoutContract {
}

// ========================================
// AffiliatePayoutResponse Contracts
// ========================================

export interface AffiliatePayoutResponseContract {
}

// ========================================
// DeliveryZone Contracts
// ========================================

export interface CreateDeliveryZoneContract {
}

// ========================================
// DeliveryZoneResponse Contracts
// ========================================

export interface DeliveryZoneResponseContract {
}

// ========================================
// VendorVerification Contracts
// ========================================

export interface CreateVendorVerificationContract {
}

// ========================================
// VendorVerificationResponse Contracts
// ========================================

export interface VendorVerificationResponseContract {
}

// ========================================
// TeamMember Contracts
// ========================================

export interface CreateTeamMemberContract {
}

// ========================================
// TeamMemberResponse Contracts
// ========================================

export interface TeamMemberResponseContract {
}

// ========================================
// Invitation Contracts
// ========================================

export interface CreateInvitationContract {
}

// ========================================
// InvitationResponse Contracts
// ========================================

export interface InvitationResponseContract {
}

// ========================================
// FavoriteStore Contracts
// ========================================

export interface CreateFavoriteStoreContract {
}

// ========================================
// FavoriteStoreResponse Contracts
// ========================================

export interface FavoriteStoreResponseContract {
}

// ========================================
// FavoriteItem Contracts
// ========================================

export interface CreateFavoriteItemContract {
}

// ========================================
// FavoriteItemResponse Contracts
// ========================================

export interface FavoriteItemResponseContract {
}

// ========================================
// Bundle Contracts
// ========================================

export interface CreateBundleContract {
}

// ========================================
// BundleResponse Contracts
// ========================================

export interface BundleResponseContract {
}

// ========================================
// BundleItem Contracts
// ========================================

export interface CreateBundleItemContract {
}

// ========================================
// BundleItemResponse Contracts
// ========================================

export interface BundleItemResponseContract {
}

// ========================================
// BundlePricing Contracts
// ========================================

export interface CreateBundlePricingContract {
  bundleId?: string
  bundle: unknown
  Pricing: unknown
  pricingType: unknown
  fixedPrice?: unknown
  discountPercent?: unknown
  '00': unknown
  discountAmount?: unknown
  Minimum: unknown
  guarantee: unknown
  Display: unknown
  showSavings: boolean
  savingsLabel?: string
}

// ========================================
// BundlePricingResponse Contracts
// ========================================

export interface BundlePricingResponseContract {
  id: string
  bundleId: string
  bundle: unknown
  Pricing: unknown
  pricingType: unknown
  fixedPrice?: unknown
  discountPercent?: unknown
  '00': unknown
  discountAmount?: unknown
  Minimum: unknown
  guarantee: unknown
  Display: unknown
  showSavings: boolean
  savingsLabel?: string
  createdAt: string
  updatedAt: string
}

// ========================================
// Type Aliases for Backward Compatibility
// ========================================

export type CreateUserInput = CreateUserContract
export type UserResponseResponse = UserResponseContract
export type CreateStoreInput = CreateStoreContract
export type StoreResponseResponse = StoreResponseContract
export type CreateGeocodingCacheInput = CreateGeocodingCacheContract
export type GeocodingCacheResponseResponse = GeocodingCacheResponseContract
export type CreateItemInput = CreateItemContract
export type ItemResponseResponse = ItemResponseContract
export type CreateMediaAssetInput = CreateMediaAssetContract
export type MediaAssetResponseResponse = MediaAssetResponseContract
export type CreateCartInput = CreateCartContract
export type CartResponseResponse = CartResponseContract
export type CreateCartItemInput = CreateCartItemContract
export type CartItemResponseResponse = CartItemResponseContract
export type CreateOrderInput = CreateOrderContract
export type OrderResponseResponse = OrderResponseContract
export type CreateOrderItemInput = CreateOrderItemContract
export type OrderItemResponseResponse = OrderItemResponseContract
export type CreateOrderEventInput = CreateOrderEventContract
export type OrderEventResponseResponse = OrderEventResponseContract
export type CreateTipInput = CreateTipContract
export type TipResponseResponse = TipResponseContract
export type CreateAddressInput = CreateAddressContract
export type AddressResponseResponse = AddressResponseContract
export type CreateSystemSettingInput = CreateSystemSettingContract
export type SystemSettingResponseResponse = SystemSettingResponseContract
export type CreatePaymentWebhookInput = CreatePaymentWebhookContract
export type PaymentWebhookResponseResponse = PaymentWebhookResponseContract
export type CreatePaymentMethodInput = CreatePaymentMethodContract
export type PaymentMethodResponseResponse = PaymentMethodResponseContract
export type CreatePromotionInput = CreatePromotionContract
export type PromotionResponseResponse = PromotionResponseContract
export type CreatePromotionRedemptionInput = CreatePromotionRedemptionContract
export type PromotionRedemptionResponseResponse = PromotionRedemptionResponseContract
export type CreatePostInput = CreatePostContract
export type PostResponseResponse = PostResponseContract
export type CreatePostLikeInput = CreatePostLikeContract
export type PostLikeResponseResponse = PostLikeResponseContract
export type CreateCommentInput = CreateCommentContract
export type CommentResponseResponse = CommentResponseContract
export type CreateAffiliateInput = CreateAffiliateContract
export type AffiliateResponseResponse = AffiliateResponseContract
export type CreateCommissionInput = CreateCommissionContract
export type CommissionResponseResponse = CommissionResponseContract
export type CreateAffiliatePayoutInput = CreateAffiliatePayoutContract
export type AffiliatePayoutResponseResponse = AffiliatePayoutResponseContract
export type CreateDeliveryZoneInput = CreateDeliveryZoneContract
export type DeliveryZoneResponseResponse = DeliveryZoneResponseContract
export type CreateVendorVerificationInput = CreateVendorVerificationContract
export type VendorVerificationResponseResponse = VendorVerificationResponseContract
export type CreateTeamMemberInput = CreateTeamMemberContract
export type TeamMemberResponseResponse = TeamMemberResponseContract
export type CreateInvitationInput = CreateInvitationContract
export type InvitationResponseResponse = InvitationResponseContract
export type CreateFavoriteStoreInput = CreateFavoriteStoreContract
export type FavoriteStoreResponseResponse = FavoriteStoreResponseContract
export type CreateFavoriteItemInput = CreateFavoriteItemContract
export type FavoriteItemResponseResponse = FavoriteItemResponseContract
export type CreateBundleInput = CreateBundleContract
export type BundleResponseResponse = BundleResponseContract
export type CreateBundleItemInput = CreateBundleItemContract
export type BundleItemResponseResponse = BundleItemResponseContract
export type CreateBundlePricingInput = CreateBundlePricingContract
export type BundlePricingResponseResponse = BundlePricingResponseContract
