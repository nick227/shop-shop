export declare class StoreDomain {
    /**
     * Generate URL-safe slug from store name
     */
    generateSlug(name: string, suffix?: string): string;
    /**
     * Prepare store data for creation
     */
    prepareForCreation(input: unknown, userId: string): Record<string, unknown>;
    /**
     * Validate store is accepting orders
     */
    canAcceptOrders(store: {
        isPublished: boolean;
        deliveryEnabled: boolean;
        pickupEnabled: boolean;
        status?: 'ACTIVE' | 'PAUSED' | 'DISABLED';
    }): {
        valid: boolean;
        reason?: string;
    };
}
//# sourceMappingURL=store.domain.d.ts.map