import { z } from 'zod'
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

// ========================================
// OpenAPI Registry (single source of truth)
// ========================================
export const registry = new OpenAPIRegistry()

// ========================================
// Common/Shared Schemas
// ========================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  issues: z.array(z.any()).optional(),
}).openapi('ErrorResponse')

export const PaginationQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
}).openapi('PaginationQuery')

// ========================================
// Domain DTOs (Request/Response objects)
// These are NOT Prisma models - they're API contracts
// Generated Zod schemas from Prisma are in @packages/db
// ========================================

// Register common schemas
registry.register('ErrorResponse', ErrorResponseSchema)

// Re-export core (for resource definitions)
export * from './core/index.js'

// Re-export domain DTOs
export * from './dtos/index.js'

// NOTE: Resources are NOT exported - they contain server-side logic (Prisma, realtime)
// They're only used internally for OpenAPI generation
// Frontend should only import DTOs and response schemas

// Export response schemas for frontend validation
export { 
  StoreResponseSchema, 
  StoreListResponseSchema
} from './dtos/store.dto.js'

export { 
  ItemResponseSchema, 
  ItemListResponseSchema 
} from './dtos/item.dto.js'

export { 
  OrderResponseSchema, 
  OrderListResponseSchema 
} from './dtos/order.dto.js'

export { 
  CartResponseSchema 
} from './dtos/cart.dto.js'

export { 
  AddressResponseSchema 
} from './dtos/address.dto.js'

export { 
  UploadMediaInputSchema,
  MediaResponseSchema,
  MediaListResponseSchema,
  UpdateMediaSortInputSchema,
  type UploadMediaInput,
  type MediaResponse,
  type MediaListResponse,
  type UpdateMediaSortInput,
} from './dtos/media.dto.js'

// Import auth schemas for registration
// Import auth schemas for manual registration (auth has custom logic)
import {
  SignupInputSchema,
  LoginInputSchema,
  UserPublicResponseSchema,
  AuthResponseSchema,
} from './dtos/auth.dto.js'

// Import payment schemas for manual registration
import {
  CreatePaymentIntentInputSchema,
  PaymentIntentResponseSchema,
  CreateConnectAccountInputSchema,
  ConnectAccountResponseSchema,
  ConnectAccountStatusSchema,
} from './dtos/payment.dto.js'

// Import tip schemas for manual registration
import {
  CreateTipInputSchema,
  TipResponseSchema,
} from './dtos/tip.dto.js'

// ========================================
// Auth Schemas & Paths
// ========================================

// Register auth schemas
registry.register('SignupInput', SignupInputSchema)
registry.register('LoginInput', LoginInputSchema)
registry.register('UserPublicResponse', UserPublicResponseSchema)
registry.register('AuthResponse', AuthResponseSchema)

