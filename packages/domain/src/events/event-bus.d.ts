type EventHandler = (payload: unknown) => Promise<void>;
export declare class EventBus {
    private handlers;
    /**
     * Register an event handler
     */
    on(event: string, handler: EventHandler): void;
    /**
     * Remove an event handler
     */
    off(event: string, handler: EventHandler): void;
    /**
     * Emit an event to all registered handlers
     */
    emit(event: string, payload: unknown): Promise<void>;
    /**
     * Clear all handlers for an event
     */
    clear(event?: string): void;
}
export declare const eventBus: EventBus;
export declare const DomainEvents: {
    readonly PROMOTION_CREATED: "promotion.created";
    readonly PROMOTION_UPDATED: "promotion.updated";
    readonly PROMOTION_DELETED: "promotion.deleted";
    readonly STORE_CREATED: "store.created";
    readonly STORE_UPDATED: "store.updated";
    readonly STORE_PUBLISHED: "store.published";
    readonly ORDER_PLACED: "order.placed";
    readonly ORDER_STATUS_CHANGED: "order.status.changed";
    readonly ORDER_COMPLETED: "order.completed";
    readonly ORDER_CANCELED: "order.canceled";
    readonly ITEM_CREATED: "item.created";
    readonly ITEM_UNAVAILABLE: "item.unavailable";
};
export type DomainEvent = typeof DomainEvents[keyof typeof DomainEvents];
export {};
//# sourceMappingURL=event-bus.d.ts.map