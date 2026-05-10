// ========================================
// Event Bus
// Decouples side effects from core business logic
// ========================================
export class EventBus {
    handlers = new Map();
    /**
     * Register an event handler
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }
    /**
     * Remove an event handler
     */
    off(event, handler) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    /**
     * Emit an event to all registered handlers
     */
    async emit(event, payload) {
        const handlers = this.handlers.get(event) || [];
        // Execute all handlers in parallel
        await Promise.all(handlers.map(async (handler) => {
            try {
                await handler(payload);
            }
            catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
                // Don't throw - allow other handlers to run
            }
        }));
    }
    /**
     * Clear all handlers for an event
     */
    clear(event) {
        if (event) {
            this.handlers.delete(event);
        }
        else {
            this.handlers.clear();
        }
    }
}
// Singleton instance
export const eventBus = new EventBus();
// Domain event names
export const DomainEvents = {
    // Promotion events
    PROMOTION_CREATED: 'promotion.created',
    PROMOTION_UPDATED: 'promotion.updated',
    PROMOTION_DELETED: 'promotion.deleted',
    // Store events
    STORE_CREATED: 'store.created',
    STORE_UPDATED: 'store.updated',
    STORE_PUBLISHED: 'store.published',
    // Order events
    ORDER_PLACED: 'order.placed',
    ORDER_STATUS_CHANGED: 'order.status.changed',
    ORDER_COMPLETED: 'order.completed',
    ORDER_CANCELED: 'order.canceled',
    // Item events
    ITEM_CREATED: 'item.created',
    ITEM_UNAVAILABLE: 'item.unavailable',
};
