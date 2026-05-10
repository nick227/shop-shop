/**
 * Real-time WebSocket Route
 * Handles WebSocket connections for order notifications
 */

import type { FastifyInstance } from 'fastify'
import type { WebSocket } from 'ws'
import fastifyWebsocket from '@fastify/websocket'
import { verifyJWT } from '@packages/db'
import { realtimeBroker } from '../services/realtime.broker.js'

const PROTOCOL_VERSION = 1
const PING_INTERVAL = 30000 // 30 seconds

export const realtimeRoutes = async (app: FastifyInstance) => {
  // Register WebSocket plugin
  await app.register(fastifyWebsocket)

  // WebSocket route
  app.get('/realtime', { websocket: true }, (connection, req) => {
    const socket = connection.socket as WebSocket
    const clientId = Math.random().toString(36).substring(7)

    app.log.info(`[Realtime] Client ${clientId} connecting`)

    // Authenticate
    const query = req.query as { token?: string }
    const token = query.token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      app.log.warn(`[Realtime] Client ${clientId} - no token provided`)
      socket.close(4401, 'Unauthorized: No token provided')
      return
    }

    let decoded: { userId: string; role: string } | null
    try {
      decoded = verifyJWT(token)
      if (!decoded) {
        app.log.warn(`[Realtime] Client ${clientId} - invalid token`)
        socket.close(4401, 'Unauthorized: Invalid token')
        return
      }
    } catch (error) {
      app.log.warn(`[Realtime] Client ${clientId} - token verification failed`)
      socket.close(4401, 'Unauthorized: Token verification failed')
      return
    }

    const userId = decoded.userId
    const userRole = decoded.role

    app.log.info(`[Realtime] Client ${clientId} authenticated as user ${userId} (${userRole})`)

    const subscriptions = new Set<string>()
    let pingInterval: NodeJS.Timeout | null = null

    // Handle incoming messages
    socket.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // Hello handshake
        if (message.type === 'hello') {
          socket.send(JSON.stringify({
            type: 'ack',
            version: PROTOCOL_VERSION,
            pingInterval: PING_INTERVAL,
            clientId,
          }))
          app.log.info(`[Realtime] Client ${clientId} - handshake complete`)
        }

        // Subscribe to topic
        if (message.type === 'subscribe') {
          const topic: string = message.topic

          // Validate topic permissions
          if (topic.startsWith('vendor:')) {
            const storeId = topic.split(':')[1]
            
            // Check if user is VENDOR/ADMIN role OR owns the store
            if (userRole === 'VENDOR' || userRole === 'ADMIN') {
              realtimeBroker.subscribe(topic, socket)
              subscriptions.add(topic)
              socket.send(JSON.stringify({ type: 'subscribed', topic }))
              app.log.info(`[Realtime] Client ${clientId} subscribed to ${topic}`)
            } else {
              // Verify user owns this store (for USER role)
              const { prisma } = await import('@packages/db')
              const store = await prisma.store.findFirst({
                where: {
                  id: storeId,
                  ownerUserId: userId,
                },
                select: { id: true },
              })
              
              if (store) {
                realtimeBroker.subscribe(topic, socket)
                subscriptions.add(topic)
                socket.send(JSON.stringify({ type: 'subscribed', topic }))
                app.log.info(`[Realtime] Client ${clientId} (store owner) subscribed to ${topic}`)
              } else {
                socket.send(JSON.stringify({
                  type: 'error',
                  message: 'Unauthorized topic',
                  code: 'FORBIDDEN_TOPIC',
                }))
                app.log.warn(`[Realtime] Client ${clientId} - unauthorized topic: ${topic}`)
              }
            }
          }
          else if (topic.startsWith('customer:') && topic === `customer:${userId}`) {
            // Customer can only subscribe to their own topic
            realtimeBroker.subscribe(topic, socket)
            subscriptions.add(topic)
            socket.send(JSON.stringify({ type: 'subscribed', topic }))
            app.log.info(`[Realtime] Client ${clientId} subscribed to ${topic}`)
          }
          else if (topic.startsWith('order:')) {
            // TODO: Verify user has access to this order
            realtimeBroker.subscribe(topic, socket)
            subscriptions.add(topic)
            socket.send(JSON.stringify({ type: 'subscribed', topic }))
            app.log.info(`[Realtime] Client ${clientId} subscribed to ${topic}`)
          }
          else if (topic.startsWith('admin:') && userRole === 'ADMIN') {
            realtimeBroker.subscribe(topic, socket)
            subscriptions.add(topic)
            socket.send(JSON.stringify({ type: 'subscribed', topic }))
            app.log.info(`[Realtime] Client ${clientId} subscribed to ${topic}`)
          }
          else {
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized topic',
              code: 'FORBIDDEN_TOPIC',
            }))
            app.log.warn(`[Realtime] Client ${clientId} - unauthorized topic: ${topic}`)
          }
        }

        // Unsubscribe from topic
        if (message.type === 'unsubscribe') {
          const topic: string = message.topic
          realtimeBroker.unsubscribe(topic, socket)
          subscriptions.delete(topic)
          app.log.info(`[Realtime] Client ${clientId} unsubscribed from ${topic}`)
        }

        // Ping response
        if (message.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }))
        }
      } catch (error) {
        app.log.error({ err: error, clientId }, '[Realtime] Client message handling error')
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          code: 'INVALID_MESSAGE',
        }))
      }
    })

    // Heartbeat (server-initiated ping)
    pingInterval = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.ping()
      }
    }, PING_INTERVAL)

    socket.on('pong', () => {
      // Client is alive
    })

    // Handle errors
    socket.on('error', (error) => {
      app.log.error({ err: error, clientId }, '[Realtime] Client error')
    })

    // Cleanup on close
    socket.on('close', (code, reason) => {
      app.log.info(`[Realtime] Client ${clientId} disconnected (code: ${code}, reason: ${reason.toString()})`)
      
      // Cleanup
      if (pingInterval) {
        clearInterval(pingInterval)
      }
      
      // Unsubscribe from all topics
      realtimeBroker.unsubscribeAll(socket)
    })
  })

  app.log.info('[Realtime] WebSocket route registered at /realtime')
}

