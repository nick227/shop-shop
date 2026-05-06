// Services - Business logic layer
// Pure functions, no HTTP concerns

export * from '../order-state-machine.js'
export * from './base.service.js'
export * from './user.service.js'
export * from './river.service.js'
export * from './river-ingest.service.js'
export * from './payment.service.js'
export * from './media.service.js'
export * from './order.service.js'
export * from './order-realtime.publisher.js'
export * from './tip.service.js'
export * from './geocoding-cache.service.js'
export * from './enhanced-geocoding.service.js'
export * from './affiliate.service.js'
export * from './delivery-zone.service.js'
export * from './vendor-verification.service.js'
export * from './vendor-application.service.js'
export * from './accounting-export.service.js'
export * from './vendor-payout.service.js'
export * from './team.service.js'
export * from './storeActivation.service.js'
export * from './promotion-enhanced.service.js'
export * from './order-cancellation.service.js'
export * from './favorites.service.js'

// Export Decimal for use in tests and external packages
// Import first to ensure it's treated as a value export
import { Decimal as PrismaDecimal } from '@prisma/client/runtime/library'
export const Decimal = PrismaDecimal

// Note: Most services now use BaseCrudService via resource definitions
// Only create custom services for complex business logic beyond CRUD

