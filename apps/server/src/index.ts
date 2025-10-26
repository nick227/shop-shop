import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth.route.js'
import { paymentRoutes } from './routes/payment.route.js'
import { mediaRoutes } from './routes/media.route.js'
import { realtimeRoutes } from './routes/realtime.route.js'
import { orderRoutes } from './routes/order.route.js'
import { riverRoutes } from './routes/river.route.js'
import { geocodingRoutes } from './routes/geocoding.route.js'
import { tipRoutes } from './routes/tip.route.js'
import { affiliateRoutes } from './routes/affiliate.route.js'
import { deliveryZoneRoutes } from './routes/delivery-zone.route.js'
import { vendorVerificationRoutes } from './routes/vendor-verification.route.js'
import { exportRoutes } from './routes/export.route.js'
import { vendorPayoutRoutes } from './routes/vendor-payout.route.js'
import { teamRoutes } from './routes/team.route.js'
import { promotionEnhancedRoutes } from './routes/promotion-enhanced.route.js'
import { orderCancellationRoutes } from './routes/order-cancellation.route.js'
import { favoritesRoutes } from './routes/favorites.route.js'
import { ALL_RESOURCES } from './resources/index.js'
import { registerAllResources } from './routes/loader.js'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { join } from 'path'
import { env, corsOrigins } from './env.js'
import { setOrderServiceBroadcast, setTipServiceBroadcast } from '@packages/db'
import { realtimeBroker } from './services/realtime.broker.js'

// Better logging in development
const app = Fastify({
  logger: env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      }
    }
  } : true
})

await app.register(cors, {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

// Multipart form data for file uploads
await app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
})

// Serve uploaded files (for local storage only)
if (process.env.STORAGE_TYPE === 'local' || !process.env.STORAGE_TYPE) {
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
  })
  app.log.info({ uploadDir }, 'Serving local uploads')
}

// Rate limiting - stricter for auth endpoints
await app.register(rateLimit, {
  global: false, // Apply per-route
  max: 100, // Default: 100 requests per window
  timeWindow: '15 minutes'
})

await app.register(swagger, {
  openapi: {
    openapi: '3.0.3',
    info: { title: 'Delivery API', version: '0.1.0' }
  }
})
await app.register(swaggerUI, { routePrefix: '/docs' })

// Health check
app.get('/healthz', async () => ({ ok: true }))

// Register routes
await app.register(authRoutes)     // Custom auth logic
await app.register(paymentRoutes)  // Payment & Stripe Connect
await app.register(mediaRoutes)    // Media uploads (custom multipart handling)
await app.register(realtimeRoutes) // Real-time WebSocket
// await app.register(orderRoutes)    // Orders - NOW AUTO-REGISTERED via resources
await app.register(riverRoutes)    // River (posts) - Custom routes
await app.register(geocodingRoutes) // Geocoding services (ZIP, city/state, address)
await app.register(tipRoutes)      // Tip processing
await app.register(affiliateRoutes) // Affiliate system
await app.register(deliveryZoneRoutes) // Delivery zones with polygon support
await app.register(vendorVerificationRoutes) // Vendor KYC/KYB verification
await app.register(exportRoutes) // Accounting CSV exports
await app.register(vendorPayoutRoutes) // Vendor payout management
await app.register(teamRoutes) // Team members & invitations
await app.register(promotionEnhancedRoutes) // Enhanced promotion validation and analytics
await app.register(orderCancellationRoutes) // Order cancellations with refunds
await app.register(favoritesRoutes) // Favorites and reorder functionality

// Auto-register all resources (promotions, stores, items, carts, addresses, orders, posts)
await registerAllResources(app, ALL_RESOURCES)

// Wire up order service to realtime broker
setOrderServiceBroadcast((topic, event) => {
  realtimeBroker.publish(topic, event)
})

// Wire up tip service to realtime broker
setTipServiceBroadcast((topic, event) => {
  realtimeBroker.publish(topic, event)
})

const port = env.PORT
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`listening on http://localhost:${port}`)
  app.log.info(`docs at http://localhost:${port}/docs`)
})
