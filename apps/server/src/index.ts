import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, jsonSchemaTransform } from 'fastify-type-provider-zod'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth.route.js'
import checkoutRoutes from './routes/checkout.js'
import orderStatusRoutes from './routes/orderStatus.js'
import { orderDispatchRoutes } from './routes/order-dispatch.route.js'
import { driverRoutes } from './routes/driver.route.js'
import { paymentRoutes } from './routes/payment.route.js'
import { stripeWebhookRoutes } from './routes/stripe-webhook.route.js'
import { mediaRoutes } from './routes/media.route.js'
import { realtimeRoutes } from './routes/realtime.route.js'
import { riverRoutes } from './routes/river.route.js'
import { geocodingRoutes } from './routes/geocoding.route.js'
import { tipRoutes } from './routes/tip.route.js'
import { affiliateRoutes } from './routes/affiliate.route.js'
import { deliveryZoneRoutes } from './routes/delivery-zone.route.js'
import { storeReadinessRoutes } from './routes/store-readiness.route.js'
import { vendorVerificationRoutes } from './routes/vendor-verification.route.js'
import { exportRoutes } from './routes/export.route.js'
import { vendorPayoutRoutes } from './routes/vendor-payout.route.js'
import { teamRoutes } from './routes/team.route.js'
import { vendorAffiliateSalesRoutes } from './routes/vendor-affiliate-sales.route.js'
import { promotionEnhancedRoutes } from './routes/promotion-enhanced.route.js'
import { orderCancellationRoutes } from './routes/order-cancellation.route.js'
import { favoritesRoutes } from './routes/favorites.route.js'
import { searchUnifiedRoutes } from './routes/search-unified.route.js'
import { tagsRoutes } from './routes/tags.route.js'
import { itemAnalyticsRoutes } from './routes/item-analytics.route.js'
import { ALL_RESOURCES } from './resources/index.js'
import { registerAllResources } from './routes/loader.js'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { join } from 'path'
import { env, corsOrigins } from './env.js'
import { setOrderServiceBroadcast, setTipServiceBroadcast } from '@packages/db'
import { realtimeBroker } from './services/realtime.broker.js'
import { globalErrorHandler, handleUncaughtException, handleUnhandledRejection } from './middleware/errorHandler.js'
import { requestIdMiddleware } from './middleware/requestId.js'
import { optionalAuthenticate } from './middleware/auth.js'

const app = Fastify({
  logger: env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
    }
  } : true,
})

// Enable global Zod validation
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

const safeJsonSchemaTransform: typeof jsonSchemaTransform = (input) => {
  try {
    return jsonSchemaTransform(input)
  } catch (error) {
    app.log.warn({ url: input.url, error }, 'Swagger transform failed for route; hiding from docs')
    return {
      schema: { hide: true },
      url: input.url,
    }
  }
}

await app.register(cors, {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header)
    if (!origin) {
      callback(null, true)
      return
    }

    // Always allow localhost / loopback dev ports (e.g., Vite auto-port shifts)
    if (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true)
      return
    }

    callback(null, corsOrigins.includes(origin))
  },
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

// Rate limiting
await app.register(rateLimit, {
  global: false,
  max: 100,
  timeWindow: '15 minutes',
})

await app.register(swagger, {
  openapi: {
    openapi: '3.0.3',
    info: { title: 'Delivery API', version: '0.1.0' }
  },
  transform: safeJsonSchemaTransform,
})
await app.register(swaggerUI, { routePrefix: '/docs' })

// Add request ID middleware
app.addHook('preHandler', requestIdMiddleware)
// Populate req.user when a valid Bearer token is present (without forcing auth for public routes).
app.addHook('preHandler', optionalAuthenticate)

// Health check
app.get('/healthz', async () => ({ ok: true }))

// Register routes
await app.register(authRoutes, { prefix: '/auth/v1' })
await app.register(checkoutRoutes, { prefix: '/api/v1/checkout' })
await app.register(orderStatusRoutes, { prefix: '/api/v1/orders' })
await app.register(orderDispatchRoutes, { prefix: '/api/v1/orders' })
await app.register(driverRoutes, { prefix: '/api/v1' })
await app.register(stripeWebhookRoutes) 
await app.register(paymentRoutes)  
// Media routes are consumed by the web app via Vite proxy at `/api/*`,
// but are also used directly in some places without the `/api` prefix.
// Register both to avoid dev/prod path mismatches.
await app.register(mediaRoutes)
await app.register(mediaRoutes, { prefix: '/api' })
await app.register(realtimeRoutes) 
await app.register(riverRoutes)    
await app.register(geocodingRoutes) 
await app.register(tipRoutes)      
await app.register(affiliateRoutes, { prefix: '/api' }) 
await app.register(deliveryZoneRoutes) 
await app.register(storeReadinessRoutes) 
await app.register(vendorVerificationRoutes) 
await app.register(exportRoutes) 
await app.register(vendorPayoutRoutes) 
await app.register(vendorAffiliateSalesRoutes)
await app.register(teamRoutes) 
await app.register(promotionEnhancedRoutes) 
await app.register(orderCancellationRoutes) 
await app.register(favoritesRoutes)

// Item analytics must register before `/items/:id` so `/items/analytics` is not parsed as an id.
await app.register(itemAnalyticsRoutes)

// Auto-register all resources (promotions, stores, items, carts, addresses, orders, posts)
await registerAllResources(app, ALL_RESOURCES)

// Register search routes at the end to avoid conflicts
await app.register(searchUnifiedRoutes)
await app.register(tagsRoutes)

// Wire up order service to realtime broker
setOrderServiceBroadcast((topic, event) => {
  realtimeBroker.publish(topic, event)
})

// Wire up tip service to realtime broker
setTipServiceBroadcast((topic, event) => {
  realtimeBroker.publish(topic, event)
})

// Register global error handler
app.setErrorHandler(globalErrorHandler)

// Set up uncaught exception handlers
process.on('uncaughtException', handleUncaughtException)
process.on('unhandledRejection', handleUnhandledRejection)

const port = env.PORT

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port, host: '0.0.0.0' }).then(() => {
    app.log.info(`listening on http://localhost:${port}`)
    app.log.info(`docs at http://localhost:${port}/docs`)
  })
}

export async function createApp() {
  return app
}
