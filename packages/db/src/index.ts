// Re-export Prisma client
// Note: Prisma client is re-exported directly to avoid module resolution issues
// Import it as: import { PrismaClient } from '@packages/db/generated/client'
// export * from './generated/client/index.js'
// export { PrismaClient } from './generated/client/index.js'

// Re-export commonly used Prisma types and the Prisma namespace (for utility types like GetPayload)
export type { User, Role, Store, Item, Order, OrderItem, Cart, CartItem, Address, Promotion, OrderStatus as PrismaOrderStatus } from './generated/client/index.js'
export type { Prisma } from './generated/client/index.js'

// Re-export generated Zod schemas (commented out - causes duplicate export errors)
// To use Zod schemas: import from '@packages/db/generated/zod' directly
// export * from './generated/zod/index.js'

// Re-export services (will be added incrementally)
export * from './services/index.js'

// Re-export controllers (selective - base.controller requires fastify types)
// export * from './controllers/index.js'
export { BaseCrudController } from './controllers/base.controller.js'

// Re-export adapters (selective to avoid GeocodingConfig/Result duplicates)
export { verifyWebhookSignature } from './adapters/payments.adapter.js'
export { getStorageAdapter } from './adapters/storage.adapter.js'
export type { UploadFile } from './adapters/storage.adapter.js'

// Re-export prisma singleton for direct use
export { prisma, createPrismaClient } from './client.js'
export type { ExtendedPrismaClient } from './client.js'

export { haversineMiles } from './geo/haversine.js'
export type { GeoPoint } from './geo/haversine.js'

export {
  OFFICIAL_PLATFORM_STORE_SLUG,
  PUBLIC_STORE_DISCOVERY_SLUG_EXCLUSION,
} from './constants/platform-store.js'

