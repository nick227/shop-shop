/**
 * Real-time Broker - Pub/Sub for WebSocket events
 * 
 * In-memory implementation for single instance
 * Can be swapped to Redis Pub/Sub for multi-instance scaling
 */

import type { WebSocket } from 'ws'

export interface RealtimeEvent {
  type: string
  topic: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface RealtimeBroker {
  subscribe(topic: string, ws: WebSocket): void
  unsubscribe(topic: string, ws: WebSocket): void
  unsubscribeAll(ws: WebSocket): void
  publish(topic: string, event: Omit<RealtimeEvent, 'topic'>): void
  getSubscriberCount(topic: string): number
  getAllTopics(): string[]
}

class InMemoryBroker implements RealtimeBroker {
  private subscriptions = new Map<string, Set<WebSocket>>()
  private clientSubscriptions = new Map<WebSocket, Set<string>>()

  subscribe(topic: string, ws: WebSocket): void {
    // Add to topic → clients mapping
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set())
    }
    this.subscriptions.get(topic)!.add(ws)

    // Add to client → topics mapping (for cleanup)
    if (!this.clientSubscriptions.has(ws)) {
      this.clientSubscriptions.set(ws, new Set())
    }
    this.clientSubscriptions.get(ws)!.add(topic)

    console.log(`[Broker] Client subscribed to topic: ${topic}`)
  }

  unsubscribe(topic: string, ws: WebSocket): void {
    this.subscriptions.get(topic)?.delete(ws)
    this.clientSubscriptions.get(ws)?.delete(topic)

    // Clean up empty topic
    if (this.subscriptions.get(topic)?.size === 0) {
      this.subscriptions.delete(topic)
    }

    console.log(`[Broker] Client unsubscribed from topic: ${topic}`)
  }

  unsubscribeAll(ws: WebSocket): void {
    const topics = this.clientSubscriptions.get(ws)
    if (topics) {
      topics.forEach(topic => {
        this.subscriptions.get(topic)?.delete(ws)
      })
      this.clientSubscriptions.delete(ws)
    }

    console.log(`[Broker] Client unsubscribed from all topics`)
  }

  publish(topic: string, event: Omit<RealtimeEvent, 'topic'>): void {
    const subscribers = this.subscriptions.get(topic)
    if (!subscribers || subscribers.size === 0) {
      return
    }

    const message: RealtimeEvent = {
      ...event,
      topic,
      timestamp: event.timestamp || new Date().toISOString(),
    }

    const messageStr = JSON.stringify(message)
    let sentCount = 0

    subscribers.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(messageStr)
        sentCount++
      }
    })

    console.log(`[Broker] Published ${event.type} to ${topic} (${sentCount} subscribers)`)
  }

  getSubscriberCount(topic: string): number {
    return this.subscriptions.get(topic)?.size || 0
  }

  getAllTopics(): string[] {
    return Array.from(this.subscriptions.keys())
  }
}

// Singleton instance
export const realtimeBroker = new InMemoryBroker()

