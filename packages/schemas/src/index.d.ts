import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
export declare const registry: OpenAPIRegistry;
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
    issues: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    error: string;
    message?: string | undefined;
    issues?: any[] | undefined;
}, {
    error: string;
    message?: string | undefined;
    issues?: any[] | undefined;
}>;
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: string | undefined;
    limit?: string | undefined;
}>;
export * from './core/index.js';
export * from './dtos/index.js';
export { StoreResponseSchema, StoreListResponseSchema, CreateStoreInputSchema, UpdateStoreInputSchema, type CreateStoreInput, type UpdateStoreInput, } from './dtos/store.dto.js';
export { ItemResponseSchema, ItemListResponseSchema, CreateItemInputSchema, UpdateItemInputSchema, type CreateItemInput, type UpdateItemInput, } from './dtos/item.dto.js';
export { OrderResponseSchema, OrderListResponseSchema, OrderPlacementInputSchema, OrderFullRowCreateInputSchema, CreateOrderInputSchema, UpdateOrderStatusSchema, type OrderPlacementInput, type OrderFullRowCreateInput, type CreateOrderInput, type UpdateOrderStatus, } from './dtos/order.dto.js';
export { CartResponseSchema, AddToCartInputSchema, UpdateCartInputSchema, type AddToCartInput, type UpdateCartInput, } from './dtos/cart.dto.js';
export { AddToCartInputSchema as AddCartItemInputSchema } from './dtos/cart.dto.js';
export { UpdateCartInputSchema as UpdateCartItemInputSchema } from './dtos/cart.dto.js';
export { AddressResponseSchema, CreateAddressInputSchema, UpdateAddressInputSchema, type CreateAddressInput, type UpdateAddressInput, } from './dtos/address.dto.js';
export { BundleResponseSchema, CreateBundleInputSchema, UpdateBundleInputSchema, type CreateBundleInput, type UpdateBundleInput, type BundleResponse, type BundlePricingType, } from './dtos/bundle.dto.js';
export { PromotionResponseSchema, CreatePromotionInputSchema, UpdatePromotionInputSchema, type CreatePromotionInput, type UpdatePromotionInput, } from './dtos/promotion.dto.js';
export { LoginInputSchema, SignupInputSchema, AuthResponseSchema, UserPublicResponseSchema, type LoginInput, type SignupInput, type AuthResponse, type UserPublicResponse, } from './dtos/auth.dto.js';
export { UploadMediaInputSchema, MediaResponseSchema, MediaListResponseSchema, type UploadMediaInput, type MediaResponse, type MediaListResponse, } from './dtos/media.dto.js';
export { UpdateMediaSortInputSchema, type UpdateMediaSortInput, } from './dtos/mediaasset.dto.js';
export { CreatePaymentIntentInputSchema, PaymentIntentResponseSchema, CreateConnectAccountInputSchema, ConnectAccountResponseSchema, ConnectAccountStatusSchema, StripeWebhookEventSchema, PaymentMethodResponseSchema, PaymentMethodListResponseSchema, type CreatePaymentIntentInput, type PaymentIntentResponse, type CreateConnectAccountInput, type ConnectAccountResponse, type ConnectAccountStatus, type StripeWebhookEvent, type PaymentMethodResponse, type PaymentMethodListResponse, } from './dtos/payment.dto.js';
export { CreateTipInputSchema, UpdateTipInputSchema, TipResponseSchema, TipListResponseSchema, TipQuerySchema, ProcessTipInputSchema, TipStatusUpdateSchema, type CreateTipInput, type UpdateTipInput, type TipResponse, type TipListResponse, type TipQuery, type ProcessTipInput, type TipStatusUpdate, } from './dtos/tip.dto.js';
export { CreatePostInputSchema, PostResponseSchema, PostListResponseSchema, PostQuerySchema, RiverFeedQuerySchema, RiverFeedItemSchema, RiverFeedPageSchema, UpdatePostPrioritySchema, CreateCommentInputSchema, CommentResponseSchema, CommentListResponseSchema, CommentQuerySchema, LikePostInputSchema, UnlikePostInputSchema, type CreatePostInput, type PostResponse, type PostListResponse, type PostQuery, type RiverFeedQuery, type RiverFeedItem, type RiverFeedPage, type UpdatePostPriorityInput, type CreateCommentInput, type CommentResponse, type CommentListResponse, type CommentQuery, type LikePostInput, type UnlikePostInput, } from './dtos/river.dto.js';
export { UpdatePostInputSchema, type UpdatePostInput, } from './dtos/post.dto.js';
export { registerAllResourcesInOpenAPI } from './core/openapi.loader.js';
//# sourceMappingURL=index.d.ts.map