// Register auth paths with operation IDs
registry.registerPath({
  operationId: 'signup',
  method: 'post',
  path: '/auth/signup',
  tags: ['Auth'],
  summary: 'Create user account',
  request: {
    body: {
      content: {
        'application/json': { schema: SignupInputSchema }
      }
    }
  },
  responses: {
    201: {
      description: 'User created',
      content: { 'application/json': { schema: AuthResponseSchema } }
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

registry.registerPath({
  operationId: 'login',
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login with credentials',
  request: {
    body: {
      content: {
        'application/json': { schema: LoginInputSchema }
      }
    }
  },
  responses: {
    200: {
      description: 'Login successful',
      content: { 'application/json': { schema: AuthResponseSchema } }
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

// ========================================
// Payment Schemas & Paths
// ========================================

registry.register('CreatePaymentIntentInput', CreatePaymentIntentInputSchema)
registry.register('PaymentIntentResponse', PaymentIntentResponseSchema)
registry.register('CreateConnectAccountInput', CreateConnectAccountInputSchema)
registry.register('ConnectAccountResponse', ConnectAccountResponseSchema)
registry.register('ConnectAccountStatus', ConnectAccountStatusSchema)

registry.registerPath({
  operationId: 'createPaymentIntent',
  method: 'post',
  path: '/payments/create-intent',
  tags: ['Payments'],
  summary: 'Create payment intent',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreatePaymentIntentInputSchema }
      }
    }
  },
  responses: {
    200: {
      description: 'Payment intent created',
      content: { 'application/json': { schema: PaymentIntentResponseSchema } }
    },
    404: {
      description: 'Order not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

registry.registerPath({
  operationId: 'initiateStripeConnect',
  method: 'post',
  path: '/payments/connect',
  tags: ['Payments'],
  summary: 'Initiate Stripe Connect',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateConnectAccountInputSchema }
      }
    }
  },
  responses: {
    200: {
      description: 'Connect account created',
      content: { 'application/json': { schema: ConnectAccountResponseSchema } }
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

registry.registerPath({
  operationId: 'getStripeConnectStatus',
  method: 'get',
  path: '/payments/connect/{storeId}/status',
  tags: ['Payments'],
  summary: 'Get Stripe Connect status',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      storeId: z.string().uuid()
    })
  },
  responses: {
    200: {
      description: 'Connect status',
      content: { 'application/json': { schema: ConnectAccountStatusSchema } }
    },
    404: {
      description: 'Store not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

// ========================================
// Tip Schemas & Paths
// ========================================

registry.register('CreateTipInput', CreateTipInputSchema)
registry.register('TipResponse', TipResponseSchema)
// ProcessTipInputSchema removed - not available in auto-generated tip DTO

registry.registerPath({
  operationId: 'createTip',
  method: 'post',
  path: '/tips',
  tags: ['Tips'],
  summary: 'Create tip for completed order',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': { schema: CreateTipInputSchema }
      }
    }
  },
  responses: {
    201: {
      description: 'Tip created',
      content: { 'application/json': { schema: TipResponseSchema } }
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    },
    404: {
      description: 'Order not found or not completed',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

registry.registerPath({
  operationId: 'processTip',
  method: 'post',
  path: '/tips/{tipId}/process',
  tags: ['Tips'],
  summary: 'Process tip payment',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      tipId: z.string().uuid()
    }),
    body: {
      content: {
        'application/json': { schema: CreateTipInputSchema }
      }
    }
  },
  responses: {
    200: {
      description: 'Tip payment processed',
      content: { 'application/json': { schema: TipResponseSchema } }
    },
    404: {
      description: 'Tip not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

registry.registerPath({
  operationId: 'getTip',
  method: 'get',
  path: '/tips/{tipId}',
  tags: ['Tips'],
  summary: 'Get tip details',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      tipId: z.string().uuid()
    })
  },
  responses: {
    200: {
      description: 'Tip details',
      content: { 'application/json': { schema: TipResponseSchema } }
    },
    404: {
      description: 'Tip not found',
      content: { 'application/json': { schema: ErrorResponseSchema } }
    }
  },
})

// ========================================
// Auto-Register Resources in OpenAPI
// ========================================
// NOTE: Resources are now in apps/server/src/resources/
// They are imported by openapi.ts build script, not at runtime

// Export auth schemas and types
export {
  SignupInputSchema,
  LoginInputSchema,
  UserPublicResponseSchema,
  AuthResponseSchema,
  type SignupInput,
  type LoginInput,
  type UserPublicResponse,
  type AuthResponse,
} from './dtos/auth.dto.js'

// Export payment schemas and types
export {
  CreatePaymentIntentInputSchema,
  PaymentIntentResponseSchema,
  CreateConnectAccountInputSchema,
  ConnectAccountResponseSchema,
  ConnectAccountStatusSchema,
  StripeWebhookEventSchema,
  PaymentMethodResponseSchema,
  PaymentMethodListResponseSchema,
  type CreatePaymentIntentInput,
  type PaymentIntentResponse,
  type CreateConnectAccountInput,
  type ConnectAccountResponse,
  type ConnectAccountStatus,
  type StripeWebhookEvent,
  type PaymentMethodResponse,
  type PaymentMethodListResponse,
} from './dtos/payment.dto.js'

// Export tip schemas and types
export {
  CreateTipInputSchema,
  TipResponseSchema,
  type CreateTipInput,
  type TipResponse,
} from './dtos/tip.dto.js'

// Export the loader function for the build script
export { registerAllResourcesInOpenAPI } from './core/openapi.loader.js'
